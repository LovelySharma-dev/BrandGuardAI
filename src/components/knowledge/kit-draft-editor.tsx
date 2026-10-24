"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  publishBrandKitDraftAction,
  saveBrandKitDraftAction,
} from "@/app/actions/brand-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Severity = "blocker" | "warning" | "info";

export type DraftFactFields = {
  id: string;
  statement: string;
  keywords: string;
  phrases: string;
  sourceId: string;
};

export type DraftTermFields = {
  id: string;
  type: "banned" | "preferred";
  terms: string;
  replacement: string;
  severity: Severity;
  message: string;
  enabled: boolean;
};

export type DraftPolicyFields = {
  id: string;
  pattern: string;
  severity: Severity;
  message: string;
  enabled: boolean;
};

const fieldClass =
  "h-11 rounded-lg border border-input bg-card px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function nextId(prefix: string): string {
  return `new-${prefix}-${crypto.randomUUID()}`;
}

function RowButton({
  open,
  title,
  detail,
  aside,
  onClick,
}: {
  open: boolean;
  title: string;
  detail: string;
  aside: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={onClick}
      className="flex min-h-11 w-full items-start justify-between gap-4 px-4 py-3 text-left hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
    >
      <span className="min-w-0">
        <span className="block font-serif text-[15px] leading-snug text-foreground">
          {title || "Untitled"}
        </span>
        <span className="mt-1 block text-sm text-muted-foreground">{detail}</span>
      </span>
      <span className="shrink-0 pt-0.5 text-xs text-muted-foreground">{aside}</span>
    </button>
  );
}

