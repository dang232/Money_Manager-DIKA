"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogger = createLogger;
// ponytail: winston + loki transport config
const winston_1 = __importDefault(require("winston"));
const winston_loki_1 = __importDefault(require("winston-loki"));
function createLogger(serviceName) {
    const lokiHost = process.env['LOKI_HOST'] ?? 'http://loki:3100';
    const service = serviceName ?? process.env['SERVICE_NAME'] ?? 'money-manager';
    return winston_1.default.createLogger({
        level: process.env['LOG_LEVEL'] ?? 'info',
        format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
        defaultMeta: { service },
        transports: [
            new winston_1.default.transports.Console(),
            new winston_loki_1.default({
                host: lokiHost,
                labels: { service },
                json: true,
                format: winston_1.default.format.json(),
                replaceTimestamp: true,
                onConnectionError: (err) => console.error('Loki connection error', err),
            }),
        ],
    });
}
//# sourceMappingURL=winston-loki.config.js.map