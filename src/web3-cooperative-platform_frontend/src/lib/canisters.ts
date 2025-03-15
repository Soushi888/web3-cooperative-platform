import { createActor as createBackendActor } from '../declarations/coop_backend';
import { HttpAgent } from '@dfinity/agent';
import { AuthClient } from '@dfinity/auth-client';
import type { _SERVICE } from '../declarations/coop_backend/coop_backend.did';

// Local canister IDs - will be replaced by the environment variables in production
const LOCAL_II_CANISTER_ID = 'rdmx6-jaaaa-aaaaa-aaadq-cai';
const DEFAULT_HOST = 'http://localhost:4943';

// Initialize auth client
let authClient: AuthClient;
export const initAuthClient = async () => {
	if (!authClient) {
		authClient = await AuthClient.create();
	}
	return authClient;
};

// Check if user is authenticated
export const isAuthenticated = async () => {
	const client = await initAuthClient();
	return await client.isAuthenticated();
};

// Login with Internet Identity
export const login = async () => {
	const client = await initAuthClient();

	const days = BigInt(1);
	const hours = BigInt(24);
	const nanoseconds = BigInt(3600000000000);

	return new Promise((resolve) => {
		client.login({
			identityProvider: `http://${LOCAL_II_CANISTER_ID}.localhost:4943`,
			maxTimeToLive: days * hours * nanoseconds,
			onSuccess: () => resolve(true),
			onError: (error) => {
				console.error('Login failed:', error);
				resolve(false);
			}
		});
	});
};

// Logout
export const logout = async () => {
	const client = await initAuthClient();
	await client.logout();
};

// Get authenticated user's identity
export const getIdentity = async () => {
	const client = await initAuthClient();
	return client.getIdentity();
};

// Create an actor with the user's identity
export const getBackendActor = async (): Promise<_SERVICE | null> => {
	const client = await initAuthClient();

	if (!(await client.isAuthenticated())) {
		return null;
	}

	const identity = client.getIdentity();
	const agent = new HttpAgent({ host: DEFAULT_HOST, identity });

	// When developing locally, we need to fetch the root key
	if (DEFAULT_HOST.includes('localhost')) {
		await agent.fetchRootKey();
	}

	// Create the actor with the agent
	const canisterId = process.env.COOP_BACKEND_CANISTER_ID || 'rrkah-fqaaa-aaaaa-aaaaq-cai'; // Default local canister ID
	const actor = createBackendActor(canisterId, {
		agent
	});

	return actor;
};

// Get anonymous actor (no authentication)
export const getAnonymousBackendActor = (): _SERVICE => {
	const agent = new HttpAgent({ host: DEFAULT_HOST });

	// When developing locally, we need to fetch the root key
	if (DEFAULT_HOST.includes('localhost')) {
		agent.fetchRootKey().catch((err) => {
			console.warn('Unable to fetch root key. Check if your local replica is running');
			console.error(err);
		});
	}

	// Create the actor with the agent
	const canisterId = process.env.COOP_BACKEND_CANISTER_ID || 'rrkah-fqaaa-aaaaa-aaaaq-cai'; // Default local canister ID
	const actor = createBackendActor(canisterId, {
		agent
	});

	return actor;
};
