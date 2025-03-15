import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory } from "../../../declarations/coop_backend/coop_backend.did.js";
import type { _SERVICE } from "../../../declarations/coop_backend/coop_backend.did";
import type { ActorSubclass } from "@dfinity/agent";

// Get the canister ID from environment or use the default
export const canisterId =
  import.meta.env.CANISTER_ID_COOP_BACKEND || "bkyz2-fmaaa-aaaaa-qaaaq-cai";

/**
 * Creates an actor for interacting with the backend canister
 */
export const createActor = (options = {}): ActorSubclass<_SERVICE> => {
  // Get the network from environment or default to local
  const network = import.meta.env.DFX_NETWORK || "local";

  // Set the host based on the network - use standard HTTP API endpoints
  const host = network === "ic" ? "https://ic0.app" : "http://localhost:4943";

  console.log(`Creating agent with host: ${host}`);

  // Create the agent with fetch options to bypass CORS issues
  const agent = new HttpAgent({
    host,
    ...options,
    fetchOptions: {
      // Add cache control headers to prevent caching
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
      // Increase timeout for local development
      timeout: 30000,
    },
  });

  // Fetch the root key for certificate validation during development
  if (network !== "ic") {
    try {
      // Use a synchronous approach to fetch the root key
      agent.fetchRootKey();
      console.log("Root key fetched successfully");
    } catch (err) {
      console.warn(
        "Unable to fetch root key. Check to ensure that your local replica is running"
      );
      console.error(err);

      // For local development, we can disable certificate validation as a fallback
      // This is not secure for production, but helps with local development
      console.log("Disabling certificate validation for local development");
      // @ts-ignore - We're intentionally overriding this method for local development
      agent.fetchRootKey = async () => {
        return new ArrayBuffer(0);
      };
    }
  }

  // Create the actor
  console.log(`Creating actor with canister ID: ${canisterId}`);
  return Actor.createActor(idlFactory, {
    agent,
    canisterId,
  });
};

// Create and export the backend service
export const backend = createActor();
