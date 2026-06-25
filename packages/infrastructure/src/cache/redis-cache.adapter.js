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
exports.RedisCacheAdapter = void 0;
// ponytail: RedisCacheAdapter — JSON serialize/deserialize, SCAN-based invalidation
const common_1 = require("@nestjs/common");
const ioredis_1 = __importDefault(require("ioredis"));
let RedisCacheAdapter = class RedisCacheAdapter {
    redis;
    constructor(redis) {
        this.redis = redis;
    }
    async get(key) {
        const raw = await this.redis.get(key);
        if (raw === null)
            return null;
        return JSON.parse(raw);
    }
    async set(key, value, strategy, ttlSeconds) {
        const serialized = JSON.stringify(value);
        if (ttlSeconds !== undefined) {
            await this.redis.set(key, serialized, 'EX', ttlSeconds);
        }
        else {
            await this.redis.set(key, serialized);
        }
        // Store strategy as metadata key — lightweight, not critical
        await this.redis.set(`${key}:__strategy`, strategy);
    }
    async invalidate(pattern) {
        let cursor = '0';
        do {
            const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
            cursor = nextCursor;
            if (keys.length > 0) {
                await this.redis.del(...keys);
            }
        } while (cursor !== '0');
    }
    async del(key) {
        await this.redis.del(key);
    }
};
exports.RedisCacheAdapter = RedisCacheAdapter;
exports.RedisCacheAdapter = RedisCacheAdapter = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ioredis_1.default])
], RedisCacheAdapter);
//# sourceMappingURL=redis-cache.adapter.js.map