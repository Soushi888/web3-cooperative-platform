<script lang="ts">
	import coopStore, { UserStatus } from '$lib/stores.svelte';

	// Define the Proposal type
	interface Proposal {
		id: string;
		title: string;
		description: string;
		votes: {
			for: number;
			against: number;
			abstain: number;
		};
		voters: string[]; // Array of principal IDs who have voted
	}

	// Helper function to safely check user status
	const isUserApproved = () => coopStore.userStatus === UserStatus.APPROVED;

	// Local component state using Svelte 5 runes
	let showNewProposalForm = $state(false);
	let newProposalTitle = $state('');
	let newProposalDescription = $state('');

	// Note: The backend contract doesn't currently have proposal functionality
	// This is a frontend-only implementation that would need to be added to the backend
	// Mock proposals data - in a real app, this would come from a backend canister
	let proposals = $state<Proposal[]>([
		{
			id: '1',
			title: 'Increase Member Contribution',
			description: 'Proposal to increase the monthly member contribution from 50 to 75 tokens.',
			votes: { for: 8, against: 3, abstain: 1 },
			voters: []
		},
		{
			id: '2',
			title: 'Add New Community Project',
			description:
				'Proposal to fund a new community garden project with 500 tokens from the treasury.',
			votes: { for: 10, against: 2, abstain: 0 },
			voters: []
		}
	]);

	// Function to check if the user has already voted on a proposal
	const hasUserVoted = (proposalId: string): boolean => {
		if (!coopStore.userPrincipal) return true; // If not logged in, disable voting

		const proposal = proposals.find((p) => p.id === proposalId);
		return proposal?.voters.includes(coopStore.userPrincipal.toText()) || false;
	};

	// Function for calculating vote percentages
	const calculateVotePercentage = (votes: { for: number; against: number; abstain: number }) => {
		const total = votes.for + votes.against + votes.abstain;
		if (total === 0) return { for: 0, against: 0, abstain: 0 };

		return {
			for: Math.round((votes.for / total) * 100),
			against: Math.round((votes.against / total) * 100),
			abstain: Math.round((votes.abstain / total) * 100)
		};
	};

	// Pure function to cast a vote
	const castVote = (proposalId: string, voteType: 'for' | 'against' | 'abstain') => {
		if (!coopStore.userPrincipal || hasUserVoted(proposalId)) return;

		proposals = proposals.map((proposal) => {
			if (proposal.id === proposalId) {
				return {
					...proposal,
					votes: {
						...proposal.votes,
						[voteType]: proposal.votes[voteType] + 1
					},
					voters: [...proposal.voters, coopStore.userPrincipal!.toText()]
				};
			}
			return proposal;
		});
	};

	// Toggle new proposal form visibility
	const toggleProposalForm = () => {
		showNewProposalForm = !showNewProposalForm;
		if (!showNewProposalForm) {
			// Reset form when hiding
			newProposalTitle = '';
			newProposalDescription = '';
		}
	};

	// Create a new proposal
	const createProposal = () => {
		if (!newProposalTitle || !newProposalDescription) return;

		const newProposal: Proposal = {
			id: (proposals.length + 1).toString(),
			title: newProposalTitle,
			description: newProposalDescription,
			votes: { for: 0, against: 0, abstain: 0 },
			voters: []
		};

		proposals = [...proposals, newProposal];
		toggleProposalForm(); // Hide form after submission
	};
</script>

