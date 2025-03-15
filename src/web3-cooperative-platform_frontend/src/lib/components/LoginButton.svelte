<!-- LoginButton.svelte -->
<script lang="ts">
	import coopStore from '$lib/stores.svelte';
	import { authService } from '$lib/services/auth';

	$effect(() => {
		authService.initialize();
	});

	const handleAuth = async () => {
		if (coopStore.isLoggedIn) {
			await authService.logout();
		} else {
			await authService.login();
		}
	};
</script>

<button class="auth-button" onclick={handleAuth}>
	{coopStore.isLoggedIn ? 'Logout' : 'Login with Internet Identity'}
</button>

<style>
	.auth-button {
		background-color: #4f46e5;
		color: white;
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 0.375rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.auth-button:hover {
		background-color: #4338ca;
	}
</style>
