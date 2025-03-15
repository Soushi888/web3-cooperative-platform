import { Principal } from '@dfinity/principal';

export interface Member {
  principal: Principal;
  approved: boolean;
  isAdmin?: boolean;
}
