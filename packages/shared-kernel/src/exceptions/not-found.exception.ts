// ponytail: thrown when an aggregate or entity cannot be located
import { DomainException } from './domain.exception';

export class NotFoundException extends DomainException {
  constructor(entity: string, id: string) {
    super(`${entity} with id ${id} not found`, 'NOT_FOUND');
    this.name = 'NotFoundException';
  }
}
