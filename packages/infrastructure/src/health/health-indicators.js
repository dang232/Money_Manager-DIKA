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
exports.PostgresHealthIndicator = exports.RedisHealthIndicator = exports.KafkaHealthIndicator = void 0;
// ponytail: health indicators for Kafka, Redis, Postgres
const common_1 = require("@nestjs/common");
const terminus_1 = require("@nestjs/terminus");
const kafkajs_1 = require("kafkajs");
const ioredis_1 = __importDefault(require("ioredis"));
const pg_1 = require("pg");
let KafkaHealthIndicator = class KafkaHealthIndicator extends terminus_1.HealthIndicator {
    kafka;
    constructor(kafka) {
        super();
        this.kafka = kafka;
    }
    async isHealthy(key) {
        try {
            const admin = this.kafka.admin();
            await admin.connect();
            await admin.disconnect();
            return this.getStatus(key, true);
        }
        catch (err) {
            throw new terminus_1.HealthCheckError('Kafka check failed', this.getStatus(key, false, { error: String(err) }));
        }
    }
};
exports.KafkaHealthIndicator = KafkaHealthIndicator;
exports.KafkaHealthIndicator = KafkaHealthIndicator = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [kafkajs_1.Kafka])
], KafkaHealthIndicator);
let RedisHealthIndicator = class RedisHealthIndicator extends terminus_1.HealthIndicator {
    redis;
    constructor(redis) {
        super();
        this.redis = redis;
    }
    async isHealthy(key) {
        try {
            const pong = await this.redis.ping();
            if (pong !== 'PONG')
                throw new Error('unexpected ping response');
            return this.getStatus(key, true);
        }
        catch (err) {
            throw new terminus_1.HealthCheckError('Redis check failed', this.getStatus(key, false, { error: String(err) }));
        }
    }
};
exports.RedisHealthIndicator = RedisHealthIndicator;
exports.RedisHealthIndicator = RedisHealthIndicator = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ioredis_1.default])
], RedisHealthIndicator);
let PostgresHealthIndicator = class PostgresHealthIndicator extends terminus_1.HealthIndicator {
    pool;
    constructor(pool) {
        super();
        this.pool = pool;
    }
    async isHealthy(key) {
        try {
            const client = await this.pool.connect();
            await client.query('SELECT 1');
            client.release();
            return this.getStatus(key, true);
        }
        catch (err) {
            throw new terminus_1.HealthCheckError('Postgres check failed', this.getStatus(key, false, { error: String(err) }));
        }
    }
};
exports.PostgresHealthIndicator = PostgresHealthIndicator;
exports.PostgresHealthIndicator = PostgresHealthIndicator = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [pg_1.Pool])
], PostgresHealthIndicator);
//# sourceMappingURL=health-indicators.js.map