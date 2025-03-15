# Web3 Cooperative Platform Prototype Specification

**Version:** 1.0  
**Date:** March 14, 2025  
**Authors:** Soushi888, with assistance from Grok (xAI)  

---

## 1. Overview

### 1.1 Purpose
This specification defines a prototype for a Web3 Cooperative Platform built on the Internet Computer Protocol (ICP). The prototype aims to demonstrate core cooperative functionality—member registration and approval—using decentralized technologies. It serves as a foundation for a broader vision of a Web3 Coop that provides tools for other cooperatives, integrating fractal governance and advanced features in future iterations.

### 1.2 Scope
The prototype consists of:
- **Two Canisters:**
  - **Backend Canister:** Manages a registry of cooperative members, including registration requests and approval by existing members.
  - **Frontend Canister:** Hosts a SvelteKit-based user interface for member interaction.
- **Key Features:**
  - Authentication via ICP’s Internet Identity (II).
  - Member registration with approval workflow.
  - Automatic membership for the canister deployer.
- **Future Extensibility:** Support for shares, metadata, and fractal governance.

### 1.3 Objectives
- Validate ICP as a platform for cooperative applications.
- Demonstrate secure, decentralized member management.
- Establish a scalable base for additional Web3 coop tools.

---

## 2. Requirements

### 2.1 Functional Requirements
#### Backend Canister
- **FR1:** Store a persistent list of members, each with:
  - A unique `Principal` (from Internet Identity).
  - An `approved` status (`true` for approved, `false` for pending).
- **FR2:** Automatically register the wallet deploying the canister as the first approved member.
- **FR3:** Allow authenticated users to request membership, adding them to the list as pending.
- **FR4:** Enable approved members to approve pending members, with approval granted by a simple majority (threshold: >50% of approved members).
- **FR5:** Provide a query method to retrieve the current member list.

#### Frontend Canister
- **FR6:** Display a sign-in button using Internet Identity for authentication.
- **FR7:** Show the list of members (approved and pending) after sign-in.
- **FR8:** Offer a button for authenticated users to request membership.
- **FR9:** (Stretch Goal) Include an interface for approved members to vote on pending requests.

### 2.2 Non-Functional Requirements
- **NFR1:** Use ICP’s reverse gas model to ensure no transaction fees for users.
- **NFR2:** Ensure data persistence across canister upgrades (stable storage in Motoko).
- **NFR3:** Support local deployment and testing via DFX SDK.
- **NFR4:** Maintain simplicity for rapid prototyping and future extensibility.

### 2.3 Assumptions
- Users have a modern browser compatible with Internet Identity (e.g., Chrome, Firefox).
- The deployer has an ICP wallet and DFX installed.
- Approval logic is simplified to a single vote for this prototype (full voting to be added later).

---

## 3. System Architecture

### 3.1 Overview
The prototype is a two-canister application hosted on ICP:
- **Backend Canister:** Written in Motoko, manages logic and state.
- **Frontend Canister:** A SvelteKit static site, served as assets via ICP’s HTTP gateway.
- **Authentication:** Handled by Internet Identity, integrated via `@dfinity/auth-client`.

### 3.2 Canister Interaction
```
[User Browser]
      |
[Internet Identity] --> Authenticate --> [Frontend Canister (SvelteKit)]
      |                                       |
      +---------------------------------------+
                  Call Methods (Agent)        |
                 [Backend Canister (Motoko)] <+
                    (Member Registry)
```

### 3.3 Data Flow
1. User signs in via Internet Identity on the frontend.
2. Frontend retrieves the user’s `Principal` and interacts with the backend.
3. Backend processes registration/approval requests and updates the member list.
4. Frontend queries the member list for display.

---

## 4. Technical Specifications

### 4.1 Backend Canister
- **Language:** Motoko
- **File:** `src/backend/main.mo`
- **Data Structures:**
  ```motoko
  type Member = {
    principal: Principal; // Unique identifier from Internet Identity
    approved: Bool;      // Approval status
  };
  stable var members: [Member] = []; // Persistent member list
  stable var deployer: Principal;    // First member, set on deployment
  ```
- **Methods:**
  - `preupgrade()`: Initializes the deployer as the first approved member.
  - `register()`: Adds the caller as a pending member (shared, authenticated).
  - `approveMember(target: Principal)`: Approves a pending member if the caller is approved (shared, returns `Bool`).
  - `getMembers()`: Returns the member list (query).

### 4.2 Frontend Canister
- **Framework:** SvelteKit
- **Directory:** `src/frontend/`
- **Dependencies:**
  - `@dfinity/agent`: For canister communication.
  - `@dfinity/auth-client`: For Internet Identity integration.
- **Key Components:**
  - Sign-in logic using `AuthClient`.
  - UI to display members and trigger registration.
- **Build Output:** Static assets in `dist/` deployed to the canister.

### 4.3 Configuration
- **dfx.json:**
  ```json
  {
    "canisters": {
      "backend": {
        "main": "src/backend/main.mo",
        "type": "motoko"
      },
      "frontend": {
        "source": ["src/frontend/dist"],
        "type": "assets"
      }
    },
    "defaults": {
      "build": {
        "packtool": "npm run build"
      }
    }
  }
  ```

