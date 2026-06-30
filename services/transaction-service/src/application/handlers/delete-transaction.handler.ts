// FIXED: handler for DeleteTransactionCommand - validates userId ownership
import { Injectable, Inject } from '@nestjs/common';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { EventBusPort, EVENT_BUS_PORT } from '@money-manager/shared-kernel';
import { DeleteTransactionCommand } from '../commands/delete-transaction.command';
import { TransactionRepository, TRANSACTION_REPOSITORY } from '../../domain/repositories/transaction.repository.port';
import { TransactionDeletedEvent } from '../../domain/events/transaction-deleted.event';

@Injectable()
export class DeleteTransactionHandler {
  constructor(
    @Inject(TRANSACTION_REPOSITORY) private readonly repo: TransactionRepository,
    @Inject(EVENT_BUS_PORT) private readonly eventBus: EventBusPort,
  ) {}

  async execute(cmd: DeleteTransactionCommand): Promise<void> {
    const transaction = await this.repo.findById(cmd.id);
    if (!transaction) {
      throw new NotFoundException(`Transaction with id "${cmd.id}" not found`);
    }

    // FIXED: Verify the transaction belongs to the requesting user
    if (transaction.userId !== cmd.userId) {
      throw new ForbiddenException('You do not have access to this transaction');
    }

    await this.repo.delete(cmd.id);

    await this.eventBus.publish('transaction.events', new TransactionDeletedEvent(
      transaction.id,
      transaction.userId,
      transaction.categoryId,
      transaction.amount,
      transaction.currency,
      transaction.type,
    ));
  }
}