<div class="proposals-container">
	<div class="header">
		<h2>Governance Proposals</h2>
		{#if isUserApproved()}
			<button class="primary-btn" onclick={toggleProposalForm}>
				{showNewProposalForm ? 'Cancel' : 'New Proposal'}
			</button>
		{/if}
	</div>

	<div class="note">
		<p>
			<strong>Note:</strong> This is a frontend prototype of the governance proposal system. The backend
			contract does not yet implement proposal functionality. In a complete implementation, proposals
			would be stored on-chain and voting would be handled by the backend canister.
		</p>
	</div>

	{#if showNewProposalForm}
		<div class="proposal-form">
			<h3>Create New Proposal</h3>
			<div class="form-group">
				<label for="proposal-title">Title</label>
				<input
					id="proposal-title"
					type="text"
					placeholder="Enter proposal title"
					bind:value={newProposalTitle}
				/>
			</div>
			<div class="form-group">
				<label for="proposal-description">Description</label>
				<textarea
					id="proposal-description"
					placeholder="Enter proposal description"
					rows="4"
					bind:value={newProposalDescription}
				></textarea>
			</div>
			<button
				class="primary-btn"
				disabled={!newProposalTitle || !newProposalDescription}
				onclick={createProposal}
			>
				Submit Proposal
			</button>
		</div>
	{/if}

	<div class="proposals-list">
		{#if proposals.length === 0}
			<div class="empty-state">No proposals available at this time.</div>
		{:else}
			{#each proposals as proposal}
				<div class="proposal-card">
					<div class="proposal-header">
						<h3>{proposal.title}</h3>
						<div class="proposal-status">
							{hasUserVoted(proposal.id) ? 'You voted' : 'Vote now'}
						</div>
					</div>

					<p class="proposal-description">{proposal.description}</p>

					<div class="voting-results">
						<div class="vote-bars">
							<div class="vote-bar">
								<div class="label">For ({proposal.votes.for})</div>
								<div class="bar">
									<div
										class="fill for"
										style="width: {calculateVotePercentage(proposal.votes).for}%"
									></div>
								</div>
								<div class="percentage">{calculateVotePercentage(proposal.votes).for}%</div>
							</div>

							<div class="vote-bar">
								<div class="label">Against ({proposal.votes.against})</div>
								<div class="bar">
									<div
										class="fill against"
										style="width: {calculateVotePercentage(proposal.votes).against}%"
									></div>
								</div>
								<div class="percentage">{calculateVotePercentage(proposal.votes).against}%</div>
							</div>

							<div class="vote-bar">
								<div class="label">Abstain ({proposal.votes.abstain})</div>
								<div class="bar">
									<div
										class="fill abstain"
										style="width: {calculateVotePercentage(proposal.votes).abstain}%"
									></div>
								</div>
								<div class="percentage">{calculateVotePercentage(proposal.votes).abstain}%</div>
							</div>
						</div>
					</div>

					{#if isUserApproved() && !hasUserVoted(proposal.id)}
						<div class="voting-actions">
							<button class="vote-btn for" onclick={() => castVote(proposal.id, 'for')}
								>Vote For</button
							>
							<button class="vote-btn against" onclick={() => castVote(proposal.id, 'against')}
								>Vote Against</button
							>
							<button class="vote-btn abstain" onclick={() => castVote(proposal.id, 'abstain')}
								>Abstain</button
							>
						</div>
					{/if}
				</div>
			{/each}
		{/if}
	</div>
</div>

<style>
	.proposals-container {
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
		margin-bottom: 1rem;
	}

	.note {
		background-color: #f8fafc;
		border-left: 4px solid #3b82f6;
		padding: 0.75rem 1rem;
		margin-bottom: 1.5rem;
		border-radius: 0.25rem;
	}

	.note p {
		margin: 0;
		font-size: 0.875rem;
		color: #4b5563;
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

	.primary-btn:disabled {
		background-color: #9ca3af;
		cursor: not-allowed;
	}

	.proposal-form {
		background-color: #f3f4f6;
		padding: 1.5rem;
		border-radius: 0.375rem;
		margin-bottom: 1.5rem;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	label {
		display: block;
		font-weight: 500;
		margin-bottom: 0.5rem;
	}

	input,
	textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		font-size: 1rem;
	}

	.proposals-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.empty-state {
		text-align: center;
		padding: 2rem;
		color: #6b7280;
		font-style: italic;
	}

	.proposal-card {
		border: 1px solid #e5e7eb;
		border-radius: 0.375rem;
		padding: 1.5rem;
	}

	.proposal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.proposal-header h3 {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0;
		color: #111827;
	}

	.proposal-status {
		font-size: 0.875rem;
		color: #6b7280;
	}

	.proposal-description {
		margin-bottom: 1.5rem;
		color: #4b5563;
	}

	.voting-results {
		margin-bottom: 1.5rem;
	}

	.vote-bars {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.vote-bar {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.label {
		width: 100px;
		font-size: 0.875rem;
		color: #4b5563;
	}

	.bar {
		flex-grow: 1;
		height: 0.5rem;
		background-color: #e5e7eb;
		border-radius: 9999px;
		overflow: hidden;
	}

	.fill {
		height: 100%;
		transition: width 0.3s ease;
	}

	.fill.for {
		background-color: #10b981;
	}

	.fill.against {
		background-color: #ef4444;
	}

	.fill.abstain {
		background-color: #f59e0b;
	}

	.percentage {
		width: 40px;
		font-size: 0.875rem;
		text-align: right;
		color: #4b5563;
	}

	.voting-actions {
		display: flex;
		gap: 0.5rem;
	}

	.vote-btn {
		flex: 1;
		padding: 0.5rem;
		border: none;
		border-radius: 0.375rem;
		font-weight: 500;
		cursor: pointer;
		color: white;
	}

	.vote-btn.for {
		background-color: #10b981;
	}

	.vote-btn.for:hover {
		background-color: #059669;
	}

	.vote-btn.against {
		background-color: #ef4444;
	}

	.vote-btn.against:hover {
		background-color: #dc2626;
	}

	.vote-btn.abstain {
		background-color: #f59e0b;
	}

	.vote-btn.abstain:hover {
		background-color: #d97706;
	}
</style>
