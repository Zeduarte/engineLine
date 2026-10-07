# agent-client

Minimal Managed Agents client. It creates a session for agent
`agent_018KfafyVentGtjnFrnCVDpa` in environment `env_01JtXUV2Y7T9m8ZfxHuXh3CC`,
opens the event stream, sends one `user.message` and prints the agent's text
as `agent.message` events arrive. It stops when the session goes idle.

This folder is standalone: it has its own `package.json` and is excluded from
the website build.

## Run

```bash
cd agent-client
npm install
export ANTHROPIC_API_KEY=...   # or: ant auth login
npm start -- "Summarise what you can do"
```

Override the IDs with `AGENT_ID=... ENVIRONMENT_ID=... npm start`.

## Behaviour

- **Stream first:** the stream is opened before the message is sent, so no early events are lost.
- **Finish:** `session.status_idle` with `stop_reason` `end_turn` exits with code 0. Idle with `requires_action` keeps streaming.
- **Errors:** `session.error`, a terminated session, another idle stop reason or an API error all print a message and exit with code 1.
- **Tool approvals:** calls that pause for approval are denied, because this client runs unattended.
- **Custom tools:** any custom-tool call gets an error result, so the session doesn't hang.
- **Ctrl+C:** sends `user.interrupt` and exits.
- Each run creates a new session, which is billed to your account.
