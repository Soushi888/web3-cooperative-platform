<script lang="ts">
  import "../index.scss";
  import { backend } from "$lib/agent";
  import { AuthClient } from "@dfinity/auth-client";
  import { Principal } from "@dfinity/principal";
  import type { Identity } from "@dfinity/agent";

  let authClient: AuthClient;
  let identity: Identity | null = $state(null);
  let userPrincipal: Principal | null = $state(null);
  let members: { principal: Principal; approved: boolean }[] = $state([]);
  let isApproved = $state(false);
  let isLoading = $state(true);

  // Initialize authentication client
  async function initAuth() {
    try {
      authClient = await AuthClient.create();

      if (await authClient.isAuthenticated()) {
        identity = authClient.getIdentity();
        userPrincipal = identity.getPrincipal();

        // Initialize members as an empty array if it's undefined
        if (!members) {
          members = [];
        }

        await checkMemberStatus();
        await fetchMembers();
      }
    } catch (error) {
      console.error("Error initializing authentication:", error);
    } finally {
      isLoading = false;
    }
  }

  // Login with Internet Identity
  async function login() {
    isLoading = true;

    // Get the network from environment or default to local
    const network = import.meta.env.DFX_NETWORK || "local";

    // Set the identity provider based on network
    let identityProvider;
    if (network === "ic") {
      identityProvider = "https://identity.ic0.app";
    } else {
      // For local development, use the locally deployed Internet Identity canister
      // Use the actual deployed canister ID from your environment
      const iiCanisterId =
        import.meta.env.INTERNET_IDENTITY_CANISTER_ID ||
        "be2us-64aaa-aaaaa-qaabq-cai";
      console.log("Using Internet Identity canister ID:", iiCanisterId);

      // Use the correct URL format for Internet Identity
      // The format should be: http://{canister-id}.localhost:4943
      identityProvider = `http://${iiCanisterId}.localhost:4943`;
    }

    console.log("Logging in with identity provider:", identityProvider);

    await authClient.login({
      identityProvider,
      onSuccess: async () => {
        try {
          identity = authClient.getIdentity();
          userPrincipal = identity.getPrincipal();

          // Initialize members as an empty array if it's undefined
          if (!members) {
            members = [];
          }

          await checkMemberStatus();
          await fetchMembers();
        } catch (error) {
          console.error("Error during login success handling:", error);
        } finally {
          isLoading = false;
        }
      },
      onError: (error) => {
        console.error("Login failed:", error);
        isLoading = false;
      },
    });
  }

  // Logout
  async function logout() {
    await authClient.logout();
    identity = null;
    userPrincipal = null;
    members = [];
    isApproved = false;
  }

  // Check if the current user is an approved member
  async function checkMemberStatus() {
    if (!userPrincipal) {
      isApproved = false;
      return;
    }

    try {
      isApproved = await backend.isApprovedMember(userPrincipal);
    } catch (error) {
      console.error("Error checking member status:", error);
      isApproved = false;
    }
  }

  // Fetch the list of members
  async function fetchMembers() {
    if (!identity) return;

    try {
      const result = await backend.getMembers();
      // Make sure we have a valid array
      if (Array.isArray(result)) {
        members = result;
      } else {
        console.error("Expected members to be an array, got:", result);
        members = [];
      }
    } catch (error) {
      console.error("Error fetching members:", error);
      // Initialize to empty array on error
      members = [];
    }
  }

  // Request membership
  async function requestMembership() {
    if (identity) {
      isLoading = true;
      try {
        await backend.register();
        await fetchMembers();
      } catch (error) {
        console.error("Error requesting membership:", error);
      }
      isLoading = false;
    }
  }

  // Add self as approved member
  async function addSelfAsApprovedMember() {
    if (identity) {
      isLoading = true;
      try {
        const success = await backend.addSelfAsApprovedMember();
        if (success) {
          await checkMemberStatus();
          await fetchMembers();
          console.log("Successfully added self as approved member");
        } else {
          console.error("Failed to add self as approved member");
        }
      } catch (error) {
        console.error("Error adding self as approved member:", error);
      }
      isLoading = false;
    }
  }

  // Approve a pending member
  async function approveMember(principal: Principal) {
    if (identity && isApproved) {
      isLoading = true;
      try {
        const success = await backend.approveMember(principal);
        if (success) {
          await fetchMembers();
        } else {
          console.error("Approval failed");
        }
      } catch (error) {
        console.error("Error approving member:", error);
      }
      isLoading = false;
    }
  }

  // Format principal ID for display
  function formatPrincipal(principal: Principal) {
    const text = principal.toText();
    if (text.length <= 10) return text;
    return `${text.slice(0, 5)}...${text.slice(-5)}`;
  }

  // Check if the current user is already a member (approved or pending)
  function isUserMember() {
    if (!userPrincipal) return false;
    if (!members || members.length === 0) return false;

    return members.some(
      (m) =>
        m.principal &&
        m.principal.toText &&
        m.principal.toText() === userPrincipal!.toText()
    );
  }

  $effect(() => {
    initAuth();
  });
