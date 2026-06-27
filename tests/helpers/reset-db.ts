// ponytail: reset state between integration tests via psql in the running containers
import { execSync } from 'child_process';

function psql(container: string, db: string, sql: string): string {
  return execSync(
    `docker exec ${container} psql -U postgres -d ${db} -c "${sql}"`,
    { stdio: ['ignore', 'pipe', 'pipe'] },
  ).toString();
}

export function resetTxnDb(): void {
  psql('postgres-txn', 'txn_db', 'TRUNCATE transactions;');
}

export function resetBudgetDb(): void {
  psql('postgres-budget', 'budget_db', 'TRUNCATE categories CASCADE; TRUNCATE budgets;');
}

export function resetAuthDb(): void {
  psql('postgres-auth', 'auth_db', 'TRUNCATE refresh_tokens; TRUNCATE users;');
}

export function resetUserDb(): void {
  psql('postgres-user', 'user_db', 'TRUNCATE user_profiles;');
}

export function resetAllDbs(): void {
  resetTxnDb();
  resetBudgetDb();
  resetAuthDb();
  resetUserDb();
}