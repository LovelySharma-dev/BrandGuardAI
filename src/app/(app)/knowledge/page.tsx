import { AppShell } from "@/components/layout/app-shell";
import { KitDraftEditor } from "@/components/knowledge/kit-draft-editor";
import { PdfFactImport } from "@/components/knowledge/pdf-fact-import";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FOUNDING_FACT_ID, getDraftBrandKit, getPublishedBrandKit } from "@/db/brand-kits";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Brand Knowledge" };
export const maxDuration = 60;

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

  return (
    <AppShell
      title="Brand Knowledge"
      description={`${kit.name} · published v${kit.version}. Reviews pin this version.`}
    >
      <div className="flex flex-col gap-8">
        {user.role === "admin" ? (
          <section className="flex flex-col gap-3">
            <div className="max-w-2xl">
              <h2 className="font-heading text-lg font-semibold">Draft kit</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Open one row to edit it. Publishing freezes the next version and
                leaves v{kit.version} in place.
              </p>
            </div>
            <KitDraftEditor
              key={`${draft?.version ?? "none"}:${kit.version}`}
              publishedVersion={kit.version}
              draftVersion={draft?.version ?? null}
              lockedFactId={FOUNDING_FACT_ID}
              sources={(draft ?? kit).sources.map((source) => ({
                id: source.id,
                title: source.title,
              }))}
              initialFacts={(draft ?? kit).facts.map((fact) => ({
                id: fact.id,
                statement: fact.statement,
                keywords: fact.keywords.join(", "),
                phrases: fact.contradictingPhrases.join(", "),
                sourceId: fact.sourceId,
              }))}
              initialTerms={(draft ?? kit).termRules.map((rule) => ({
                id: rule.id,
                type: rule.type,
                terms: rule.terms.join(", "),
                replacement: rule.preferredReplacement ?? "",
                severity: rule.severity,
                message: rule.message,
                enabled: rule.enabled,
              }))}
              initialPolicies={(draft ?? kit).claimPolicies.map((policy) => ({
                id: policy.id,
                pattern: policy.pattern,
                severity: policy.severity,
                message: policy.message,
                enabled: policy.enabled,
              }))}
            />
          </section>
        ) : null}

        <section className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="font-heading text-lg font-semibold">Published facts</h2>
            <p className="mt-1 mb-3 text-sm text-muted-foreground">
              v{kit.version}. Reviews pin these statements.
            </p>
            <ul className="divide-y divide-border border-y border-border">
              {kit.facts.map((fact) => (
                <li key={fact.id} className="py-3">
                  <p className="font-serif text-[15px] leading-relaxed">{fact.statement}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {kit.sources.find((source) => source.id === fact.sourceId)?.title ??
                      fact.sourceId}
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-heading text-lg font-semibold">Sources</h2>
            <p className="mt-1 mb-3 text-sm text-muted-foreground">
              A citation counts only when its id is in the review snapshot.
            </p>
            <ul className="divide-y divide-border border-y border-border">
              {kit.sources.map((src) => (
                <li key={src.id} className="py-3">
                  <p className="text-sm font-medium">{src.title}</p>
                  <p className="mt-1 font-serif text-sm leading-relaxed text-muted-foreground">
                    {src.excerpt}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="font-heading text-lg font-semibold">Term rules</h2>
            <ul className="mt-3 divide-y divide-border border-y border-border">
              {kit.termRules.map((rule) => (
                <li key={rule.id} className="flex items-start justify-between gap-4 py-3">
                  <span className="text-sm leading-relaxed">{rule.message}</span>
                  <Badge variant="outline">{rule.severity}</Badge>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-heading text-lg font-semibold">Claim policies</h2>
            <ul className="mt-3 divide-y divide-border border-y border-border">
              {kit.claimPolicies.map((policy) => (
                <li key={policy.id} className="py-3">
                  <div className="flex items-start justify-between gap-4">
                    <p className="font-serif text-[15px]">“{policy.pattern}”</p>
                    <Badge variant="outline">{policy.severity}</Badge>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {policy.message}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {user.role === "admin" ? (
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Import a brand PDF</CardTitle>
              <CardDescription>
                Read sentences into the draft. Publishing is still separate.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {kit.colorTokens.length > 0 ? (
                <ul className="flex flex-wrap gap-3 text-sm">
                  {kit.colorTokens.map((token) => (
                    <li key={token.id} className="flex items-center gap-2">
                      <span
                        className="size-4 rounded-sm border border-border"
                        style={{ backgroundColor: token.hex }}
                        aria-hidden
                      />
                      <span>
                        {token.name} {token.hex}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  This kit has no color tokens, so contrast checks are skipped.
                </p>
              )}
              <PdfFactImport />
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
