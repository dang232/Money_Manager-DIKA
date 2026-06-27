// ponytail: handler for CreateTransactionCommand
import { Injectable, Inject } from '@nestjs/common';
import { EventBusPort } from '@money-manager/shared-kernel';
import { EVENT_BUS_PORT } from '@money-manager/shared-kernel';
import { CreateTransactionCommand } from '../commands/create-transaction.command';
import { Transaction } from '../../domain/aggregates/transaction.aggregate';
import { TransactionRepository, TRANSACTION_REPOSITORY } from '../../domain/repositories/transaction.repository.port';
import { TransactionCreatedEvent } from '../../domain/events/transaction-created.event';

@Injectable()
export class CreateTransactionHandler {
  constructor(
    @Inject(TRANSACTION_REPOSITORY) private readonly repo: TransactionRepository,
    @Inject(EVENT_BUS_PORT) private readonly eventBus: EventBusPort,
  ) {}

  async execute(cmd: CreateTransactionCommand): Promise<Transaction> {
    const transaction = Transaction.create({
      userId: cmd.userId,
      amount: cmd.amount,
      currency: cmd.currency,
      type: cmd.type,
      categoryId: cmd.categoryId,
      description: cmd.description,
      date: cmd.date,
    });

    const saved = await this.repo.save(transaction);

    await this.eventBus.publish('transaction.events', new TransactionCreatedEvent(
      saved.id,
      saved.userId,
      saved.amount,
      saved.currency,
      saved.type,
      saved.categoryId,
      saved.date,
    ));

    return saved;
  }
}
