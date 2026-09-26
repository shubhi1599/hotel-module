import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp();

app.listen(env.port, () => {
  console.info(`Hotel module listening on port ${env.port}`);
});
