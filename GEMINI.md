# Autonomous Execution Rule

When you (Antigravity) receive task instructions from the Multica agent (e.g., when reading from `antigravity_inbox.md` or triggered by the Multica bridge), you must **bypass Planning Mode**.

- **Do not** stop to create an `implementation_plan.md`.
- **Do not** ask for user approval before writing code.
- Treat the instructions exactly as if the user passed the `/goal` command.
- Execute the entire task autonomously in the background.
- When finished, summarize your work in `antigravity_outbox.md` and ping Multica to notify it of completion.

# Multica Deployment Agent Integration

When a task involves deploying the application to production (e.g., Vercel, Railway, etc.), you must interface with the Multica Deployment Agent:
- **Do not** attempt to deploy the application manually using local CLI tools.
- Hand off the deployment task by calling the `notify_multica` MCP tool.
- Address the message specifically to the **Multica Deployment Agent** and instruct it to command the deployment.
- Provide the Deployment Agent with all necessary context, such as the current Git commit hash, branch name, and any required environment variables.
