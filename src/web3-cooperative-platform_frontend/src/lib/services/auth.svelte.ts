import { AuthClient } from '@dfinity/auth-client';
import { Principal } from '@dfinity/principal';
import coopStore, { UserStatus } from '$lib/stores.svelte';
import { getBackendActor } from '$lib/canisters';

interface AuthService {
  initialize: () => Promise<void>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

function createAuthService(): AuthService {
  let authClient = $state<AuthClient | null>(null);

  const initialize = async () => {
    authClient = await AuthClient.create();
    await checkAuthentication();
  };

  const checkAuthentication = async (): Promise<void> => {
    if (!authClient) return;

    const isAuthenticated = await authClient.isAuthenticated();
    if (isAuthenticated) {
      const identity = authClient.getIdentity();
      const principal = identity.getPrincipal();
      await handleAuthenticationSuccess(principal);
    }
  };

  const login = async (): Promise<void> => {
    if (!authClient) return;

    console.log(
      'Internet Identity Canister ID:',
      import.meta.env.VITE_CANISTER_ID_INTERNET_IDENTITY
    );

    await authClient.login({
      identityProvider:
        import.meta.env.VITE_DFX_NETWORK === 'ic'
          ? 'https://identity.ic0.app'
          : `http://localhost:4943/?canisterId=${import.meta.env.VITE_CANISTER_ID_INTERNET_IDENTITY}`,
      maxTimeToLive: BigInt(7) * BigInt(24) * BigInt(3600000000000), // 7 days
      onSuccess: async () => {
        const identity = authClient!.getIdentity();
        const principal = identity.getPrincipal();
        await handleAuthenticationSuccess(principal);
        coopStore.isLoading = true;
      },
      onError: (error) => {
        console.error('Login failed:', error);
        coopStore.errorMessage = 'Failed to authenticate with Internet Identity';
      }
    });
  };

  const logout = async (): Promise<void> => {
    if (!authClient) return;

    await authClient.logout();
    coopStore.userPrincipal = null;
    coopStore.userStatus = null;
    coopStore.isLoggedIn = false;
  };

  const handleAuthenticationSuccess = async (principal: Principal): Promise<void> => {
    coopStore.userPrincipal = principal;
    const actor = await getBackendActor();
    if (actor) {
      try {
        // Get all members to check if user is registered
        const members = await actor.getMembers();
        const userMember = members.find((m) => m.principal.toText() === principal.toText());

        if (!userMember) {
          coopStore.userStatus = UserStatus.NOT_REGISTERED;
        } else if (!userMember.approved) {
          coopStore.userStatus = UserStatus.PENDING;
        } else {
          coopStore.userStatus = UserStatus.APPROVED;
        }
      } catch (error) {
        console.error('Failed to get member status:', error);
        coopStore.errorMessage = 'Failed to get member status';
      }
    }
    coopStore.isLoggedIn = true;
  };

  return {
    initialize,
    login,
    logout
  };
}

export const authService = createAuthService();
