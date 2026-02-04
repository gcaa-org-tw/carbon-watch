import { execSync } from "node:child_process";

interface ToolInput {
  tool_input?: {
    file_path?: string;
    path?: string;
  };
}

async function main(): Promise<void> {
  const chunks: Uint8Array[] = [];

  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }

  const toolArgs: ToolInput = JSON.parse(Buffer.concat(chunks).toString());
  const file =
    toolArgs.tool_input?.file_path ?? toolArgs.tool_input?.path ?? "";

  // Only check TypeScript and Vue files
  if (!file || !/\.(ts|tsx|vue)$/.test(file)) {
    process.exit(0);
  }

  const command = "npx nuxi typecheck";
  try {
    execSync(command, {
      stdio: "pipe",
      encoding: "utf-8",
    });
  } catch (err: unknown) {
    const error = err as { stdout?: string; stderr?: string };
    const output = error.stdout || error.stderr || "Type check failed";
    console.error(`
      Type check failed after editing: ${file}

      Likely cause:
      - A function signature was changed
      - Some call sites were not updated

      Details:
      ${output}
    `);
    process.exit(2);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
