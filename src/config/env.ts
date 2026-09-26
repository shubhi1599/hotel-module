import 'dotenv/config';

function readPort(value: string | undefined, fallback: number): number {
  const port = Number(value ?? fallback);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('APP_PORT must be a valid TCP port.');
  }

  return port;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: readPort(process.env.APP_PORT, 3000),
};
