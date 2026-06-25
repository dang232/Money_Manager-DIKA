// ponytail: LoggerModule — global NestJS module providing winston logger
import { Global, Module } from '@nestjs/common';
import { createLogger } from './winston-loki.config';
import winston from 'winston';

export const LOGGER_TOKEN = 'WINSTON_LOGGER';

@Global()
@Module({
  providers: [
    {
      provide: LOGGER_TOKEN,
      useFactory: (): winston.Logger => createLogger(),
    },
  ],
  exports: [LOGGER_TOKEN],
})
export class LoggerModule {}
