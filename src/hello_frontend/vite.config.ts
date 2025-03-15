import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig, loadEnv } from "vite";
import { readFileSync, existsSync } from "fs";
import * as path from "path";

// Load environment variables from .env file
const env = loadEnv("all", process.cwd());

// Try to read canister IDs from various possible locations
let internetIdentityCanisterId = "be2us-64aaa-aaaaa-qaabq-cai"; // Use your currently deployed II canister ID as fallback
let backendCanisterId = "bkyz2-fmaaa-aaaaa-qaaaq-cai"; // Use your currently deployed backend canister ID as fallback

// Paths to check for canister IDs
const possiblePaths = [
  path.resolve(".dfx", "local", "canister_ids.json"),
  path.resolve("..", ".dfx", "local", "canister_ids.json"),
  path.resolve("..", "..", ".dfx", "local", "canister_ids.json"),
  path.resolve(process.cwd(), ".dfx", "local", "canister_ids.json"),
];

// Try each path until we find a valid canister_ids.json file
for (const filePath of possiblePaths) {
  if (existsSync(filePath)) {
    try {
      const canisterIds = JSON.parse(readFileSync(filePath, "utf8"));
      if (canisterIds?.internet_identity?.local) {
        internetIdentityCanisterId = canisterIds.internet_identity.local;
        console.log(
          `Found Internet Identity canister ID: ${internetIdentityCanisterId}`
        );
      }
      if (canisterIds?.coop_backend?.local) {
        backendCanisterId = canisterIds.coop_backend.local;
        console.log(`Found Backend canister ID: ${backendCanisterId}`);
      }
      break;
    } catch (e) {
      console.warn(`Error reading canister IDs from ${filePath}:`, e);
    }
  }
}

// If we still don't have valid canister IDs, try to read them from the .env file
if (env.CANISTER_ID_INTERNET_IDENTITY) {
  internetIdentityCanisterId = env.CANISTER_ID_INTERNET_IDENTITY;
  console.log(
    `Using Internet Identity canister ID from .env: ${internetIdentityCanisterId}`
  );
}

if (env.CANISTER_ID_COOP_BACKEND) {
  backendCanisterId = env.CANISTER_ID_COOP_BACKEND;
  console.log(`Using Backend canister ID from .env: ${backendCanisterId}`);
}

console.log(
  `Using Internet Identity canister ID: ${internetIdentityCanisterId}`
);
console.log(`Using Backend canister ID: ${backendCanisterId}`);

export default defineConfig({
  plugins: [sveltekit()],
  define: {
    // Make environment variables available to the client
    "import.meta.env.DFX_NETWORK": JSON.stringify(env.DFX_NETWORK || "local"),
    "import.meta.env.INTERNET_IDENTITY_CANISTER_ID": JSON.stringify(
      internetIdentityCanisterId
    ),
    "import.meta.env.CANISTER_ID_COOP_BACKEND": JSON.stringify(
      env.CANISTER_ID_COOP_BACKEND || backendCanisterId
    ),
    "import.meta.env.CANISTER_ID_COOP_FRONTEND": JSON.stringify(
      env.CANISTER_ID_COOP_FRONTEND || ""
    ),
  },
  server: {
    fs: {
      allow: [".", "../declarations"],
    },
    proxy: {
      // Proxy all requests to the local replica
      "^/api/.*": {
        target: "http://localhost:4943",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
      },
      // Direct canister access
      [`^/${backendCanisterId}/.*`]: {
        target: "http://localhost:4943",
        changeOrigin: true,
        secure: false,
      },
      [`^/${internetIdentityCanisterId}/.*`]: {
        target: "http://localhost:4943",
        changeOrigin: true,
        secure: false,
      },
    },
    // Disable CORS for local development
    cors: {
      origin: "*",
      methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
      preflightContinue: false,
      optionsSuccessStatus: 204,
    },
    // Add headers for Content Security Policy
    headers: {
      "Content-Security-Policy": `
        default-src 'self';
        connect-src 'self' http://localhost:4943 https://localhost:4943 http://*.localhost:4943 https://*.localhost:4943 https://*.ic0.app https://ic0.app;
        script-src 'self' 'unsafe-eval' 'unsafe-inline';
        style-src 'self' 'unsafe-inline';
        img-src 'self' data:;
        font-src 'self';
        object-src 'none';
        base-uri 'self';
        form-action 'self';
        frame-ancestors 'self';
      `
        .replace(/\s+/g, " ")
        .trim(),
    },
  },
});
