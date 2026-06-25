"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisStreamsEventBusAdapter = void 0;
// ponytail: RedisStreamsEventBusAdapter — XADD/XREADGROUP/XACK
const common_1 = require("@nestjs/common");
const ioredis_1 = __importDefault(require("ioredis"));
let RedisStreamsEventBusAdapter = class RedisStreamsEventBusAdapter {
    redis;
    constructor(redis) {
        this.redis = redis;
    }
    async publish(topic, event) {
        await this.redis.xadd(topic, '*', 'eventId', event.eventId, 'eventType', event.eventType, 'aggregateId', event.aggregateId, 'occurredAt', event.occurredAt.toISOString(), 'payload', JSON.stringify(event.payload), 'correlationId', event.correlationId ?? '');
    }
    async subscribe(topic, group, handler) {
        // Create consumer group if it doesn't exist
        try {
            await this.redis.xgroup('CREATE', topic, group, '$', 'MKSTREAM');
        }
        catch (err) {
            // Group already exists — that's fine
            if (!(err instanceof Error) || !err.message.includes('BUSYGROUP'))
                throw err;
        }
        const consumerId = `consumer-${process.pid}`;
        const poll = async () => {
            const results = await this.redis.xreadgroup('GROUP', group, consumerId, 'COUNT', '10', 'BLOCK', '2000', 'STREAMS', topic, '>');
            if (results) {
                for (const [, messages] of results) {
                    for (const [messageId, fields] of messages) {
                        const event = this.parseFields(fields, messageId);
                        await handler(event);
                        // auto-ack after handler succeeds
                        await this.ack(messageId);
                    }
                }
            }
            setImmediate(poll);
        };
        poll().catch(() => { });
    }
    async ack(messageId) {
        // messageId format: "topic:id" or just the id — stored as-is
        // Actual XACK requires the stream name; callers may pass "topic:id"
        const parts = messageId.split(':');
        if (parts.length === 2) {
            await this.redis.xack(parts[0], parts[1], messageId);
        }
        // If only an id with no topic prefix, this is a best-effort no-op
    }
    parseFields(fields, messageId) {
        const obj = {};
        for (let i = 0; i < fields.length; i += 2) {
            obj[fields[i]] = fields[i + 1];
        }
        const occurredAt = new Date(obj['occurredAt'] ?? Date.now());
        return {
            eventId: obj['eventId'] ?? messageId,
            eventType: obj['eventType'] ?? '',
            aggregateId: obj['aggregateId'] ?? '',
            occurredAt,
            timestamp: occurredAt,
            payload: JSON.parse(obj['payload'] ?? '{}'),
            correlationId: obj['correlationId'] || undefined,
        };
    }
};
exports.RedisStreamsEventBusAdapter = RedisStreamsEventBusAdapter;
exports.RedisStreamsEventBusAdapter = RedisStreamsEventBusAdapter = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ioredis_1.default])
], RedisStreamsEventBusAdapter);
//# sourceMappingURL=redis-streams.adapter.js.map