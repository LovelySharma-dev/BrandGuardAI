import { AppShell } from "@/components/layout/app-shell";
import { KitDraftEditor } from "@/components/knowledge/kit-draft-editor";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FOUNDING_FACT_ID, getDraftBrandKit, getPublishedBrandKit } from "@/db/brand-kits";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Brand Knowledge" };

export default async function KnowledgePage() {
  const user = await requireUser();
  const kit = await getPublishedBrandKit(user.orgId);
  const draft = await getDraftBrandKit(user.orgId);
  if (!kit) {
    return (
      <AppShell
        title="Brand Knowledge"
        description="This organisation has no published brand kit."
      >
        <p>Publish a brand kit before running reviews.</p>
      </AppShell>
    );
  }

  const founding = kit.facts.find((fact) => fact.id === FOUNDING_FACT_ID);
  const draftFounding = draft?.facts.find((fact) => fact.id === FOUNDING_FACT_ID);

  return (
    <AppShell
      title="Brand Knowledge"
      description={`${kit.name} · published v${kit.version}. Reviews pin this version.`}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Approved facts</CardTitle>
            <CardDescription>
              Published v{kit.version}. A draft edit does not change facts on
              this version.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {kit.facts.map((fact) => (
              <div key={fact.id} className="rounded-md border border-border p-3">
                <p className="font-serif text-sm leading-relaxed">
                  {fact.statement}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {fact.id} · source {fact.sourceId}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Evidence sources</CardTitle>
            <CardDescription>
              Snapshot membership is the authority for citations.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {kit.sources.map((src) => (
              <div key={src.id} className="rounded-md border border-border p-3">
                <p className="text-sm font-medium">{src.title}</p>
                <p className="mt-1 font-serif text-sm text-muted-foreground">
                  {src.excerpt}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">{src.id}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-none lg:col-span-2">
          <CardHeader>
            <CardTitle>Terminology & claim policies</CardTitle>
            <CardDescription>
              Deterministic validators emit <code>policy_hit</code> or{" "}
              <code>unsupported</code> — never <code>verified</code> from a
              keyword match alone.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-semibold">Term rules</h3>
              <ul className="flex flex-col gap-2">
                {kit.termRules.map((rule) => (
                  <li
                    key={rule.id}
                    className="flex flex-wrap items-center gap-2 text-sm"
                  >
                    <Badge variant="outline">{rule.severity}</Badge>
                    <span>{rule.message}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold">Claim policies</h3>
              <ul className="flex flex-col gap-2">
                {kit.claimPolicies.map((policy) => (
                  <li key={policy.id} className="text-sm">
                    <span className="font-medium">“{policy.pattern}”</span>
                    <Separator className="my-2" />
                    <span className="text-muted-foreground">
                      {policy.message}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {user.role === "admin" && founding ? (
          <Card className="shadow-none lg:col-span-2">
            <CardHeader>
              <CardTitle>Edit draft</CardTitle>
              <CardDescription>
                Admin only. Publishing freezes the next version. It does not
                rewrite v{kit.version}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <KitDraftEditor
                publishedVersion={kit.version}
                draftVersion={draft?.version ?? null}
                initialStatement={draftFounding?.statement ?? founding.statement}
              />
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
