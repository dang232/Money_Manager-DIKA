import { DynamicModule } from '@nestjs/common';
export interface CacheModuleConfig {
    host: string;
    port: number;
    password?: string;
}
export declare const CACHE_PORT = "CACHE_PORT";
export declare class CacheModule {
    static forRoot(config: CacheModuleConfig): DynamicModule;
}
//# sourceMappingURL=cache.module.d.ts.map