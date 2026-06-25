// ponytail: query to get a single transaction by id
export class GetTransactionByIdQuery {
  constructor(
    public readonly id: string,
    public readonly userId: string,
  ) {}
}
