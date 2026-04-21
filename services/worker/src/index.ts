import { Worker } from 'bullmq';
import { processImageRender } from './jobs/image-render.job';
import { processShareExport } from './jobs/share-export.job';

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
const url = new URL(redisUrl);

const connection = {
  host: url.hostname,
  port: parseInt(url.port || '6379', 10),
};

new Worker('image-render', processImageRender, { connection });
new Worker('share-export', processShareExport, { connection });

console.log('Worker connected — listening for jobs');
