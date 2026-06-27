// ponytail: query to get current user's profile
export class GetMyProfileQuery {
  constructor(public readonly userId: string) {}
}