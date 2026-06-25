// ponytail: winston + loki transport config
import winston from 'winston';
import LokiTransport from 'winston-loki';

export function createLogger(serviceName?: string): winston.Logger {
  const lokiHost = process.env['LOKI_HOST'] ?? 'http://loki:3100';
  const service = serviceName ?? process.env['SERVICE_NAME'] ?? 'money-manager';

  return winston.createLogger({
    level: process.env['LOG_LEVEL'] ?? 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json(),
    ),
    defaultMeta: { service },
    transports: [
      new winston.transports.Console(),
      new LokiTransport({
        host: lokiHost,
        labels: { service },
        json: true,
        format: winston.format.json(),
        replaceTimestamp: true,
        onConnectionError: (err) => console.error('Loki connection error', err),
      }),
    ],
  });
}
