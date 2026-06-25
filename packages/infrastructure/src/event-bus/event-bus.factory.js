"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var EventBusModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventBusModule = exports.EVENT_BUS_PORT = void 0;
// ponytail: EventBusFactory — ENV-driven adapter selection, NestJS DynamicModule
const common_1 = require("@nestjs/common");
const ioredis_1 = __importDefault(require("ioredis"));
const kafka_adapter_1 = require("./kafka.adapter");
const redis_streams_adapter_1 = require("./redis-streams.adapter");
exports.EVENT_BUS_PORT = 'EVENT_BUS_PORT';
let EventBusModule = EventBusModule_1 = class EventBusModule {
    static forRoot(config = {}) {
        const adapter = config.adapter ?? process.env['EVENT_BUS_ADAPTER'] ?? 'kafka';
        const provider = adapter === 'redis-streams'
            ? {
                provide: exports.EVENT_BUS_PORT,
                useFactory: () => {
                    const redis = new ioredis_1.default({
                        host: config.redis?.host ?? 'localhost',
                        port: config.redis?.port ?? 6379,
                        password: config.redis?.password,
                    });
                    return new redis_streams_adapter_1.RedisStreamsEventBusAdapter(redis);
                },
            }
            : {
                provide: exports.EVENT_BUS_PORT,
                useFactory: () => {
                    const kafkaConfig = config.kafka ?? {
                        clientId: process.env['KAFKA_CLIENT_ID'] ?? 'money-manager',
                        brokers: (process.env['KAFKA_BROKERS'] ?? 'localhost:9092').split(','),
                    };
                    return new kafka_adapter_1.KafkaEventBusAdapter(kafkaConfig);
                },
            };
        return {
            module: EventBusModule_1,
            providers: [provider],
            exports: [exports.EVENT_BUS_PORT],
        };
    }
};
exports.EventBusModule = EventBusModule;
exports.EventBusModule = EventBusModule = EventBusModule_1 = __decorate([
    (0, common_1.Module)({})
], EventBusModule);
//# sourceMappingURL=event-bus.factory.js.map