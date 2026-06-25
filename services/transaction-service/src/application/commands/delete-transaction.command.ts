// ponytail: command to delete a transaction
export class DeleteTransactionCommand {
  constructor(
    public readonly id: string,
    public readonly userId: string,
  ) {}
}
