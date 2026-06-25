// ponytail: command to delete a category
export class DeleteCategoryCommand {
  constructor(
    public readonly id: string,
    public readonly userId: string,
  ) {}
}
