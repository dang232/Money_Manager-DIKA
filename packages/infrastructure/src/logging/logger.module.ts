// ponytail: LoggerModule — global NestJS module providing winston logger
import { Global, Module } from '@nestjs/common';
import { createLogger } from './winston-loki.config';
import winston from 'winston';
import { LOGGER_TOKEN } from '@money-manager/shared-kernel';

export { LOGGER_TOKEN };

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
