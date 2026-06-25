// ponytail: unified API response envelope — single source of truth for all service responses
export class ApiResponse<T> {
  success!: boolean;
  data!: T | null;
  error!: { code: string; message: string } | null;
  meta!: {
    timestamp: string;
    version: string;
    correlationId?: string;
    pagination?: { page: number; limit: number; total: number; totalPages: number };
  };

  static ok<T>(data: T, meta?: Partial<ApiResponse<T>['meta']>): ApiResponse<T> {
    const response = new ApiResponse<T>();
    response.success = true;
    response.data = data;
    response.error = null;
    response.meta = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      ...meta,
    };
    return response;
  }

  static paginated<T>(
    data: T,
    pagination: { page: number; limit: number; total: number },
    meta?: Partial<ApiResponse<T>['meta']>,
  ): ApiResponse<T> {
    const response = new ApiResponse<T>();
    response.success = true;
    response.data = data;
    response.error = null;
    response.meta = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      ...meta,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: Math.ceil(pagination.total / pagination.limit),
      },
    };
    return response;
  }

  static error(code: string, message: string, meta?: Partial<ApiResponse<any>['meta']>): ApiResponse<null> {
    const response = new ApiResponse<null>();
    response.success = false;
    response.data = null;
    response.error = { code, message };
    response.meta = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      ...meta,
    };
    return response;
  }
}
