<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import coopStore from '$lib/stores.svelte';
	import { initAuthClient, isAuthenticated, getIdentity, getBackendActor } from '$lib/canisters';

	let { children } = $props();

	onMount(async () => {
		try {
			coopStore.isLoading = true;

			// Initialize auth client and check if user is logged in
			await initAuthClient();
			const authenticated = await isAuthenticated();
			coopStore.isLoggedIn = authenticated;

			if (authenticated) {
				// Get user identity and principal
				const identity = await getIdentity();
				coopStore.userPrincipal = identity.getPrincipal();

				// Get backend actor and fetch members
				const actor = await getBackendActor();
				if (actor) {
					const membersList = await actor.getMembers();
					coopStore.members = membersList;
				}
			}
		} catch (error) {
			console.error('Error initializing app:', error);
			coopStore.errorMessage = 'Failed to initialize application. Please try again.';
		} finally {
			coopStore.isLoading = false;
		}
	});

	const handleLogin = () => {
		window.location.href = '/login';
	};

	const handleLogout = () => {
		window.location.href = '/logout';
	};
</script>

<div class="app">
	<header>
		<div class="container">
			<h1>Web3 Cooperative Platform</h1>
			{#if coopStore.isLoading}
				<div class="loading">Loading...</div>
			{:else if coopStore.isLoggedIn}
				<button onclick={handleLogout}>Logout</button>
			{:else}
				<button onclick={handleLogin}>Login with Internet Identity</button>
			{/if}
		</div>
	</header>

	<main class="container">
		{#if coopStore.errorMessage}
			<div class="error-message">{coopStore.errorMessage}</div>
		{/if}

		{@render children()}
	</main>

	<footer>
		<div class="container">
			<p>2025 Web3 Cooperative Platform - Built on the Internet Computer Protocol</p>
		</div>
	</footer>
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.container {
		width: 100%;
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1rem;
	}

	header {
		background-color: #3730a3;
		color: white;
		padding: 1rem 0;
	}

	header .container {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	main {
		flex: 1;
		padding: 2rem 0;
	}

	footer {
		background-color: #f3f4f6;
		padding: 1rem 0;
		text-align: center;
	}

	.error-message {
		background-color: #fee2e2;
		color: #b91c1c;
		padding: 0.75rem 1rem;
		border-radius: 0.375rem;
		margin-bottom: 1rem;
	}

	.loading {
		font-style: italic;
	}

	button {
		background-color: #4f46e5;
		color: white;
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		font-weight: 500;
	}

	button:hover {
		background-color: #4338ca;
	}
</style>
