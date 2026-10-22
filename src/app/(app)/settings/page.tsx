import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/session";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();
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
              Queries for this session are limited to this organisation.
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
              <span>Not wired (later phase)</span>
            </div>
            <div className="flex justify-between gap-4 py-2">
              <span className="text-muted-foreground">Persistence</span>
              <span>In-memory store</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
