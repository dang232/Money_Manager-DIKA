# AI Service Upgrade Design

**Date:** 2026-07-01
**Author:** AI Service Analysis
**Status:** Draft

---

## Context

The `ai-service` is a NestJS microservice that provides AI-powered category suggestions for transactions. It currently:
- Uses Groq API (Llama 3.1 8B) with a hardcoded adapter
- Has no tests
- Lacks production-grade security (no ConfigModule, no .env.example)
- Hardcodes all configuration values
- Missing prompt engineering for Money Manager domain

**Goal:** Make it production-ready with custom provider support, proper security, and app-specific prompt engineering.

---

## Goals

1. **Production-ready security** — Match auth-service security patterns
2. **Custom provider support** — Add as second provider option in factory
3. **Full env-based config** — No hardcoded values
4. **Domain-specific prompts** — Engineered for Money Manager app context
5. **Reliability** — Timeout, retry, fallback handling
6. **Testability** — Unit tests for handler and adapters

---

## Architecture

### Provider Selection

```
Factory reads AI_PROVIDER_TYPE env:
├── "anthropic"   → AnthropicAdapter (new)
├── "groq"        → GroqAdapter (existing, refactor)
├── "custom"      → CustomAdapter (new)
└── "mock"        → MockAiAdapter (existing)
```

### Endpoint Details

**Anthropic Proxy Endpoint:**
- Base URL: `https://api.anthropic.com/api/claude/web`
- Auth: Bearer token via `AI_API_KEY`
- Format: Anthropic Messages API (`/v1/messages`)
- Model: Configurable via `AI_MODEL_NAME` (default: `claude-sonnet-4-20250514`)

### New Directory Structure

```
ai-service/src/
├── app.module.ts
├── main.ts
├── config/
│   └── ai.config.ts           # Env validation & config object
├── domain/interfaces/
│   └── ai-provider.port.ts    # Unchanged
├── infrastructure/providers/
│   ├── ai-provider.factory.ts  # Refactor to use AI_PROVIDER_TYPE
│   ├── anthropic.adapter.ts    # New: Anthropic API via proxy
│   ├── groq.adapter.ts         # Refactor to use config
│   ├── custom.adapter.ts       # New: custom REST provider
│   └── mock-ai.adapter.ts      # Unchanged
├── application/
│   ├── commands/
│   │   └── suggest-category.command.ts
│   ├── handlers/
│   │   └── suggest-category.handler.ts   # Refactor threshold from config
│   └── consumers/
│       └── transaction-created.consumer.ts
└── presentation/controllers/
    ├── ai.controller.ts        # Add validate endpoint
    └── health.controller.ts
```

---

## Configuration Schema

### ai.config.ts

```typescript
// ConfigModule pattern matching auth-service
export const aiConfig = registerAs('ai', () => {
  const providerType = process.env['AI_PROVIDER_TYPE'] ?? 'mock';
  const isProd = process.env['NODE_ENV'] === 'production';

  // Validate required fields based on provider
  if (providerType !== 'mock') {
    if (isProd && !process.env['AI_API_KEY']) {
      throw new Error('AI_API_KEY is required in production');
    }
    if (isProd && !process.env['AI_API_BASE_URL']) {
      throw new Error('AI_API_BASE_URL is required in production');
    }
  }

  return {
    providerType: providerType as 'anthropic' | 'groq' | 'custom' | 'mock',
    apiKey: process.env['AI_API_KEY'] ?? '',
    apiBaseUrl: process.env['AI_API_BASE_URL'] ?? 'https://api.anthropic.com/api/claude/web',
    modelName: process.env['AI_MODEL_NAME'] ?? 'claude-sonnet-4-20250514',
    maxTokens: Number(process.env['AI_MAX_TOKENS'] ?? 200),
    timeoutMs: Number(process.env['AI_TIMEOUT_MS'] ?? 5000),
    confidenceThreshold: Number(process.env['AI_CONFIDENCE_THRESHOLD'] ?? 0.7),
    budgetServiceUrl: process.env['BUDGET_SERVICE_URL'] ?? 'http://localhost:3002',
  };
});
```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AI_PROVIDER_TYPE` | No | `mock` | `anthropic`, `groq`, `custom`, or `mock` |
| `AI_API_KEY` | Yes* | - | API key for Anthropic/Custom (*required in production) |
| `AI_API_BASE_URL` | Yes* | `https://api.anthropic.com/api/claude/web` | Anthropic proxy endpoint |
| `AI_MODEL_NAME` | No | `claude-sonnet-4-20250514` | Anthropic model (e.g., claude-sonnet-4-20250514, claude-3-5-sonnet-20241022) |
| `AI_MAX_TOKENS` | No | `200` | Max response tokens |
| `AI_TIMEOUT_MS` | No | `5000` | Request timeout in ms |
| `AI_CONFIDENCE_THRESHOLD` | No | `0.7` | Min confidence to auto-apply |
| `BUDGET_SERVICE_URL` | No | `http://localhost:3002` | Budget service endpoint |
| `PORT` | No | `3003` | Service port |
| `NODE_ENV` | No | `development` | `development` or `production` |

