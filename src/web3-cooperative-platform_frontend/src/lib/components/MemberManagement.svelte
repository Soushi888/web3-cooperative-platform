<script lang="ts">
  import type { Principal } from '@dfinity/principal';
  import { canisterService } from '$lib/services/canisters.svelte';
  import coopStore from '$lib/stores.svelte';
  import type { Member } from '$lib/types';

  let isRegistering = $state(false);
  let isApproving = $state(false);

  const registerAsMember = async () => {
    try {
      isRegistering = true;
      const actor = await canisterService.getBackendActor();
      if (actor) {
        await actor.register();
        const newMembers = await actor.getMembers();
        coopStore.members = newMembers;
      }
    } catch (error) {
      console.error('Failed to register:', error);
      coopStore.errorMessage = 'Failed to register as member';
    } finally {
      isRegistering = false;
    }
  };

  const approveMember = async (memberPrincipal: Principal) => {
    try {
      isApproving = true;
      const actor = await canisterService.getBackendActor();
      if (actor) {
        await actor.approveMember(memberPrincipal);
        const newMembers = await actor.getMembers();
        coopStore.members = newMembers;
      }
    } catch (error) {
      console.error('Failed to approve member:', error);
      coopStore.errorMessage = 'Failed to approve member';
    } finally {
      isApproving = false;
    }
  };

  const loadMembers = async () => {
    try {
      const actor = await canisterService.getBackendActor();
      if (actor) {
        const newMembers = await actor.getMembers();
        coopStore.members = newMembers;
      }
    } catch (error) {
      console.error('Failed to load members:', error);
      coopStore.errorMessage = 'Failed to load members';
    }
  };

  $effect(() => {
    loadMembers();
  });
</script>

<div class="member-management">
  {#if !coopStore.isLoggedIn}
    <p>Please log in to manage membership.</p>
  {:else if !coopStore.userPrincipal}
    <p>Loading user information...</p>
  {:else}
    <div class="actions">
      {#if isRegistering}
        <p>Registering...</p>
      {:else}
        <button onclick={registerAsMember} disabled={isRegistering}>
          Register as Member
        </button>
      {/if}
    </div>

    <div class="members-list">
      <h2>Members</h2>
      {#if coopStore.members.length === 0}
        <p>No members found.</p>
      {:else}
        <table>
          <thead>
            <tr>
              <th>Principal</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each coopStore.members as member}
              <tr>
                <td>{member.principal.toText()}</td>
                <td>{member.approved ? 'Approved' : 'Pending'}</td>
                <td>
                  {#if !member.approved && coopStore.userStatus === 'approved'}
                    <button
                      onclick={() => approveMember(member.principal)}
                      disabled={isApproving}
                    >
                      {isApproving ? 'Approving...' : 'Approve'}
                    </button>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>
  {/if}
</div>

<style>
  .member-management {
    padding: 1rem;
  }

  .actions {
    margin-bottom: 2rem;
  }

  .members-list {
    margin-top: 2rem;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th,
  td {
    padding: 0.5rem;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
  }

  th {
    background-color: #f8fafc;
    font-weight: 600;
  }

  button {
    background-color: #4f46e5;
    color: white;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
  }

  button:hover {
    background-color: #4338ca;
  }

  button:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
  }
</style>
