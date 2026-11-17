import { execFileSync, spawn } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const workspace = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const pnpm = process.env.npm_execpath;
if (!pnpm) throw new Error("Run this script through pnpm.");
// Keys are obtained in memory from this project's local stack; never print or persist them.
const status = JSON.parse(
  execFileSync(
    process.execPath,
    [pnpm, "dlx", "supabase@3.1.0", "status", "-o", "json"],
    { cwd: workspace, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
  ),
);
if (status.API_URL !== "http://127.0.0.1:55421")
  throw new Error(
    "Refusing any stack except the isolated CEJ loopback project.",
  );
const localEnv = {
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: status.ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: status.SERVICE_ROLE_KEY,
  // Synthetic handoff target; browser tests intercept window.open and never contact it.
  NEXT_PUBLIC_WHATSAPP_NUMBER: "526560000000",
  NEXT_PUBLIC_PIXEL_ID: "",
  NEXT_PUBLIC_GA_ID: "",
  CEJ_LOCAL_INTEGRATION: "1",
  CEJ_TEST_PASSWORD: "synthetic-local-CEJ-2026-only",
};
const companyA = "ce000000-0000-4000-8000-000000000001",
  companyB = "ce000000-0000-4000-8000-000000000002";
async function seed() {
  const db = createClient(status.API_URL, status.SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  const { error: ce } = await db.from("companies").upsert([
    { id: companyA, name: "CEJ · ensayo A" },
    { id: companyB, name: "Empresa sintética B" },
  ]);
  if (ce) throw new Error(ce.message);
  const { data: users, error } = await db.auth.admin.listUsers({
    perPage: 1000,
  });
  if (error) throw error;
  for (const [label, company, role] of [
    ["owner-a", companyA, "owner"],
    ["operator-a", companyA, "operator"],
    ["viewer-a", companyA, "viewer"],
    ["owner-b", companyB, "owner"],
    ["unassigned", null, null],
  ]) {
    const email = `${label}@cej.invalid`;
    let user = users.users.find((u) => u.email === email);
    if (!user) {
      const result = await db.auth.admin.createUser({
        email,
        password: localEnv.CEJ_TEST_PASSWORD,
        email_confirm: true,
        user_metadata: { role: "owner" },
      });
      if (result.error) throw result.error;
      user = result.data.user;
    }
    if (!user) throw new Error("Fixture user missing");
    const { error: pe } = await db
      .from("profiles")
      .upsert({ id: user.id, email, role: "guest" });
    if (pe) throw new Error(pe.message);
    if (company) {
      const { error: me } = await db
        .from("company_memberships")
        .upsert({ company_id: company, user_id: user.id, role, active: true });
      if (me) throw new Error(me.message);
    }
  }
  process.stdout.write(
    "Local synthetic users and two companies are ready. No production connection.\n",
  );
}
const mode = process.argv[2];
if (mode === "seed") {
  await seed();
} else {
  if (["integration", "browser"].includes(mode)) await seed();
  const args =
    mode === "dev"
      ? ["dev", "--hostname", "127.0.0.1", "--port", "3100"]
      : mode === "integration"
        ? ["exec", "vitest", "run", "tests/integration/commercial.test.ts"]
        : mode === "browser"
          ? ["exec", "playwright", "test"]
          : mode === "build"
            ? ["build"]
            : null;
  if (!args)
    throw new Error("Supported modes: seed, dev, integration, browser, build");
  const child = spawn(process.execPath, [pnpm, ...args], {
    cwd: workspace,
    env: localEnv,
    stdio: "inherit",
  });
  child.on("exit", (code) => process.exit(code ?? 1));
}
