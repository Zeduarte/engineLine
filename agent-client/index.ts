/**
 * Minimal Managed Agents client.
 *
 * Creates a session for an existing agent, opens the event stream, sends one
 * user message and prints the agent's replies until the session goes idle.
 *
 *   npm start -- "your message here"
 *
 * Credentials come from the environment (ANTHROPIC_API_KEY, or an
 * `ant auth login` profile). Never hardcode a key here.
 */
import Anthropic from "@anthropic-ai/sdk";

const AGENT_ID = process.env.AGENT_ID ?? "agent_018KfafyVentGtjnFrnCVDpa";
const ENVIRONMENT_ID = process.env.ENVIRONMENT_ID ?? "env_01JtXUV2Y7T9m8ZfxHuXh3CC";
const DEFAULT_PROMPT = "Hello! Briefly tell me what you can do.";

const client = new Anthropic();

/** Runs one turn and resolves with the process exit code. */
async function run(prompt: string): Promise<number> {
  const session = await client.beta.sessions.create({
    agent: AGENT_ID,
    environment_id: ENVIRONMENT_ID,
  });
  console.error(`Session ${session.id}`);
  // Swap "default" for your workspace ID if the key is not in the Default workspace.
  console.error(`Trace: https://platform.claude.com/workspaces/default/sessions/${session.id}\n`);

  // Ctrl+C: ask the agent to stop at a safe point, then leave.
  process.once("SIGINT", () => {
    console.error("\nInterrupting…");
    client.beta.sessions.events
      .send(session.id, { events: [{ type: "user.interrupt" }] })
      .catch(() => {})
      .finally(() => process.exit(130));
  });

  // Stream first, then send: the stream only delivers events emitted after it opens.
  const stream = await client.beta.sessions.events.stream(session.id);
  await client.beta.sessions.events.send(session.id, {
    events: [{ type: "user.message", content: [{ type: "text", text: prompt }] }],
  });

  for await (const event of stream) {
    switch (event.type) {
      case "agent.message":
        for (const block of event.content) {
          if (block.type === "text") process.stdout.write(block.text);
        }
        process.stdout.write("\n");
        break;

      case "agent.tool_use":
      case "agent.mcp_tool_use":
        // A call paused for approval. Nobody is watching this run, so deny it.
        if (event.evaluated_permission === "ask") {
          await client.beta.sessions.events.send(session.id, {
            events: [
              {
                type: "user.tool_confirmation",
                tool_use_id: event.id,
                result: "deny",
                deny_message: "This client runs unattended and cannot approve tool calls.",
              },
            ],
          });
        }
        break;

      case "agent.custom_tool_use":
        // This client implements no custom tools; answer so the session doesn't hang.
        await client.beta.sessions.events.send(session.id, {
          events: [
            {
              type: "user.custom_tool_result",
              custom_tool_use_id: event.id,
              is_error: true,
              content: [{ type: "text", text: `Custom tool "${event.name}" is not available in this client.` }],
            },
          ],
        });
        break;

      case "session.error":
        console.error(`\n[session error] ${event.error?.message ?? "unknown error"}`);
        return 1;

      case "session.status_idle":
        // requires_action means the session is waiting on us (handled above): keep streaming.
        if (event.stop_reason.type === "requires_action") break;
        if (event.stop_reason.type === "end_turn") return 0;
        console.error(`\n[session stopped: ${event.stop_reason.type}]`);
        return 1;

      case "session.status_terminated":
        console.error("\n[session terminated]");
        return 1;
    }
  }

  console.error("\n[stream closed before the session finished]");
  return 1;
}

async function main(): Promise<void> {
  const prompt = process.argv.slice(2).join(" ").trim() || DEFAULT_PROMPT;
  try {
    process.exitCode = await run(prompt);
  } catch (error) {
    // Most specific first; all API errors extend Anthropic.APIError.
    if (error instanceof Anthropic.AuthenticationError) {
      console.error("Authentication failed: set ANTHROPIC_API_KEY or run `ant auth login`.");
    } else if (error instanceof Anthropic.NotFoundError) {
      console.error(`Not found: check the agent (${AGENT_ID}) and environment (${ENVIRONMENT_ID}) IDs.`);
    } else if (error instanceof Anthropic.RateLimitError) {
      console.error("Rate limited: try again in a moment.");
    } else if (error instanceof Anthropic.APIConnectionError) {
      console.error(`Could not reach the API: ${error.message}`);
    } else if (error instanceof Anthropic.APIError) {
      console.error(`API error ${error.status}: ${error.message}`);
    } else {
      console.error(error instanceof Error ? error.message : error);
    }
    process.exitCode = 1;
  }
}

await main();
