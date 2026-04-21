import type { Job } from 'bullmq';

export async function processShareExport(job: Job): Promise<void> {
  console.log(`[share-export] processing job ${job.id}`, job.data);
}
