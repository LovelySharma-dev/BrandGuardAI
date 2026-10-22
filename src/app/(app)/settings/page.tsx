import { AppShell } from "@/components/layout/app-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <AppShell
      title="Settings"
      description="Organisation preferences for the Phase 1 foundation."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Organisation</CardTitle>
            <CardDescription>Demo tenant used for local development.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between gap-4 border-b border-border py-2">
              <span className="text-muted-foreground">Org ID</span>
              <span className="font-mono text-xs">org_demo</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-border py-2">
              <span className="text-muted-foreground">Pinned kit</span>
              <span>Inkloom Demo Brand Kit v1.0.0</span>
            </div>
            <div className="flex justify-between gap-4 py-2">
              <span className="text-muted-foreground">Auth</span>
              <span>Not configured (Phase 3)</span>
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
