import { aiConfig, AI_CONFIG_KEY } from './ai.config';

describe('aiConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should have correct key', () => {
    expect(AI_CONFIG_KEY).toBe('AI_CONFIG');
  });

  it('should return mock provider when AI_PROVIDER_TYPE is mock', () => {
    process.env['AI_PROVIDER_TYPE'] = 'mock';
    const config = aiConfig();
    expect(config.providerType).toBe('mock');
    expect(config.apiKey).toBe('');
  });

  it('should return anthropic defaults when no env set', () => {
    delete process.env['AI_PROVIDER_TYPE'];
    const config = aiConfig();
    expect(config.providerType).toBe('mock'); // default
    expect(config.apiBaseUrl).toBe('https://api.anthropic.com/api/claude/web');
    expect(config.modelName).toBe('claude-sonnet-4-20250514');
    expect(config.maxTokens).toBe(200);
    expect(config.timeoutMs).toBe(5000);
    expect(config.confidenceThreshold).toBe(0.7);
    expect(config.budgetServiceUrl).toBe('http://localhost:3002');
  });

  it('should throw in production when AI_API_KEY missing for anthropic', () => {
    process.env['AI_PROVIDER_TYPE'] = 'anthropic';
    process.env['NODE_ENV'] = 'production';
    expect(() => aiConfig()).toThrow('AI_API_KEY is required in production');
  });

  it('should throw in production when AI_API_BASE_URL missing for anthropic', () => {
    process.env['AI_PROVIDER_TYPE'] = 'anthropic';
    process.env['NODE_ENV'] = 'production';
    process.env['AI_API_KEY'] = 'test-key';
    expect(() => aiConfig()).toThrow('AI_API_BASE_URL is required in production');
  });

  it('should not throw in development when env vars missing', () => {
    process.env['AI_PROVIDER_TYPE'] = 'anthropic';
    process.env['NODE_ENV'] = 'development';
    expect(() => aiConfig()).not.toThrow();
  });

  it('should parse numeric env vars correctly', () => {
    process.env['AI_MAX_TOKENS'] = '300';
    process.env['AI_TIMEOUT_MS'] = '10000';
    process.env['AI_CONFIDENCE_THRESHOLD'] = '0.8';
    const config = aiConfig();
    expect(config.maxTokens).toBe(300);
    expect(config.timeoutMs).toBe(10000);
    expect(config.confidenceThreshold).toBe(0.8);
  });
});