---

## 5. Implementation Details

### 5.1 Backend Canister Code
```motoko
import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Nat "mo:base/Nat";

actor {
  type Member = {
    principal: Principal;
    approved: Bool;
  };
  stable var members: [Member] = [];
  stable var deployer: Principal = Principal.fromActor(this);

  system func preupgrade() {
    if (members.size() == 0) {
      members := [{ principal = deployer; approved = true }];
    };
  };

  public shared(msg) func register() : async () {
    let caller = msg.caller;
    let exists = Array.find<Member>(members, func(m) { m.principal == caller });
    switch (exists) {
      case (?_) { /* Already registered */ };
      case null {
        members := Array.append(members, [{ principal = caller; approved = false }]);
      };
    };
  };

  public shared(msg) func approveMember(target: Principal) : async Bool {
    let voter = msg.caller;
    let voterApproved = Array.find<Member>(members, func(m) { m.principal == voter and m.approved });
    if (Option.isNull(voterApproved)) { return false; };

    let targetMember = Array.find<Member>(members, func(m) { m.principal == target });
    switch (targetMember) {
      case (?m) {
        if (not m.approved) {
          members := Array.map<Member, Member>(members, func(x) {
            if (x.principal == target) { { principal = x.principal; approved = true } } else { x }
          });
          return true;
        };
      };
      case null { /* Not found */ };
    };
    false
  };

  public query func getMembers() : async [Member] {
    members
  };
};
```

### 5.2 Frontend Canister Code (Sample)
- **`src/routes/+page.svelte`:**
  ```svelte
  <script>
    import { AuthClient } from '@dfinity/auth-client';
    import { HttpAgent, Actor } from '@dfinity/agent';
    import { onMount } from 'svelte';

    let identity, members = [];
    const canisterId = 'BACKEND_CANISTER_ID'; // Replace with actual ID
    const idlFactory = ({ IDL }) => {
      const Member = IDL.Record({ principal: IDL.Principal, approved: IDL.Bool });
      return IDL.Service({
        register: IDL.Func([], [], []),
        approveMember: IDL.Func([IDL.Principal], [IDL.Bool], []),
        getMembers: IDL.Func([], [IDL.Vec(Member)], ['query']),
      });
    };

    async function login() {
      const authClient = await AuthClient.create();
      await authClient.login({
        identityProvider: 'https://identity.ic0.app',
        onSuccess: async () => {
          identity = authClient.getIdentity();
          await fetchMembers();
        },
      });
    }

    async function fetchMembers() {
      const agent = new HttpAgent({ identity });
      const actor = Actor.createActor(idlFactory, { agent, canisterId });
      members = await actor.getMembers();
    }

    async function register() {
      const agent = new HttpAgent({ identity });
      const actor = Actor.createActor(idlFactory, { agent, canisterId });
      await actor.register();
      await fetchMembers();
    }

    onMount(() => {
      if (identity) fetchMembers();
    });
  </script>

  <h1>Web3 Coop Prototype</h1>
  {#if !identity}
    <button on:click={login}>Sign In with Internet Identity</button>
  {:else}
    <button on:click={register}>Request Membership</button>
    <h2>Members</h2>
    <ul>
      {#each members as member}
        <li>{member.principal.toText()} - {member.approved ? 'Approved' : 'Pending'}</li>
      {/each}
    </ul>
  {/if}
  ```

### 5.3 Deployment
- **Steps:**
  1. Install DFX: `sh -ci "$(curl -fsSL https://sdk.dfinity.org/install.sh)"`.
  2. Start local replica: `dfx start --background`.
  3. Deploy: `dfx deploy`.
  4. Access frontend at `http://localhost:4943/?canisterId=<frontend-id>`.

---

## 6. Testing Plan

### 6.1 Unit Tests
- **Backend:**
  - Test `register()` adds a pending member.
  - Test `approveMember()` changes status only for approved voters.
  - Test `getMembers()` returns the correct list.
- **Frontend:**
  - Verify sign-in redirects to II and returns a Principal.
  - Confirm member list updates after registration.

### 6.2 Integration Tests
- Deploy locally and simulate:
  - Deployer auto-registration.
  - New user sign-in and registration.
  - Approval by deployer.

---

## 7. Future Enhancements
- Add member attributes (e.g., `shares: Nat`, `metadata: Text`).
- Implement full voting logic for approvals (e.g., track votes per member).
- Integrate fractal governance (group formation, iterative elections).
- Enhance UI with approval voting controls.

---

## 8. Risks and Mitigations
- **Risk:** Internet Identity adoption barrier.  
  **Mitigation:** Provide clear sign-in instructions.
- **Risk:** Canister cycle exhaustion.  
  **Mitigation:** Fund canisters with sufficient cycles during deployment.
- **Risk:** Approval logic too simple.  
  **Mitigation:** Start minimal, expand later.

---

## 9. Glossary
- **ICP:** Internet Computer Protocol, a blockchain platform by DFINITY.
- **Internet Identity (II):** ICP’s decentralized authentication system.
- **Canister:** A smart contract unit on ICP.
- **Motoko:** A programming language for ICP canisters.
- **SvelteKit:** A framework for building web applications.
