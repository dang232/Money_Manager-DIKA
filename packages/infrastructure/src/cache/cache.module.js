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
var CacheModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheModule = exports.CACHE_PORT = void 0;
// ponytail: CacheModule — NestJS DynamicModule wrapping RedisCacheAdapter
const common_1 = require("@nestjs/common");
const ioredis_1 = __importDefault(require("ioredis"));
const redis_cache_adapter_1 = require("./redis-cache.adapter");
exports.CACHE_PORT = 'CACHE_PORT';
let CacheModule = CacheModule_1 = class CacheModule {
    static forRoot(config) {
        const provider = {
            provide: exports.CACHE_PORT,
            useFactory: () => {
                const redis = new ioredis_1.default({
                    host: config.host,
                    port: config.port,
                    password: config.password,
                });
                return new redis_cache_adapter_1.RedisCacheAdapter(redis);
            },
        };
        return {
            module: CacheModule_1,
            providers: [provider],
            exports: [exports.CACHE_PORT],
        };
    }
};
exports.CacheModule = CacheModule;
exports.CacheModule = CacheModule = CacheModule_1 = __decorate([
    (0, common_1.Module)({})
], CacheModule);
//# sourceMappingURL=cache.module.js.map