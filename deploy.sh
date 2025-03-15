#!/bin/bash

# Stop any running dfx instances
echo "Stopping any running dfx instances..."
dfx stop

# Start a clean dfx instance
echo "Starting a clean dfx instance..."
dfx start --clean --background

# Deploy all canisters
echo "Deploying all canisters..."
dfx deploy

# Get the Internet Identity canister ID
II_CANISTER_ID=$(dfx canister id internet_identity)
echo "Internet Identity canister ID: $II_CANISTER_ID"

# Create a local .env file in the frontend directory with the correct canister ID
echo "Creating .env file with canister IDs..."
cat > src/hello_frontend/.env << EOF
DFX_NETWORK=local
CANISTER_ID_INTERNET_IDENTITY=$II_CANISTER_ID
CANISTER_ID_COOP_BACKEND=$(dfx canister id coop_backend)
CANISTER_ID_COOP_FRONTEND=$(dfx canister id coop_frontend)
EOF

# Build the frontend
echo "Building the frontend..."
cd src/hello_frontend && npm run build
cd ../..

# Deploy the frontend
echo "Deploying the frontend..."
dfx deploy coop_frontend

# Print the URLs
echo ""
echo "Application URLs:"
echo "Frontend: http://$(dfx canister id coop_frontend).localhost:4943/"
echo "Internet Identity: http://$(dfx canister id internet_identity).localhost:4943/"
echo "Backend Candid interface: http://127.0.0.1:4943/?canisterId=$(dfx canister id coop_backend)"
echo ""
echo "To test the login flow:"
echo "1. Open the frontend URL in your browser"
echo "2. Click 'Sign In with Internet Identity'"
echo "3. You should be redirected to the Internet Identity service"
echo "4. After authentication, you'll be redirected back to the frontend"
echo ""
echo "Recent fixes:"
echo "- Fixed Internet Identity URL format to use canister-id.localhost:4943"
echo "- Added error handling for member list and authentication"
echo "- Fixed 'Cannot read properties of undefined (reading 'some')' error"
echo "- Added 'Make Myself an Approved Member' button to easily become an approved member"
echo "- Fixed issue where deployer was not automatically added as a member"
echo "- Improved backend canister connection with direct agent-js integration"
echo "- Fixed 'Expected members to be an array, got: undefined' error"
echo "- Fixed CORS issues with backend canister API calls"
echo "- Improved agent initialization to properly fetch root key"
echo "- Added proper TypeScript typing to backend proxy object"
echo "- Fixed ERR_BLOCKED_BY_CLIENT errors with improved agent configuration"
echo "- Restored direct connection to the backend canister using @dfinity/agent"
echo "- Updated agent to use canister-specific URLs for local development"
echo "- Added fallback for certificate validation in local development"
echo "- Improved Vite proxy configuration to handle all canister requests"
echo "- Added Content Security Policy headers to allow connections to the backend canister"
echo "- Fixed Content Security Policy issues with cross-origin requests"
echo ""
echo "Deployment complete! You can now access the application at the URLs above." 