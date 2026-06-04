import { execSync } from "node:child_process";

const port = process.argv[2] || "5173";
if (!/^\d+$/.test(port)) process.exit(0);

try {
  const out = execSync(`netstat -ano | findstr ":${port}"`, { encoding: "utf8" });
  const pids = new Set();
  for (const line of out.split(/\r?\n/)) {
    if (!line.includes("LISTENING")) continue;
    const parts = line.trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    if (pid && /^\d+$/.test(pid) && pid !== "0") pids.add(pid);
  }
  for (const pid of pids) {
    try {
      execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
      console.log(`Port ${port} libéré (PID ${pid})`);
    } catch {
      /* ignore */
    }
  }
} catch {
  /* port déjà libre */
}