import cron, { type ScheduledTask } from 'node-cron';
import { redis } from '../config/redis.js';
import * as payoutService from '../services/payout.service.js';
import * as settingsService from '../services/platform-settings.service.js';

/**
 * Payout batch scheduler — configurable via PlatformSettings.
 *
 * Reads `payout_batch_time` (HH:MM IST, default "18:00") and
 * `payout_enabled` (boolean, default true) from PlatformSettings.
 *
 * A secondary hourly cron re-reads settings and restarts the task
 * if the schedule changed or the enabled flag toggled.
 */

const SCHEDULER_LOCK_KEY = 'payout_scheduler_active';
const DEFAULT_BATCH_TIME = '18:00'; // IST

let activeTask: ScheduledTask | null = null;
let currentSchedule: string | null = null;

/**
 * Convert "HH:MM" IST to a UTC cron expression.
 * IST = UTC + 5:30.
 * Returns null if the input is malformed.
 */
export function istTimeToCron(hhMm: string): string | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhMm.trim());
  if (!match) return null;

  let h = Number(match[1]);
  let m = Number(match[2]);
  if (h > 23 || m > 59) return null;

  // IST → UTC: subtract 5h30m
  m -= 30;
  if (m < 0) {
    m += 60;
    h -= 1;
  }
  h -= 5;
  if (h < 0) h += 24;

  return `${m} ${h} * * *`;
}

async function readScheduleFromSettings(): Promise<{
  enabled: boolean;
  cronExpr: string;
  istTime: string;
}> {
  const enabled = await settingsService.getSettingBoolean('payout_enabled').catch(() => true);
  const istTime = (await settingsService.getSetting('payout_batch_time').catch(() => null)) ?? DEFAULT_BATCH_TIME;
  const cronExpr = istTimeToCron(istTime) ?? istTimeToCron(DEFAULT_BATCH_TIME)!;
  return { enabled, cronExpr, istTime };
}

async function runBatch(): Promise<void> {
  // Re-check enabled right before each run
  const enabled = await settingsService.getSettingBoolean('payout_enabled').catch(() => true);
  if (!enabled) {
    console.log('[payout-scheduler] payout_enabled=false — skipping batch');
    return;
  }

  console.log('[payout-scheduler] triggered at', new Date().toISOString());

  // Single-instance guard via Redis SETNX
  const acquired = await redis.set(SCHEDULER_LOCK_KEY, '1', 'EX', 300, 'NX');
  if (!acquired) {
    console.log('[payout-scheduler] another instance is running — skipping');
    return;
  }

  try {
    const batches = await payoutService.runPayoutBatch();
    console.log(`[payout-scheduler] completed: ${batches.length} batch(es) processed`);
  } catch (err) {
    console.error('[payout-scheduler] error:', (err as Error).message);
  } finally {
    await redis.del(SCHEDULER_LOCK_KEY);
  }
}

function stopActiveTask(): void {
  if (activeTask) {
    activeTask.stop();
    activeTask = null;
    currentSchedule = null;
  }
}

function startTask(cronExpr: string, istTime: string): void {
  stopActiveTask();
  activeTask = cron.schedule(cronExpr, () => void runBatch());
  activeTask.start();
  currentSchedule = cronExpr;
  console.log(`[startup] Payout scheduler started (${istTime} IST → ${cronExpr} UTC)`);
}

/**
 * Main entry point — called once at server boot.
 * Reads settings, starts the batch cron, and spins up a secondary
 * hourly cron that re-reads settings and hot-reloads the schedule.
 */
export async function startPayoutScheduler(): Promise<void> {
  const { enabled, cronExpr, istTime } = await readScheduleFromSettings();

  if (enabled) {
    startTask(cronExpr, istTime);
  } else {
    console.log('[startup] Payout scheduler disabled (payout_enabled=false)');
  }

  // Secondary hourly cron: re-read settings, restart if changed
  cron.schedule('0 * * * *', async () => {
    try {
      const latest = await readScheduleFromSettings();

      if (!latest.enabled) {
        if (activeTask) {
          console.log('[payout-scheduler] payout_enabled toggled OFF — stopping task');
          stopActiveTask();
        }
        return;
      }

      if (!activeTask || latest.cronExpr !== currentSchedule) {
        console.log(`[payout-scheduler] schedule changed → restarting (${latest.istTime} IST)`);
        startTask(latest.cronExpr, latest.istTime);
      }
    } catch (err) {
      console.error('[payout-scheduler] hourly re-read failed:', (err as Error).message);
    }
  });
}
