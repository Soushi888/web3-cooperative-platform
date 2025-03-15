import type { Principal } from '@dfinity/principal';

export interface Member {
  principal: Principal;
  approved: boolean;
}

export enum UserStatus {
  NOT_LOGGED_IN = 'not-logged-in',
  NOT_REGISTERED = 'not-registered',
  PENDING = 'pending',
  APPROVED = 'approved'
}
