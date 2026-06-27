// ponytail: query to fetch the current user by id
export class GetMeQuery {
  constructor(public readonly userId: string) {}
}