<script lang="ts">
  import coopStore from '$lib/stores.svelte';
  import { UserStatus } from '$lib/types';
  import MembersList from '$lib/components/MembersList.svelte';
  import MemberManagement from '$lib/components/MemberManagement.svelte';
</script>

<div class="home-container">
  <div class="header">
    <h1>Web3 Cooperative Platform</h1>
  </div>

  <div class="status-card">
    <h2>Your Status</h2>
    {#if coopStore.userStatus === null || coopStore.userStatus === UserStatus.NOT_LOGGED_IN}
      <p>You are not logged in. Please log in to access the platform.</p>
    {:else if coopStore.userStatus === UserStatus.NOT_REGISTERED}
      <p>You are logged in but not registered as a member. Please register to participate.</p>
    {:else if coopStore.userStatus === UserStatus.PENDING}
      <p>Your membership is pending approval. Please wait for an admin to approve your request.</p>
    {:else if coopStore.userStatus === UserStatus.APPROVED}
      <p>You are an approved member of the cooperative!</p>
    {/if}
  </div>

  {#if coopStore.userStatus && coopStore.userStatus !== UserStatus.NOT_LOGGED_IN}
    <MemberManagement />
    <MembersList />
  {/if}
</div>

<style>
  .home-container {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .status-card {
    background-color: white;
    border-radius: 0.5rem;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  h1 {
    font-size: 2rem;
    margin: 0;
    color: #3730a3;
  }

  h2 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: #4f46e5;
  }
</style>
