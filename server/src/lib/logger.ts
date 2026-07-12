const LOG_DIR = new URL("../../logs", import.meta.url).pathname;

function ts(): string {
  return new Date().toISOString();
}

async function write(kind: string, data: unknown): Promise<void> {
  const file = `${LOG_DIR}/${kind}.log`;
  const line = `[${ts()}] ${typeof data === "string" ? data : JSON.stringify(data)}\n`;
  try {
    await Bun.write(Bun.file(file), line, { append: true });
  } catch {}
}

export const logger = {
  info(msg: string) {
    write("info", msg);
  },
  error(err: Error | string, context?: Record<string, unknown>) {
    const entry = {
      message: typeof err === "string" ? err : err.message,
      stack: typeof err === "string" ? undefined : err.stack,
      ...context,
    };
    write("error", entry);
    write("errors", entry);
  },
  request(method: string, url: string, status: number, ms: number) {
    write("access", `${method} ${url} ${status} ${ms}ms`);
  },
};
