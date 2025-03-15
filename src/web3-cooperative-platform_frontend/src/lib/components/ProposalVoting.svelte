<script lang="ts">
	import coopStore, { UserStatus } from '$lib/stores.svelte';
	import { Principal } from '@dfinity/principal';
	import { getBackendActor } from '$lib/canisters';

	// Define the Member type to match the backend
	interface Member {
		principal: Principal;
		approved: boolean;
	}

	// Local component state
	let members = $state<Member[]>([]);
	let selectedMember: Member | null = $state(null);

	// Helper function to safely check user status
	const isUserApproved = () => coopStore.userStatus === UserStatus.APPROVED;

	// Function to register as a member
	const registerAsMember = async () => {
		try {
			const actor = await getBackendActor();
			if (actor) {
				await actor.register();
				await loadMembers();
			}
		} catch (error) {
			console.error('Failed to register:', error);
		}
	};

	// Function to approve a member
	const approveMember = async (memberPrincipal: Principal) => {
		try {
			const actor = await getBackendActor();
			if (actor) {
				const result = await actor.approveMember(memberPrincipal);
				if (result) {
					await loadMembers();
				}
			}
		} catch (error) {
			console.error('Failed to approve member:', error);
		}
	};

	// Function to load all members
	const loadMembers = async () => {
		try {
			const actor = await getBackendActor();
			if (actor) {
				const result = await actor.getMembers();
				members = result;
			}
		} catch (error) {
			console.error('Failed to load members:', error);
		}
	};

	// Load members when the component mounts
	$effect(() => {
		loadMembers();
	});
</script>

<div class="member-management">
	<div class="header">
		<h2>Member Management</h2>
		{#if !isUserApproved()}
			<button class="primary-btn" onclick={registerAsMember}>Register as Member</button>
		{/if}
	</div>

	<div class="members-list">
		{#if members.length === 0}
			<div class="empty-state">No members registered yet.</div>
		{:else}
			<div class="table-container">
				<table>
					<thead>
						<tr>
							<th>Principal ID</th>
							<th>Status</th>
							{#if isUserApproved()}
								<th>Actions</th>
							{/if}
						</tr>
					</thead>
					<tbody>
						{#each members as member}
							<tr>
								<td class="principal-cell">{member.principal.toText()}</td>
								<td>
									<span class="status-badge {member.approved ? 'approved' : 'pending'}">
										{member.approved ? 'Approved' : 'Pending'}
									</span>
								</td>
								{#if isUserApproved() && !member.approved}
									<td>
										<button class="approve-btn" onclick={() => approveMember(member.principal)}>
											Approve
										</button>
									</td>
								{:else if isUserApproved()}
									<td>-</td>
								{/if}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>

<style>
	.member-management {
		background-color: white;
		border-radius: 0.5rem;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		margin-bottom: 2rem;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	h2 {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0;
		color: #4f46e5;
	}

	.primary-btn {
		background-color: #4f46e5;
		color: white;
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 0.375rem;
		font-weight: 500;
		cursor: pointer;
	}

	.primary-btn:hover {
		background-color: #4338ca;
	}

	.empty-state {
		text-align: center;
		padding: 2rem;
		color: #6b7280;
		font-style: italic;
	}

	.table-container {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th,
	td {
		padding: 0.75rem;
		text-align: left;
		border-bottom: 1px solid #e5e7eb;
	}

	th {
		background-color: #f8fafc;
		font-weight: 600;
		color: #4b5563;
	}

	.principal-cell {
		font-family: monospace;
		font-size: 0.875rem;
	}

	.status-badge {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.status-badge.approved {
		background-color: #dcfce7;
		color: #166534;
	}

	.status-badge.pending {
		background-color: #fef3c7;
		color: #92400e;
	}

	.approve-btn {
		background-color: #10b981;
		color: white;
		padding: 0.25rem 0.75rem;
		border: none;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		cursor: pointer;
	}

	.approve-btn:hover {
		background-color: #059669;
	}
</style>
