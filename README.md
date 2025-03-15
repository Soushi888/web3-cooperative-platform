# Web3 Cooperative Platform

A prototype for a decentralized cooperative platform built on the Internet Computer Protocol (ICP).

## Overview

This prototype demonstrates core cooperative functionality—member registration and approval—using decentralized technologies. It serves as a foundation for a broader vision of a Web3 Coop that provides tools for other cooperatives, integrating fractal governance and advanced features in future iterations.

## Features

- **Authentication**: Sign in using Internet Identity (II)
- **Member Registration**: Request to join the cooperative
- **Member Approval**: Approved members can approve pending members
- **Member List**: View all members and their status

## Architecture

The application consists of two canisters:

1. **Backend Canister (Motoko)**: Manages the member registry and approval logic
2. **Frontend Canister (SvelteKit)**: Provides the user interface

## Getting Started

### Prerequisites

- [DFX SDK](https://sdk.dfinity.org/docs/quickstart/local-quickstart.html)
- Node.js and npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```

### Local Development

You can use the provided deployment script to deploy and run the application:

```bash
./deploy.sh
```

This script will:
1. Stop any running dfx instances
2. Start a clean dfx instance
3. Deploy all canisters (backend, frontend, and Internet Identity)
4. Build and deploy the frontend
5. Print the URLs for accessing the application

Alternatively, you can follow these steps manually:

1. Start the local Internet Computer replica:
   ```
   dfx start --clean --background
   ```

2. Deploy the canisters:
   ```
   dfx deploy
   ```

3. Build the frontend:
   ```
   cd src/hello_frontend && npm run build
   cd ../..
   ```

4. Deploy the frontend:
   ```
   dfx deploy coop_frontend
   ```

5. Open the frontend in your browser:
   ```
   http://localhost:4943/?canisterId=<frontend-canister-id>
   ```

## Usage

1. Sign in with Internet Identity
2. Request membership if you're not already a member
3. If you're an approved member, you can approve pending members
4. View the list of all members and their status

## Development

### Backend (Motoko)

The backend canister manages the member registry and provides the following functions:

- `register()`: Add the caller as a pending member
- `approveMember(principal)`: Approve a pending member
- `getMembers()`: Get the list of all members
- `isApprovedMember(principal)`: Check if a principal is an approved member

### Frontend (SvelteKit)

The frontend provides a user interface for interacting with the backend canister, including:

- Authentication with Internet Identity
- Member registration
- Member approval
- Member list display

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Internet Computer Protocol](https://internetcomputer.org/)
- [DFINITY Foundation](https://dfinity.org/)
- [SvelteKit](https://kit.svelte.dev/)
