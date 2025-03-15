import { createActor as createBackendActor } from '../../../../declarations/coop_backend';
import { HttpAgent } from '@dfinity/agent';
import type { Identity } from '@dfinity/agent';
import { AuthClient } from '@dfinity/auth-client';
import type { _SERVICE } from '../../../../declarations/coop_backend/coop_backend.did';

interface CanisterService {
  initAuthClient: () => Promise<AuthClient>;
  isAuthenticated: () => Promise<boolean>;
  login: () => Promise<boolean>;
  logout: () => Promise<void>;
  getIdentity: () => Promise<Identity>;
  getBackendActor: () => Promise<_SERVICE | null>;
  getAnonymousBackendActor: () => Promise<_SERVICE>;
}

function createCanisterService(): CanisterService {
  const DEFAULT_HOST = 'http://localhost:4943';
  let authClient = $state<AuthClient | null>(null);

  const initAuthClient = async (): Promise<AuthClient> => {
    if (!authClient) {
      authClient = await AuthClient.create();
    }
    return authClient;
  };

  const isAuthenticated = async (): Promise<boolean> => {
    const client = await initAuthClient();
    return client.isAuthenticated();
  };

  const login = async (): Promise<boolean> => {
    const client = await initAuthClient();

    const days = BigInt(1);
    const hours = BigInt(24);
    const nanoseconds = BigInt(3600000000000);

    return new Promise((resolve) => {
      client.login({
        identityProvider: `http://${import.meta.env.VITE_CANISTER_ID_INTERNET_IDENTITY}.localhost:4943`,
        maxTimeToLive: days * hours * nanoseconds,
        onSuccess: () => resolve(true),
        onError: (error) => {
          console.error('Login failed:', error);
          resolve(false);
        }
      });
    });
  };

  const logout = async (): Promise<void> => {
    const client = await initAuthClient();
    await client.logout();
  };

  const getIdentity = async (): Promise<Identity> => {
    const client = await initAuthClient();
    return client.getIdentity();
  };

  const createAgent = async (identity?: Identity): Promise<HttpAgent> => {
    const agent = await HttpAgent.create({
      host: DEFAULT_HOST,
      ...(identity && { identity })
    });

    if (DEFAULT_HOST.includes('localhost')) {
      await agent.fetchRootKey().catch((err) => {
        console.warn('Unable to fetch root key. Check if your local replica is running');
        console.error(err);
      });
    }

    return agent;
  };

  const getBackendActor = async (): Promise<_SERVICE | null> => {
    const client = await initAuthClient();

    if (!(await client.isAuthenticated())) {
      return null;
    }

    const identity = client.getIdentity();
    const agent = await createAgent(identity);
    const canisterId = import.meta.env.VITE_CANISTER_ID_COOP_BACKEND;

    return createBackendActor(canisterId, { agent });
  };

  const getAnonymousBackendActor = async (): Promise<_SERVICE> => {
    const agent = await createAgent();
    const canisterId = import.meta.env.VITE_CANISTER_ID_COOP_BACKEND;

    return createBackendActor(canisterId, { agent });
  };

  return {
    initAuthClient,
    isAuthenticated,
    login,
    logout,
    getIdentity,
    getBackendActor,
    getAnonymousBackendActor
  };
}

export const canisterService = createCanisterService();
