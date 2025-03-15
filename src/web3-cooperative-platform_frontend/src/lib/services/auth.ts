import { AuthClient } from '@dfinity/auth-client';
import { Principal } from '@dfinity/principal';
import coopStore from '$lib/stores.svelte';

class AuthService {
	private static instance: AuthService;
	private authClient: AuthClient | null = null;

	private constructor() {}

	public static getInstance(): AuthService {
		if (!AuthService.instance) {
			AuthService.instance = new AuthService();
		}
		return AuthService.instance;
	}

	public async initialize(): Promise<void> {
		this.authClient = await AuthClient.create();
		await this.checkAuthentication();
	}

	private async checkAuthentication(): Promise<void> {
		if (!this.authClient) return;

		const isAuthenticated = await this.authClient.isAuthenticated();
		if (isAuthenticated) {
			const identity = this.authClient.getIdentity();
			const principal = identity.getPrincipal();
			this.handleAuthenticationSuccess(principal);
		}
	}

	public async login(): Promise<void> {
		if (!this.authClient) return;

		await this.authClient.login({
			identityProvider:
				process.env.DFX_NETWORK === 'ic'
					? 'https://identity.ic0.app'
					: `http://localhost:4943/?canisterId=${process.env.INTERNET_IDENTITY_CANISTER_ID}`,
			onSuccess: async () => {
				const identity = this.authClient!.getIdentity();
				const principal = identity.getPrincipal();
				this.handleAuthenticationSuccess(principal);
			},
			onError: (error) => {
				console.error('Login failed:', error);
				coopStore.setErrorMessage('Failed to authenticate with Internet Identity');
			}
		});
	}

	public async logout(): Promise<void> {
		if (!this.authClient) return;

		await this.authClient.logout();
		coopStore.setUserPrincipal(null);
		coopStore.userStatus = null;
		coopStore.isLoggedIn = false;
	}

	private handleAuthenticationSuccess(principal: Principal): void {
		coopStore.setUserPrincipal(principal);
		coopStore.login();
	}
}

export const authService = AuthService.getInstance();
