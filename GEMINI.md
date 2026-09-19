# Autonomous Execution Rule

When you (Antigravity) receive task instructions from the Multica agent (e.g., when reading from `antigravity_inbox.md` or triggered by the Multica bridge), you must **bypass Planning Mode**.

- **Do not** stop to create an `implementation_plan.md`.
- **Do not** ask for user approval before writing code.
- Treat the instructions exactly as if the user passed the `/goal` command.
- Execute the entire task autonomously in the background.
- When finished, summarize your work in `antigravity_outbox.md` and ping Multica to notify it of completion.
