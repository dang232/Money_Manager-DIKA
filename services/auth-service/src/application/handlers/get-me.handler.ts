// ponytail: handler for GetMeQuery — returns the current user profile
import { Injectable, Inject } from '@nestjs/common';
import { NotFoundException } from '@money-manager/shared-kernel';
import { GetMeQuery } from '../queries/get-me.query';
import { UserRepository, USER_REPOSITORY } from '../../domain/repositories/user.repository.port';
import { User } from '../../domain/aggregates/user.aggregate';

@Injectable()
export class GetMeHandler {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepo: UserRepository) {}

  async execute(query: GetMeQuery): Promise<User> {
    const user = await this.userRepo.findById(query.userId);
    if (!user) {
      throw new NotFoundException('User', query.userId);
    }
    return user;
  }
}