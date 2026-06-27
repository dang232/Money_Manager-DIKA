// ponytail: shared DI tokens — colocate with the port interfaces they identify.
// Infrastructure package re-exports these for backward compatibility.
// String values must match what existing @Inject() callsites expect.
export const EVENT_BUS_PORT = 'EVENT_BUS_PORT';
export const CACHE_PORT = 'CACHE_PORT';
export const LOGGER_TOKEN = 'WINSTON_LOGGER';