export function KitDraftEditor({
  publishedVersion,
  draftVersion,
  lockedFactId,
  sources,
  initialFacts,
  initialTerms,
  initialPolicies,
}: {
  publishedVersion: string;
  draftVersion: string | null;
  lockedFactId: string;
  sources: { id: string; title: string }[];
  initialFacts: DraftFactFields[];
  initialTerms: DraftTermFields[];
  initialPolicies: DraftPolicyFields[];
}) {
  const router = useRouter();
  const [facts, setFacts] = useState(initialFacts);
  const [terms, setTerms] = useState(initialTerms);
  const [policies, setPolicies] = useState(initialPolicies);
  const [openId, setOpenId] = useState<string | null>(null);
  const [tab, setTab] = useState("facts");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const sourceTitle = (id: string) =>
    sources.find((source) => source.id === id)?.title ?? id;

  function toggle(id: string) {
    setOpenId((current) => (current === id ? null : id));
  }

  async function onSave() {
    setPending(true);
    setError(null);
    setMessage(null);
    const result = await saveBrandKitDraftAction({
      facts: facts.map((fact) => ({
        id: fact.id,
        statement: fact.statement,
        keywords: splitList(fact.keywords),
        sourceId: fact.sourceId,
        contradictingPhrases: splitList(fact.phrases),
      })),
      termRules: terms.map((rule) => ({
        id: rule.id,
        type: rule.type,
        terms: splitList(rule.terms),
        preferredReplacement: rule.replacement.trim() || undefined,
        severity: rule.severity,
        message: rule.message,
        enabled: rule.enabled,
      })),
      claimPolicies: policies.map((policy) => ({
        id: policy.id,
        pattern: policy.pattern,
        severity: policy.severity,
        message: policy.message,
        enabled: policy.enabled,
      })),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage(
      `Draft v${result.kit.version} saved. Published v${publishedVersion} is unchanged, and reviews pinned to it stay on that version.`,
    );
    router.refresh();
  }

  async function onPublish() {
    setPending(true);
    setError(null);
    setMessage(null);
    const result = await publishBrandKitDraftAction();
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage(`Published v${result.kit.version}. Earlier versions stay readable.`);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
        {draftVersion
          ? `Draft v${draftVersion} is waiting. Reviews still use published v${publishedVersion}.`
          : `Saving creates the next patch as a draft. Published v${publishedVersion} stays as it is.`}
      </p>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-11 w-full sm:w-fit">
          <TabsTrigger value="facts" className="min-h-10 px-3">
            Facts {facts.length}
          </TabsTrigger>
          <TabsTrigger value="terms" className="min-h-10 px-3">
            Terms {terms.length}
          </TabsTrigger>
          <TabsTrigger value="policies" className="min-h-10 px-3">
            Policies {policies.length}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="facts" className="mt-3">
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            {facts.map((fact, index) => {
              const open = openId === fact.id;
              return (
                <div key={fact.id} className="border-b border-border last:border-b-0">
                  <RowButton
                    open={open}
                    title={fact.statement}
                    detail={sourceTitle(fact.sourceId)}
                    aside={fact.id === lockedFactId ? "Stays" : open ? "Close" : "Edit"}
                    onClick={() => toggle(fact.id)}
                  />
                  {open ? (
                    <div className="grid gap-3 border-t border-border bg-background px-4 py-4">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor={`fact-statement-${fact.id}`}>Statement</Label>
                        <Input
                          id={`fact-statement-${fact.id}`}
                          value={fact.statement}
                          onChange={(event) =>
                            setFacts((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, statement: event.target.value }
                                  : item,
                              ),
                            )
                          }
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="flex flex-col gap-2">
                          <Label htmlFor={`fact-keywords-${fact.id}`}>Keywords</Label>
                          <Input
                            id={`fact-keywords-${fact.id}`}
                            value={fact.keywords}
                            onChange={(event) =>
                              setFacts((current) =>
                                current.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, keywords: event.target.value }
                                    : item,
                                ),
                              )
                            }
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor={`fact-source-${fact.id}`}>Source</Label>
                          <select
                            id={`fact-source-${fact.id}`}
                            className={fieldClass}
                            value={fact.sourceId}
                            onChange={(event) =>
                              setFacts((current) =>
                                current.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, sourceId: event.target.value }
                                    : item,
                                ),
                              )
                            }
                          >
                            {sources.map((source) => (
                              <option key={source.id} value={source.id}>
                                {source.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor={`fact-phrases-${fact.id}`}>Contradicting phrases</Label>
                        <Input
                          id={`fact-phrases-${fact.id}`}
                          value={fact.phrases}
                          onChange={(event) =>
                            setFacts((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, phrases: event.target.value }
                                  : item,
                              ),
                            )
                          }
                        />
                      </div>
                      {fact.id === lockedFactId ? (
                        <p className="text-sm text-muted-foreground">
                          This founding fact stays in the kit.
                        </p>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          className="w-fit"
                          onClick={() => {
                            setFacts((current) => current.filter((item) => item.id !== fact.id));
                            setOpenId(null);
                          }}
                        >
                          Remove fact
                        </Button>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          <Button
            type="button"
            variant="outline"
            className="mt-3"
            onClick={() => {
              const id = nextId("fact");
              setFacts((current) => [
                ...current,
                {
                  id,
                  statement: "",
                  keywords: "",
                  phrases: "",
                  sourceId: sources[0]?.id ?? "",
                },
              ]);
              setOpenId(id);
              setTab("facts");
            }}
          >
            Add fact
          </Button>
        </TabsContent>

        <TabsContent value="terms" className="mt-3">
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            {terms.map((rule, index) => {
              const open = openId === rule.id;
              return (
                <div key={rule.id} className="border-b border-border last:border-b-0">
                  <RowButton
                    open={open}
                    title={rule.terms || "New term"}
                    detail={rule.message || "Add the message reviewers will see."}
                    aside={rule.enabled ? rule.severity : "Off"}
                    onClick={() => toggle(rule.id)}
                  />
                  {open ? (
                    <div className="grid gap-3 border-t border-border bg-background px-4 py-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="flex flex-col gap-2">
                          <Label htmlFor={`term-terms-${rule.id}`}>Terms</Label>
                          <Input
                            id={`term-terms-${rule.id}`}
                            value={rule.terms}
                            onChange={(event) =>
                              setTerms((current) =>
                                current.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, terms: event.target.value }
                                    : item,
                                ),
                              )
                            }
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor={`term-replacement-${rule.id}`}>
                            Preferred replacement
                          </Label>
                          <Input
                            id={`term-replacement-${rule.id}`}
                            value={rule.replacement}
                            onChange={(event) =>
                              setTerms((current) =>
                                current.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, replacement: event.target.value }
                                    : item,
                                ),
                              )
                            }
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor={`term-message-${rule.id}`}>Message</Label>
                        <Input
                          id={`term-message-${rule.id}`}
                          value={rule.message}
                          onChange={(event) =>
                            setTerms((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, message: event.target.value }
                                  : item,
                              ),
                            )
                          }
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <select
                          aria-label="Term severity"
                          className={fieldClass}
                          value={rule.severity}
                          onChange={(event) =>
                            setTerms((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, severity: event.target.value as Severity }
                                  : item,
                              ),
                            )
                          }
                        >
                          <option value="blocker">blocker</option>
                          <option value="warning">warning</option>
                          <option value="info">info</option>
                        </select>
                        <label className="flex min-h-11 items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={rule.enabled}
                            onChange={(event) =>
                              setTerms((current) =>
                                current.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, enabled: event.target.checked }
                                    : item,
                                ),
                              )
                            }
                          />
                          Enabled
                        </label>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setTerms((current) => current.filter((item) => item.id !== rule.id));
                            setOpenId(null);
                          }}
                        >
                          Remove term
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          <Button
            type="button"
            variant="outline"
            className="mt-3"
            onClick={() => {
              const id = nextId("term");
              setTerms((current) => [
                ...current,
                {
                  id,
                  type: "banned",
                  terms: "",
                  replacement: "",
                  severity: "warning",
                  message: "",
                  enabled: true,
                },
              ]);
              setOpenId(id);
              setTab("terms");
            }}
          >
            Add term rule
          </Button>
        </TabsContent>

        <TabsContent value="policies" className="mt-3">
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            {policies.map((policy, index) => {
              const open = openId === policy.id;
              return (
                <div key={policy.id} className="border-b border-border last:border-b-0">
                  <RowButton
                    open={open}
                    title={policy.pattern || "New pattern"}
                    detail={policy.message || "Say what the reviewer should do."}
                    aside={policy.enabled ? policy.severity : "Off"}
                    onClick={() => toggle(policy.id)}
                  />
                  {open ? (
                    <div className="grid gap-3 border-t border-border bg-background px-4 py-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="flex flex-col gap-2">
                          <Label htmlFor={`policy-pattern-${policy.id}`}>Pattern</Label>
                          <Input
                            id={`policy-pattern-${policy.id}`}
                            value={policy.pattern}
                            onChange={(event) =>
                              setPolicies((current) =>
                                current.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, pattern: event.target.value }
                                    : item,
                                ),
                              )
                            }
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor={`policy-severity-${policy.id}`}>Severity</Label>
                          <select
                            id={`policy-severity-${policy.id}`}
                            className={fieldClass}
                            value={policy.severity}
                            onChange={(event) =>
                              setPolicies((current) =>
                                current.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, severity: event.target.value as Severity }
                                    : item,
                                ),
                              )
                            }
                          >
                            <option value="blocker">blocker</option>
                            <option value="warning">warning</option>
                            <option value="info">info</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor={`policy-message-${policy.id}`}>Message</Label>
                        <Input
                          id={`policy-message-${policy.id}`}
                          value={policy.message}
                          onChange={(event) =>
                            setPolicies((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, message: event.target.value }
                                  : item,
                              ),
                            )
                          }
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="flex min-h-11 items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={policy.enabled}
                            onChange={(event) =>
                              setPolicies((current) =>
                                current.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, enabled: event.target.checked }
                                    : item,
                                ),
                              )
                            }
                          />
                          Enabled
                        </label>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setPolicies((current) =>
                              current.filter((item) => item.id !== policy.id),
                            );
                            setOpenId(null);
                          }}
                        >
                          Remove policy
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          <Button
            type="button"
            variant="outline"
            className="mt-3"
            onClick={() => {
              const id = nextId("claim");
              setPolicies((current) => [
                ...current,
                {
                  id,
                  pattern: "",
                  severity: "warning",
                  message: "",
                  enabled: true,
                },
              ]);
              setOpenId(id);
              setTab("policies");
            }}
          >
            Add claim policy
          </Button>
        </TabsContent>
      </Tabs>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={pending} onClick={() => void onSave()}>
            {pending ? "Saving…" : "Save draft"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pending || !draftVersion}
            onClick={() => void onPublish()}
          >
            Publish draft
          </Button>
        </div>
        {message ? (
          <p role="status" className="text-sm">
            {message}
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
