"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEventMeta = createEventMeta;
// ponytail: EventBus port — publish domain events to messaging infra
const uuid_1 = require("../utils/uuid");
// helper to create base event fields
function createEventMeta(aggregateId) {
    const now = new Date();
    return { eventId: (0, uuid_1.generateUuid)(), aggregateId, timestamp: now, occurredAt: now };
}
//# sourceMappingURL=event-bus.port.js.map