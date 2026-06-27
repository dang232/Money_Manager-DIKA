// ponytail: RefreshToken repository port — persistence contract
import { RepositoryPort } from '@money-manager/shared-kernel';
import { RefreshToken } from '../aggregates/refresh-token.aggregate';

export const REFRESH_TOKEN_REPOSITORY = 'REFRESH_TOKEN_REPOSITORY';

export interface RefreshTokenRepository extends RepositoryPort<RefreshToken> {
  findByPlaintext(plaintext: string): Promise<RefreshToken | null>;
  revokeAllForUser(userId: string): Promise<void>;
}