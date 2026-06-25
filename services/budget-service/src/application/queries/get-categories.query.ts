// ponytail: query to get all categories for a user
export class GetCategoriesQuery {
  constructor(public readonly userId: string) {}
}
