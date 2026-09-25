import { env } from '../config/env.js';
import {
  QUEUE_ANOMALY,
  anomalyQueue,
  createWorker,
  registerWorker,
} from '../config/queue.js';
import { runAnomalyDetection } from '../services/anomaly.service.js';

/**
 * Boot the anomaly detection worker and schedule the repeatable job.
 *
 * The repeatable interval is controlled by AI_ANOMALY_INTERVAL_HOURS.
 * Setting it to 0 disables the scheduler (worker still processes
 * one-off manual triggers via the admin API).
 */
export async function startAnomalyWorker(): Promise<void> {
  const worker = createWorker(QUEUE_ANOMALY, async () => {
    await runAnomalyDetection();
  });
  registerWorker(worker);

  const intervalHours = env.AI_ANOMALY_INTERVAL_HOURS;
  if (intervalHours > 0) {
    // Remove old repeatable jobs (schedule may have changed)
    const existing = await anomalyQueue.getRepeatableJobs();
    for (const job of existing) {
      await anomalyQueue.removeRepeatableByKey(job.key);
    }

    await anomalyQueue.add(
      'anomaly-sweep',
      {},
      {
        repeat: { every: intervalHours * 60 * 60 * 1000 },
        removeOnComplete: true,
      },
    );
    console.log(`[startup] Anomaly detection scheduled every ${intervalHours}h`);
  } else {
    console.log('[startup] Anomaly detection scheduler disabled (AI_ANOMALY_INTERVAL_HOURS=0)');
  }
}

/**
 * Trigger a one-off anomaly sweep (admin API).
 */
export async function triggerAnomalySweep(): Promise<void> {
  await anomalyQueue.add('anomaly-sweep-manual', {}, { removeOnComplete: true });
}
