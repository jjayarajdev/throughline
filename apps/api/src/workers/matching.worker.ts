import {
  QUEUE_AI,
  aiQueue,
  createWorker,
  registerWorker,
} from '../config/queue.js';
import { extractJdCrux } from '../services/jd-extraction.service.js';

interface JdExtractionJob {
  roleId: string;
}

/**
 * Boot the matching AI worker. Processes JD extraction jobs from the
 * ai-processing queue (shared with future resume processing tasks).
 */
export async function startMatchingWorker(): Promise<void> {
  const worker = createWorker<JdExtractionJob>(QUEUE_AI, async (job) => {
    if (job.name === 'jd-extraction') {
      await extractJdCrux(job.data.roleId);
    }
  });
  registerWorker(worker);
  console.log('[startup] Matching AI worker started');
}

/**
 * Enqueue a JD extraction job. Called when a role with a JD is approved,
 * or manually by admin.
 */
export async function enqueueJdExtraction(roleId: string): Promise<void> {
  await aiQueue.add(
    'jd-extraction',
    { roleId },
    {
      removeOnComplete: true,
      attempts: 2,
      backoff: { type: 'exponential', delay: 5000 },
    },
  );
}
