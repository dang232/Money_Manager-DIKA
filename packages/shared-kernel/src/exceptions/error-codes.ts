// ponytail: centralized error catalog — one file, all codes, all messages.
// Services throw via DomainException.fromError(Errors.X).
// Frontend can import codes for error handling without coupling to backend internals.

export interface ErrorDef {
  readonly code: string;
  readonly message: string;
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export const AUTH_INVALID_CREDENTIALS: ErrorDef = { code: 'AUTH_INVALID_CREDENTIALS', message: 'Invalid email or password' };
export const AUTH_REFRESH_INVALID: ErrorDef = { code: 'AUTH_REFRESH_INVALID', message: 'Refresh token is invalid or expired' };
export const AUTH_TOKEN_INVALID: ErrorDef = { code: 'AUTH_TOKEN_INVALID', message: 'Access token is invalid or expired' };
export const USER_EMAIL_TAKEN: ErrorDef = { code: 'USER_EMAIL_TAKEN', message: 'A user with this email already exists' };
export const PASSWORD_TOO_WEAK: ErrorDef = { code: 'PASSWORD_TOO_WEAK', message: 'Password must be at least 8 characters' };

// ─── User Profile ────────────────────────────────────────────────────────────
export const INVALID_ANCHOR_DAY: ErrorDef = { code: 'INVALID_ANCHOR_DAY', message: 'budgetAnchorDay must be an integer between 1 and 31' };

// ─── Transaction ─────────────────────────────────────────────────────────────
export const INVALID_AMOUNT: ErrorDef = { code: 'INVALID_AMOUNT', message: 'Transaction amount must be greater than 0' };
export const INVALID_DATE: ErrorDef = { code: 'INVALID_DATE', message: 'Transaction date cannot be in the future' };
export const INVALID_DESCRIPTION: ErrorDef = { code: 'INVALID_DESCRIPTION', message: 'Description must not exceed 255 characters' };
export const INVALID_CATEGORY: ErrorDef = { code: 'INVALID_CATEGORY', message: 'Category ID must not be empty' };

// ─── Budget ──────────────────────────────────────────────────────────────────
export const INVALID_BUDGET_LIMIT: ErrorDef = { code: 'INVALID_BUDGET_LIMIT', message: 'Monthly limit must be greater than 0' };
export const CATEGORY_DUPLICATE: ErrorDef = { code: 'CATEGORY_DUPLICATE', message: 'Category with this name and type already exists' };
export const CATEGORY_NAME_EMPTY: ErrorDef = { code: 'CATEGORY_NAME_EMPTY', message: 'Category name cannot be empty' };
export const CATEGORY_NAME_TOO_LONG: ErrorDef = { code: 'CATEGORY_NAME_TOO_LONG', message: 'Category name cannot exceed 100 characters' };
export const INVALID_COLOR: ErrorDef = { code: 'INVALID_COLOR', message: 'Color must be a valid hex color (e.g. #FF0000)' };

// ─── Aggregated map (for lookup by code string) ──────────────────────────────
export const Errors = {
  AUTH_INVALID_CREDENTIALS,
  AUTH_REFRESH_INVALID,
  AUTH_TOKEN_INVALID,
  USER_EMAIL_TAKEN,
  PASSWORD_TOO_WEAK,
  INVALID_ANCHOR_DAY,
  INVALID_AMOUNT,
  INVALID_DATE,
  INVALID_DESCRIPTION,
  INVALID_CATEGORY,
  INVALID_BUDGET_LIMIT,
  CATEGORY_DUPLICATE,
  CATEGORY_NAME_EMPTY,
  CATEGORY_NAME_TOO_LONG,
  INVALID_COLOR,
} as const;