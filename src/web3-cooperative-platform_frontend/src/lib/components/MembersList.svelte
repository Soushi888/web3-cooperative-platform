<script lang="ts">
	import coopStore from '$lib/stores.svelte';

	// Local component state using Svelte 5 runes
	let filterText = $state('');
	let showApprovedOnly = $state(false);

	// Derived state for filtered members list using functional programming approach
	const filteredMembers = $derived(() => {
		// Create a pipeline of filter operations
		return (
			coopStore.members
				// Filter by approval status if needed
				.filter((member) => !showApprovedOnly || member.approved)
				// Filter by search text if provided
				.filter(
					(member) =>
						!filterText ||
						member.principal.toText().toLowerCase().includes(filterText.toLowerCase())
				)
				// Sort by approval status (approved first)
				.sort((a, b) => {
					if (a.approved === b.approved) return 0;
					return a.approved ? -1 : 1;
				})
		);
	});

	// Derived state to check if the current user is an admin
	const isCurrentUserAdmin = $derived(() => {
		if (!coopStore.userPrincipal) return false;

		const currentUser = coopStore.members.find(
			(m) => m.principal && m.principal.toText() === coopStore.userPrincipal?.toText()
		);

		return currentUser?.isAdmin || false;
	});

	// Pure function to format principal ID for display
	const formatPrincipal = (principal: string): string => {
		if (principal.length <= 10) return principal;
		return `${principal.slice(0, 5)}...${principal.slice(-5)}`;
	};

	// Toggle filter handlers using functional approach
	const toggleApprovedFilter = () => (showApprovedOnly = !showApprovedOnly);
	const updateFilterText = (e: Event) => {
		const target = e.target as HTMLInputElement;
		filterText = target.value;
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
					{#if isCurrentUserAdmin()}
						<th>Actions</th>
					{/if}
				</tr>
			</thead>
			<tbody>
				{#each filteredMembers() as member}
					<tr class={member.approved ? 'approved' : 'pending'}>
						<td>{formatPrincipal(member.principal.toText())}</td>
						<td>{member.approved ? 'Approved' : 'Pending'}</td>
						{#if isCurrentUserAdmin() && !member.approved}
							<td>
								<button class="approve-btn">Approve</button>
							</td>
						{:else if isCurrentUserAdmin()}
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
</style>
