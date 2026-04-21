import type { Job } from 'bullmq';

export async function processImageRender(job: Job): Promise<void> {
  console.log(`[image-render] processing job ${job.id}`, job.data);
}
