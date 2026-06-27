// ponytail: bcrypt implementation of PasswordHasher port
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PasswordHasher } from '../../domain/services/password-hasher.port';

// ponytail: cost 10 keeps login under ~80ms on a free-tier container. bump to 12 when CPU budget allows.
const BCRYPT_COST = 10;

@Injectable()
export class BcryptPasswordHasher implements PasswordHasher {
  hash(plaintext: string): Promise<string> {
    return bcrypt.hash(plaintext, BCRYPT_COST);
  }

  verify(plaintext: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plaintext, hash);
  }
}