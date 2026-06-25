"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCorrelationId = generateCorrelationId;
// ponytail: correlation id for tracing requests across services
const uuid_1 = require("./uuid");
// prefix keeps correlation ids visually distinct in logs
function generateCorrelationId() {
    return `cor-${(0, uuid_1.generateUuid)()}`;
}
//# sourceMappingURL=correlation-id.js.map