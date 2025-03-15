import { Principal } from '@dfinity/principal';
import type { Member } from './types';

// Define state using Svelte 5 runes
// This file will be imported by components that need access to the shared state

export enum UserStatus {
	NOT_LOGGED_IN = 'not-logged-in',
	NOT_REGISTERED = 'not-registered',
	PENDING = 'pending',
	APPROVED = 'approved'
}

function createCoopStore() {
	let isLoggedIn = $state(false);
	let isLoading = $state(false);
	let userPrincipal = $state<Principal | null>(null);
	let members = $state<Member[]>([]);
	let userStatus: UserStatus | null = $state(null);
	let errorMessage = $state('');

	const setUserStatus = (status: UserStatus) => {
		userStatus = status;
	};

	const setUserPrincipal = (principal: Principal | null) => {
		userPrincipal = principal;
	};

	const setMembers = (newMembers: Member[]) => {
		members = newMembers;
	};

	const login = () => {
		isLoggedIn = true;
		userStatus = UserStatus.NOT_REGISTERED;
	};

	const setIsLoading = (newIsLoading: boolean) => {
		isLoading = newIsLoading;
	};

	const setErrorMessage = (message: string) => {
		errorMessage = message;
	};

	return {
		isLoggedIn,
		userPrincipal,
		members,
		userStatus,
		errorMessage,
		isLoading,
		setUserStatus,
		setUserPrincipal,
		setMembers,
		login,
		setIsLoading,
		setErrorMessage
	};
}

const coopStore = createCoopStore();

export default coopStore;