---

## Components

### 1. Anthropic Adapter

```typescript
// anthropic.adapter.ts
export class AnthropicAdapter implements AiProviderPort {
  constructor(private readonly config: ConfigType<typeof aiConfig>) {}

  async suggestCategory(
    description: string,
    categories: CategoryInfo[]
  ): Promise<CategorySuggestion> {
    const prompt = this.buildPrompt(description, categories);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const res = await fetch(`${this.config.apiBaseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.config.modelName,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: this.config.maxTokens,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        return this.fallback(categories);
      }

      const data = await res.json() as any;
      const content = data.content?.[0]?.text ?? '';
      return this.parseResponse(content, categories);
    } catch {
      clearTimeout(timeout);
      return this.fallback(categories);
    }
  }

  private buildPrompt(description: string, categories: CategoryInfo[]): string {
    // Domain-specific prompt engineering (see Prompt section)
  }

  private parseResponse(content: string, categories: CategoryInfo[]): CategorySuggestion {
    // Extract JSON, validate, fallback on error
  }

  private fallback(categories: CategoryInfo[]): CategorySuggestion {
    return {
      categoryId: categories[0].id,
      categoryName: categories[0].name,
      confidence: 0.3,
      reasoning: 'fallback',
    };
  }
}
```

### 2. Custom Adapter

```typescript
// custom.adapter.ts
// Same structure as AnthropicAdapter but for generic REST endpoints
// Uses OpenAI-compatible format by default
export class CustomAdapter implements AiProviderPort {
  // ...
}
```

### 3. Updated Factory

```typescript
export const aiProviderFactory: Provider = {
  provide: AI_PROVIDER,
  inject: [aiConfig.KEY],
  useFactory: (config: ConfigType<typeof aiConfig>) => {
    switch (config.providerType) {
      case 'anthropic':
        return new AnthropicAdapter(config);
      case 'groq':
        return new GroqAdapter(config);
      case 'custom':
        return new CustomAdapter(config);
      case 'mock':
      default:
        return new MockAiAdapter();
    }
  },
};
```

### 4. Updated Handler

```typescript
export class SuggestCategoryHandler {
  constructor(
    @Inject(AI_PROVIDER) private readonly aiProvider: AiProviderPort,
    @Inject(EVENT_BUS_PORT) private readonly eventBus: EventBusPort,
    @Inject(aiConfig.KEY) private readonly config: ConfigType<typeof aiConfig>,
  ) {}

  async execute(cmd: SuggestCategoryCommand): Promise<CategorySuggestion> {
    const suggestion = await this.aiProvider.suggestCategory(cmd.description, cmd.categories);

    // Use config threshold instead of hardcoded 0.7
    if (suggestion.confidence > this.config.confidenceThreshold) {
      await this.eventBus.publish(SUGGESTION_TOPIC, {
        ...createEventMeta(cmd.transactionId),
        eventType: 'ai.category.suggested',
        payload: {
          transactionId: cmd.transactionId,
          userId: cmd.userId,
          categoryId: suggestion.categoryId,
          categoryName: suggestion.categoryName,
          confidence: suggestion.confidence,
        },
      });
    }

    return suggestion;
  }
}
```

### 4. Updated App Module

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventBusModule.forRoot(),
    LoggerModule,
  ],
  // ... controllers and providers
})
export class AppModule {}
```

