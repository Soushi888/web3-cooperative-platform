import { Principal } from '@dfinity/principal';
import type { Member } from './types';

// Define state using Svelte 5 runes
// This file will be imported by components that need access to the shared state

interface CoopStore {
  isLoggedIn: boolean;
  isLoading: boolean;
  userPrincipal: Principal | null;
  members: Member[];
  userStatus: UserStatus | null;
  errorMessage: string;
}

export enum UserStatus {
  NOT_LOGGED_IN = 'not-logged-in',
  NOT_REGISTERED = 'not-registered',
  PENDING = 'pending',
  APPROVED = 'approved'
}

function createCoopStore(): CoopStore {
  const isLoggedIn: boolean = $state(false);
  const isLoading: boolean = $state(false);
  const userPrincipal: Principal | null = $state(null);
  const members: Member[] = $state([]);
  const userStatus: UserStatus | null = $state(null);
  const errorMessage: string = $state('');

  return {
    isLoggedIn,
    userPrincipal,
    members,
    userStatus,
    errorMessage,
    isLoading
  };
}

const coopStore = createCoopStore();

export default coopStore;
