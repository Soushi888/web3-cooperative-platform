<script lang="ts">
  import coopStore from '$lib/stores.svelte';
  import type { Member } from '$lib/types';
  import { UserStatus } from '$lib/types';
  import { canisterService } from '$lib/services/canisters.svelte';
  import type { Principal } from '@dfinity/principal';

  // Local component state using Svelte 5 runes
  let filterText = $state('');
  let showApprovedOnly = $state(false);
  let isApproving = $state(false);

  // Derived state for filtered members list using functional programming approach
  const filteredMembers = () => {
    return coopStore.members.filter((member) => {
      const matchesFilter = member.principal
        .toText()
        .toLowerCase()
        .includes(filterText.toLowerCase());
      return showApprovedOnly ? matchesFilter && member.approved : matchesFilter;
    });
  };

  // Derived state to check if the current user is an admin
  const isCurrentUserApproved = () => {
    return coopStore.userStatus === UserStatus.APPROVED;
  };

  // Pure function to format principal ID for display
  const formatPrincipal = (principal: string): string => {
    if (principal.length <= 10) return principal;
    return `${principal.slice(0, 5)}...${principal.slice(-5)}`;
  };

  // Toggle filter handlers using functional approach
  const toggleApprovedFilter = () => {
    showApprovedOnly = !showApprovedOnly;
  };

  const updateFilterText = (event: Event) => {
    const input = event.target as HTMLInputElement;
    filterText = input.value;
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
</script>

<div class="members-list">
  <h2>Members</h2>

  <div class="filters">
    <input
      type="text"
      placeholder="Filter by principal ID"
      value={filterText}
      oninput={updateFilterText}
    />
    <label>
      <input type="checkbox" checked={showApprovedOnly} onclick={toggleApprovedFilter} />
      Show approved only
    </label>
  </div>

  {#if filteredMembers().length === 0}
    <p class="empty-state">No members found matching your filters.</p>
  {:else}
    <table>
      <thead>
        <tr>
          <th>Principal</th>
          <th>Status</th>
          {#if isCurrentUserApproved()}
            <th>Actions</th>
          {/if}
        </tr>
      </thead>
      <tbody>
        {#each filteredMembers() as member}
          <tr class={member.approved ? 'approved' : 'pending'}>
            <td>{formatPrincipal(member.principal.toText())}</td>
            <td>{member.approved ? 'Approved' : 'Pending'}</td>
            {#if isCurrentUserApproved() && !member.approved}
              <td>
                <button class="approve-btn" onclick={() => approveMember(member.principal)} disabled={isApproving}>
                  {isApproving ? 'Approving...' : 'Approve'}
                </button>
              </td>
            {:else if isCurrentUserApproved()}
              <td>-</td>
            {/if}
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<style>
  .members-list {
    background-color: white;
    border-radius: 0.5rem;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  h2 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: #4f46e5;
  }

  .filters {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
    align-items: center;
  }

  input[type='text'] {
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    flex: 1;
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
    border-bottom: 1px solid #e5e7eb;
  }

  th {
    font-weight: 600;
    color: #4b5563;
  }

  tr.approved {
    background-color: #f0fdf4;
  }

  tr.pending {
    background-color: #fff7ed;
  }

  .empty-state {
    padding: 2rem;
    text-align: center;
    color: #6b7280;
    font-style: italic;
  }

  .approve-btn {
    background-color: #10b981;
    color: white;
    padding: 0.25rem 0.5rem;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: 0.875rem;
  }

  .approve-btn:hover {
    background-color: #059669;
  }

  .approve-btn:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
  }
</style>