---

## Prompt Engineering

### System Prompt for Money Manager

```
You are a financial categorization assistant for the Money Manager app.
Your task is to categorize transaction descriptions into one of the available categories.

Available categories:
{categories_list}

Rules:
1. Analyze the transaction description for keywords and patterns
2. Match to the most appropriate category based on meaning, not just word matching
3. Common patterns:
   - "coffee", "restaurant", "lunch", "dinner", "food" → Food & Dining
   - "uber", "lyft", "bus", "train", "gas", "fuel" → Transportation
   - "netflix", "spotify", "subscription" → Entertainment
   - "salary", "paycheck", "deposit" → Income
   - "electric", "water", "internet", "phone bill" → Bills & Utilities
4. If uncertain, choose the closest match with lower confidence
5. NEVER invent categories not in the list

Respond with JSON only:
{"categoryId": "...", "categoryName": "...", "confidence": 0.0-1.0, "reasoning": "..."}
```

### Example User Prompt

```
Transaction description: "Starbucks coffee on Main St"
Available categories:
{id:"cat1", name:"Food & Dining", type:"expense"},
{id:"cat2", name:"Transportation", type:"expense"},
{id:"cat3", name:"Entertainment", type:"expense"}

Categorize this transaction.
```

---

## Security Checklist

| Requirement | Implementation |
|-------------|----------------|
| ConfigModule global | `ConfigModule.forRoot({ isGlobal: true })` |
| Env validation | Required vars checked in config factory |
| Production guard | Throw if critical env missing in production |
| No hardcoded secrets | All from env |
| ValidationPipe | Global whitelist + transform |
| ApiExceptionFilter | Already registered |
| Logger injection | Via `LOGGER_TOKEN` |
| Request timeout | 5s (configurable) |
| Error differentiation | Log distinct error types |

---

## Error Handling

| Error Type | Behavior |
|------------|----------|
| API timeout | Fallback to first category, confidence 0.1 |
| API 4xx | Fallback, log warning |
| API 5xx | Fallback, log error |
| Parse failure | Fallback, log warning |
| Network error | Fallback, log error |

---

## .env.example

```bash
# AI Service Configuration
AI_PROVIDER_TYPE=anthropic       # anthropic, groq, custom, or mock
AI_API_KEY=your-api-key-here     # Bearer token for Anthropic proxy
AI_API_BASE_URL=https://api.anthropic.com/api/claude/web
AI_MODEL_NAME=claude-sonnet-4-20250514
AI_MAX_TOKENS=200
AI_TIMEOUT_MS=5000
AI_CONFIDENCE_THRESHOLD=0.7

# Service Configuration
BUDGET_SERVICE_URL=http://localhost:3002
PORT=3003
NODE_ENV=development
```

---

## Testing Strategy

| Component | Test Type | Coverage |
|-----------|-----------|----------|
| `suggest-category.handler` | Unit | Happy path, low confidence, fallback |
| `groq.adapter` | Unit | Success, timeout, parse error, 4xx, 5xx |
| `custom.adapter` | Unit | Success, timeout, parse error, network error |
| `ai-provider.factory` | Unit | Provider selection logic |
| `ai.config` | Unit | Validation, defaults, production check |

---

## Implementation Order

1. **Config** — Create `ai.config.ts`, update `app.module.ts`, add `.env.example`
2. **Anthropic Adapter** — New file with Anthropic Messages API via proxy
3. **Factory Refactor** — Update to use config for provider selection
4. **Groq Adapter Refactor** — Use config instead of hardcoded values
5. **Handler Refactor** — Inject config for threshold
6. **Prompt Update** — Update adapters with Money Manager domain prompt
7. **Tests** — Add unit tests for all components
8. **main.ts** — Add ValidationPipe (if missing)

---

## Open Questions

- [x] ~~What is the exact endpoint format for the custom provider?~~ → Anthropic Messages API via `https://api.anthropic.com/api/claude/web`
- [x] ~~Does the custom provider expect OpenAI-compatible format or custom JSON structure?~~ → Anthropic Messages API format
- [ ] Should we add retry logic (with exponential backoff)?
- [ ] Any specific categories the Money Manager app uses that should be in the prompt examples?