</script>

<main>
  <h1>Web3 Cooperative Platform</h1>

  {#if isLoading}
    <div class="loading">Loading...</div>
  {:else if !identity}
    <div class="auth-section">
      <p>
        Welcome to the Web3 Cooperative Platform. Please sign in to continue.
      </p>
      <button onclick={login} class="primary-button"
        >Sign In with Internet Identity</button
      >
    </div>
  {:else}
    <div class="user-info">
      {#if userPrincipal}
        <p>
          Signed in as: <span class="principal"
            >{formatPrincipal(userPrincipal)}</span
          >
          <button onclick={logout} class="secondary-button">Sign Out</button>
        </p>
      {:else}
        <p>
          Signed in as: <span class="principal">Anonymous</span>
        </p>
      {/if}
      <p class="status">
        Status:
        {#if isApproved}
          <span class="approved">Approved Member</span>
        {:else if isUserMember()}
          <span class="pending">Pending Approval</span>
        {:else}
          <span class="not-member">Not a Member</span>
        {/if}
      </p>
    </div>

    {#if !isUserMember()}
      <div class="action-section">
        <button onclick={requestMembership} class="primary-button"
          >Request Membership</button
        >
      </div>
    {/if}

    <!-- Add button for users to add themselves as approved members -->
    <div class="action-section">
      <button onclick={addSelfAsApprovedMember} class="admin-button"
        >Make Myself an Approved Member</button
      >
      <p class="help-text">
        Use this button to add yourself as an approved member. This is useful
        for the deployer or for testing purposes.
      </p>
    </div>

    <div class="members-section">
      <h2>Members</h2>
      {#if members.length === 0}
        <p>No members found.</p>
      {:else}
        <table>
          <thead>
            <tr>
              <th>Principal ID</th>
              <th>Status</th>
              {#if isApproved}
                <th>Actions</th>
              {/if}
            </tr>
          </thead>
          <tbody>
            {#each members as member}
              <tr>
                <td class="principal">{formatPrincipal(member.principal)}</td>
                <td>
                  {#if member.approved}
                    <span class="approved">Approved</span>
                  {:else}
                    <span class="pending">Pending</span>
                  {/if}
                </td>
                {#if isApproved && !member.approved}
                  <td>
                    <button
                      onclick={() => approveMember(member.principal)}
                      class="action-button"
                    >
                      Approve
                    </button>
                  </td>
                {:else if isApproved}
                  <td>-</td>
                {/if}
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>
  {/if}
</main>

<style>
  main {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }

  h1 {
    color: #3e00ff;
    margin-bottom: 2rem;
    text-align: center;
  }

  h2 {
    color: #333;
    margin: 1.5rem 0 1rem;
  }

  .loading {
    text-align: center;
    font-style: italic;
    margin: 2rem 0;
  }

  .auth-section {
    text-align: center;
    margin: 2rem 0;
  }

  .user-info {
    background-color: #f5f5f5;
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1.5rem;
  }

  .action-section {
    margin: 1.5rem 0;
    text-align: center;
  }

  .members-section {
    margin-top: 2rem;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
  }

  th,
  td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #ddd;
  }

  th {
    background-color: #f2f2f2;
    font-weight: bold;
  }

  .principal {
    font-family: monospace;
    font-size: 0.9rem;
  }

  .approved {
    color: green;
    font-weight: bold;
  }

  .pending {
    color: orange;
    font-weight: bold;
  }

  .not-member {
    color: #666;
  }

  .primary-button {
    background-color: #3e00ff;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
  }

  .primary-button:hover {
    background-color: #3200cc;
  }

  .secondary-button {
    background-color: #f2f2f2;
    color: #333;
    border: 1px solid #ddd;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    cursor: pointer;
    margin-left: 0.5rem;
  }

  .action-button {
    background-color: #4caf50;
    color: white;
    border: none;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    cursor: pointer;
  }

  .action-button:hover {
    background-color: #45a049;
  }

  .admin-button {
    background-color: #ff5722;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }

  .admin-button:hover {
    background-color: #e64a19;
  }

  .help-text {
    font-size: 0.8rem;
    color: #666;
    margin-top: 0.5rem;
    font-style: italic;
  }
</style>
