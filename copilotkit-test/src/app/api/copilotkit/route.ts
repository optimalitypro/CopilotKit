import { NextRequest } from "next/server";
import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  ExperimentalEmptyAdapter,
} from "@copilotkit/runtime";

const serviceAdapter = new ExperimentalEmptyAdapter();

let remoteChatServerUrl =
  process.env.REMOTE_CHAT_SERVER_URL || "http://localhost:8000/agent/arangodb";
// Remove trailing slash if it exists
if (remoteChatServerUrl.endsWith("/")) {
  remoteChatServerUrl = remoteChatServerUrl.slice(0, -1);
}

console.log(
  "[OPTI-LOG] Normalized remote chat server URL:",
  remoteChatServerUrl
);
// Health check function to verify remote chat server is accessible
async function checkRemoteServerHealth(remoteChatServerUrl: string) {
  try {
    const healthEndpoint = `${remoteChatServerUrl}/health`;
    console.log("[OPTI-LOG] Checking remote server health at:", healthEndpoint);

    const response = await fetch(healthEndpoint);
    const data = await response.json();

    console.log("[OPTI-LOG] Remote server health response:", data);
    return data;
  } catch (error) {
    console.error("[OPTI-LOG] Failed to check remote server health:", error);
    return { status: "error", message: "Failed to connect to remote server" };
  }
}

// Perform health check on startup
checkRemoteServerHealth(remoteChatServerUrl);

const runtime = new CopilotRuntime({
  remoteEndpoints: [
    {
      url: `${remoteChatServerUrl}/copilotkit`,
    },
  ],
});

export const POST = async (req: NextRequest) => {
  const endpoint = "/api/copilotkit";
  console.log("[OPTI-LOG] API endpoint path:", endpoint);

  // const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
  //   runtime,
  //   serviceAdapter,
  //   endpoint: endpoint,
  // });

  // return handleRequest(req);

  console.log(
    "[OPTI-LOG] Creating copilotRuntimeNextJSAppRouterEndpoint with params:",
    {
      runtime: runtime ? "Runtime instance present" : "Runtime missing",
      serviceAdapter: serviceAdapter
        ? "Service adapter present"
        : "Service adapter missing",
      endpoint,
    }
  );

  try {
    const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
      runtime,
      serviceAdapter,
      endpoint: endpoint,
    });

    console.log("[OPTI-LOG] Successfully created handleRequest function");

    console.log("[OPTI-LOG] Processing incoming request");
    const response = await handleRequest(req);
    console.log("[OPTI-LOG] Request handled successfully");

    return response;
  } catch (error: unknown) {
    console.error("[OPTI-LOG] Error in copilotkit endpoint:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
