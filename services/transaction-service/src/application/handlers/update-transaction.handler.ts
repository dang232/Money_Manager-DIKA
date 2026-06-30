// FIXED: handler for UpdateTransactionCommand - validates userId ownership
import { Injectable, Inject } from '@nestjs/common';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { EventBusPort, EVENT_BUS_PORT } from '@money-manager/shared-kernel';
import { UpdateTransactionCommand } from '../commands/update-transaction.command';
import { Transaction } from '../../domain/aggregates/transaction.aggregate';
import { TransactionRepository, TRANSACTION_REPOSITORY } from '../../domain/repositories/transaction.repository.port';
import { TransactionUpdatedEvent } from '../../domain/events/transaction-updated.event';

@Injectable()
export class UpdateTransactionHandler {
  constructor(
    @Inject(TRANSACTION_REPOSITORY) private readonly repo: TransactionRepository,
    @Inject(EVENT_BUS_PORT) private readonly eventBus: EventBusPort,
  ) {}

  async execute(cmd: UpdateTransactionCommand): Promise<Transaction> {
    const transaction = await this.repo.findById(cmd.id);
    if (!transaction) {
      throw new NotFoundException('Transaction', cmd.id);
    }

    // FIXED: Verify the transaction belongs to the requesting user
    if (transaction.userId !== cmd.userId) {
      throw new ForbiddenException('You do not have access to this transaction');
    }

    const changes: Record<string, unknown> = {};
    if (cmd.amount !== undefined) changes['amount'] = cmd.amount;
    if (cmd.currency !== undefined) changes['currency'] = cmd.currency;
    if (cmd.type !== undefined) changes['type'] = cmd.type;
    if (cmd.categoryId !== undefined) changes['categoryId'] = cmd.categoryId;
    if (cmd.description !== undefined) changes['description'] = cmd.description;
    if (cmd.date !== undefined) changes['date'] = cmd.date;

    transaction.update(changes);
    const saved = await this.repo.save(transaction);

    await this.eventBus.publish('transaction.events', new TransactionUpdatedEvent(
      saved.id,
      saved.userId,
      changes,
    ));

    return saved;
  }
}
