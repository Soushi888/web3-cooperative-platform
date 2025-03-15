// Add type declaration for window.__CANISTERS__
declare global {
  interface Window {
    __CANISTERS__?: {
      coop_backend?: any;
    };
  }
}

// Create a dummy actor for build time or when real actor is not available
function dummyActor() {
  return new Proxy(
    {},
    {
      get() {
        return async () => {
          console.warn("Canister invoked with dummy actor");
          return undefined;
        };
      },
    }
  );
}

// Simple implementation that just returns the dummy actor
// This will be used when we can't create a real actor
function createDummyActor() {
  console.warn("Using dummy actor implementation");
  return dummyActor();
}

// Export the backend actor - using a simple approach that works in both client and server
let backend: any;

// In a browser environment, try to use the real actor
if (typeof window !== "undefined") {
  try {
    // Try to dynamically import the declarations
    const declarations =
      window.__CANISTERS__ && window.__CANISTERS__.coop_backend;

    if (declarations) {
      console.log("Using canister declarations from window.__CANISTERS__");
      backend = declarations;
    } else {
      console.warn("Canister declarations not found in window.__CANISTERS__");
      backend = createDummyActor();
    }
  } catch (e) {
    console.error("Error initializing backend actor:", e);
    backend = createDummyActor();
  }
} else {
  // In server environment, use the dummy actor
  console.warn("Running in server environment, using dummy actor");
  backend = createDummyActor();
}

// Export the backend
export { backend };

// Export the Member type for TypeScript support
export const MemberType = {
  principal: null,
  approved: false,
};
