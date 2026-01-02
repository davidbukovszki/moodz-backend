export enum UserRole {
  creator = 'creator',
  venue = 'venue',
}

export const ALL_USERS: UserRole[] = [UserRole.creator, UserRole.venue];
export const ALL_CREATORS: UserRole[] = [UserRole.creator];
export const ALL_VENUES: UserRole[] = [UserRole.venue];

