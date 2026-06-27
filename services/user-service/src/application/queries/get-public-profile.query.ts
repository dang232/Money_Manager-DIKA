// ponytail: query to get public profile by userId
export class GetPublicProfileQuery {
  constructor(public readonly userId: string) {}
}