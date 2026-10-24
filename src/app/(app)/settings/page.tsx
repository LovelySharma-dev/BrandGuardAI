import { AppShell } from "@/components/layout/app-shell";
import { getDb, persistenceStatus } from "@/db/client";
import { requireUser } from "@/lib/session";
import { configuredFreeModel } from "@/engine/model-policy";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Settings" };

function directUrlState(): string {
  const direct = process.env.DIRECT_URL?.trim();
  if (!direct) {
    return "Not set. Migrations derive a direct host from DATABASE_URL.";
  }
  try {
    const host = new URL(direct).hostname;
    if (host.includes(".neon.neon.") || host.includes("-pooler")) {
      return "Set, but the hostname is not a direct host, so migrations ignore it.";
    }
    return "Set and used for migrations.";
  } catch {
    return "Set, but it is not a valid URL, so migrations ignore it.";
  }
}

export default async function SettingsPage() {
  const user = await requireUser();
  const freeModel = configuredFreeModel();
  await getDb();
  const persistence = persistenceStatus();
  const keySet = Boolean(process.env.OPENROUTER_API_KEY?.trim());
  const databaseSet = Boolean(process.env.DATABASE_URL?.trim());
  return (
    <AppShell
      title="Settings"
      description="Organisation and session for the signed-in user."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Organisation</CardTitle>
            <CardDescription>
              Queries for this session are limited to this organisation. Seeded
              accounts are demo-only.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between gap-4 border-b border-border py-2">
              <span className="text-muted-foreground">Organisation</span>
              <span>{user.orgName}</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-border py-2">
              <span className="text-muted-foreground">Org ID</span>
              <span className="font-mono text-xs">{user.orgId}</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-border py-2">
              <span className="text-muted-foreground">Signed in</span>
              <span>{user.email}</span>
            </div>
            <div className="flex justify-between gap-4 py-2">
              <span className="text-muted-foreground">Role</span>
              <span className="capitalize">{user.role}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Review engine</CardTitle>
            <CardDescription>
              Hybrid pipeline boundaries for this build.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between gap-4 border-b border-border py-2">
              <span className="text-muted-foreground">Deterministic validators</span>
              <span>Enabled</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-border py-2">
              <span className="text-muted-foreground">Evidence gate</span>
              <span>Fail closed</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-border py-2">
              <span className="text-muted-foreground">LLM adapter</span>
              <span>
                {freeModel.ok
                  ? freeModel.model
                  : "Refused until LLM_MODEL is a free id"}
              </span>
            </div>
            <div className="flex justify-between gap-4 border-b border-border py-2">
              <span className="text-muted-foreground">OpenRouter key</span>
              <span>{keySet ? "Present" : "Missing"}</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-border py-2">
              <span className="text-muted-foreground">LLM_PROVIDER</span>
              <span>Unused. Reviews call OpenRouter when the key and a free model are set.</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-border py-2">
              <span className="text-muted-foreground">DATABASE_URL</span>
              <span>{databaseSet ? "Set" : "Not set"}</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-border py-2">
              <span className="text-muted-foreground">DIRECT_URL</span>
              <span>{directUrlState()}</span>
            </div>
            <div className="flex justify-between gap-4 py-2">
              <span className="text-muted-foreground">Persistence</span>
              <span>
                {persistence.mode === "hosted" ? "Hosted Postgres" : "Local Postgres"}
                . {persistence.detail}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
