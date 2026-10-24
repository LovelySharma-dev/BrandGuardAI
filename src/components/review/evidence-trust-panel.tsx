"use client";

import { useState, type KeyboardEvent } from "react";

import type { ContentReview, RetrievalSnapshot } from "@/domain/schemas";
import {
  buildTrustGraph,
  chainForFinding,
  edgesTouching,
  trustLines,
  type TrustEdge,
  type TrustNode,
} from "@/engine/trust-graph";
import { cn } from "@/lib/utils";

const PREFERRED_KIND: TrustNode["kind"][] = [
  "evidence",
  "policy",
  "gap",
  "finding",
  "claim",
];

export function EvidenceTrustPanel({
  review,
  snapshot,
}: {
  review: ContentReview;
  snapshot: RetrievalSnapshot | null;
}) {
  const graph = buildTrustGraph(review, snapshot);
  const [findingId, setFindingId] = useState(review.findings[0]?.id ?? "");
  const [nodeOverride, setNodeOverride] = useState<string | null>(null);
  const activeFindingId = review.findings.some((finding) => finding.id === findingId)
    ? findingId
    : (review.findings[0]?.id ?? "");
  const chain = chainForFinding(graph, activeFindingId);
  const decision = graph.nodes.find((node) => node.kind === "decision") ?? null;
  const focusIds = [...chain.map((node) => node.id), ...(decision ? [decision.id] : [])];
  const selectedId = focusIds.includes(nodeOverride ?? "")
    ? nodeOverride
    : (preferredNodeId(chain) ?? decision?.id ?? null);
  const selected = graph.nodes.find((node) => node.id === selectedId) ?? null;
  const connected = new Set<string>();
  if (selected) {
    connected.add(selected.id);
    for (const edge of edgesTouching(graph, selected.id)) {
      connected.add(edge.id);
      connected.add(edge.from);
      connected.add(edge.to);
    }
  }
  const lines = trustLines(graph, activeFindingId || undefined);
  const findingNode = chain.find((node) => node.kind === "finding");

  function onDiagramKey(event: KeyboardEvent<HTMLElement>) {
    const target = event.target;
    if (!(target instanceof HTMLElement) || target.id.startsWith("trust-finding-")) return;
    if (focusIds.length === 0) return;
    const focusedId = target.id.startsWith("trust-node-")
      ? target.id.slice("trust-node-".length)
      : null;
    const origin =
      focusedId && focusIds.includes(focusedId) ? focusedId : (selected?.id ?? focusIds[0]!);
    const current = Math.max(0, focusIds.indexOf(origin));
    let next = current;
    if (event.key === "ArrowDown") next = (current + 1) % focusIds.length;
    else if (event.key === "ArrowUp") next = (current - 1 + focusIds.length) % focusIds.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = focusIds.length - 1;
    else return;
    event.preventDefault();
    const id = focusIds[next]!;
    setNodeOverride(id);
    document.getElementById(`trust-node-${id}`)?.focus();
  }

  function onFindingKey(event: KeyboardEvent<HTMLDivElement>) {
    if (review.findings.length === 0) return;
    const ids = review.findings.map((finding) => finding.id);
    const current = Math.max(0, ids.indexOf(activeFindingId));
    let next = current;
    if (event.key === "ArrowDown") next = (current + 1) % ids.length;
    else if (event.key === "ArrowUp") next = (current - 1 + ids.length) % ids.length;
    else return;
    event.preventDefault();
    event.stopPropagation();
    chooseFinding(ids[next]!);
  }

  function chooseFinding(id: string) {
    setFindingId(id);
    setNodeOverride(null);
    document.getElementById(`trust-finding-${id}`)?.focus();
  }

  return (
    <section
      id="evidence-trust"
      className="min-w-0 overflow-x-hidden rounded-xl border border-border bg-card"
      aria-labelledby="trust-graph-heading"
      onKeyDown={onDiagramKey}
    >
      <div className="border-b border-border px-4 py-3 sm:px-5">
        <h2 id="trust-graph-heading" className="text-sm font-semibold">
          Evidence trust
        </h2>
        <p className="mt-1 max-w-prose text-sm text-muted-foreground">
          Each relationship is read from this review and the snapshot pinned to it.
          A source appears only when that snapshot stored the excerpt at this kit
          version. A missing source stays a gap. A person decides separately.
        </p>
      </div>

      {review.findings.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground sm:px-5">
          This review has no findings to connect.
        </p>
      ) : (
        <div className="flex min-w-0 flex-col gap-4 px-4 py-4 sm:px-5">
          <div
            role="radiogroup"
            aria-label="Findings in this review"
            className="flex min-w-0 flex-col gap-2"
            onKeyDown={onFindingKey}
          >
            {review.findings.map((finding) => {
              const selectedFinding = finding.id === activeFindingId;
              return (
                <button
                  key={finding.id}
                  id={`trust-finding-${finding.id}`}
                  type="button"
                  role="radio"
                  aria-checked={selectedFinding}
                  tabIndex={selectedFinding ? 0 : -1}
                  className={cn(
                    "min-h-11 min-w-0 rounded-md border px-3 py-2 text-left text-sm break-words focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none",
                    selectedFinding ? "border-brand bg-brand/5" : "border-border bg-background",
                  )}
                  onClick={() => chooseFinding(finding.id)}
                >
                  <span className="font-medium">{finding.summary}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground capitalize">
                    {finding.status.replaceAll("_", " ")}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="grid min-w-0 gap-4 lg:grid-cols-2">
            <div role="group" aria-label="Relationship diagram" className="min-w-0">
              <ol className="flex min-w-0 flex-col gap-2">
                {chain.map((node) => (
                  <li key={node.id} className="min-w-0">
                    <NodeButton
                      node={node}
                      pressed={selected?.id === node.id}
                      linked={connected.has(node.id)}
                      onSelect={() => setNodeOverride(node.id)}
                    />
                    <EdgeList
                      edges={graph.edges.filter(
                        (edge) => edge.from === node.id && edge.findingId === activeFindingId,
                      )}
                      connected={connected}
                    />
                  </li>
                ))}
              </ol>
            </div>
            <div
              id="trust-detail"
              aria-live="polite"
              className="min-w-0 rounded-md border border-border bg-background p-3"
            >
              {selected ? (
                <NodeDetail
                  node={selected}
                  edges={edgesTouching(graph, selected.id)}
                  findingRationale={
                    findingNode?.kind === "finding" ? findingNode.rationale : undefined
                  }
                />
              ) : (
                <p className="text-sm text-muted-foreground">Select a relationship.</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-border px-4 py-3 sm:px-5">
        <h3 className="text-sm font-medium">Human decision</h3>
        {decision && decision.kind === "decision" ? (
          <div className="mt-2">
            <NodeButton
              node={decision}
              pressed={selected?.id === decision.id}
              linked={connected.has(decision.id)}
              onSelect={() => setNodeOverride(decision.id)}
            />
            <p className="mt-2 max-w-prose text-sm text-muted-foreground">
              {decision.action.replaceAll("_", " ")} by {decision.actorId} at {decision.at}.
              {decision.reason ? ` ${decision.reason}` : ""} This is not an automated finding.
            </p>
          </div>
        ) : (
          <p className="mt-1 max-w-prose text-sm text-muted-foreground">
            No human decision has been recorded. Automated findings do not approve the draft.
          </p>
        )}
      </div>

      <div className="border-t border-border px-4 py-3 sm:px-5">
        <h3 className="text-sm font-medium">Text version</h3>
        <ol className="mt-2 flex max-w-prose flex-col gap-2" aria-label="Text version of these relationships">
          {lines.map((line, index) => (
            <li
              key={`${index}-${line}`}
              className="text-sm leading-relaxed break-words text-foreground/90"
            >
              {line}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function preferredNodeId(chain: TrustNode[]): string | null {
  for (const kind of PREFERRED_KIND) {
    const node = chain.find((item) => item.kind === kind);
    if (node) return node.id;
  }
  return null;
}

function EdgeList({
  edges,
  connected,
}: {
  edges: TrustEdge[];
  connected: Set<string>;
}) {
  if (edges.length === 0) return null;
  return (
    <ul className="mt-2 mb-1 flex min-w-0 flex-col gap-2 border-l border-border pl-3">
      {edges.map((edge) => (
        <li
          key={edge.id}
          data-connected={connected.has(edge.id) ? "true" : "false"}
          className={cn(
            "min-w-0 text-sm leading-relaxed break-words",
            connected.has(edge.id) ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {edge.label}
        </li>
      ))}
    </ul>
  );
}

function NodeButton({
  node,
  pressed,
  linked,
  onSelect,
}: {
  node: TrustNode;
  pressed: boolean;
  linked: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      id={`trust-node-${node.id}`}
      type="button"
      aria-pressed={pressed}
      aria-controls="trust-detail"
      tabIndex={0}
      className={cn(
        "min-h-11 w-full min-w-0 rounded-md border px-3 py-2 text-left text-sm break-words focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none",
        pressed ? "border-brand bg-brand/5" : linked ? "border-foreground/40" : "border-border",
      )}
      onClick={onSelect}
    >
      <NodeSummary node={node} selected={pressed} />
    </button>
  );
}

function NodeSummary({ node, selected }: { node: TrustNode; selected: boolean }) {
  const mark = selected ? <span className="mt-0.5 block text-xs">Selected</span> : null;
  switch (node.kind) {
    case "claim":
      return (
        <span>
          Claim: {node.text}
          {mark}
        </span>
      );
    case "evidence":
      return (
        <span>
          Evidence: {node.title}, published kit v{node.kitVersion}
          {mark}
        </span>
      );
    case "policy":
      return (
        <span>
          Policy: {node.title}
          {node.kitVersion ? `, published kit v${node.kitVersion}` : ""}
          {mark}
        </span>
      );
    case "finding":
      return (
        <span>
          Automated finding: {node.status.replaceAll("_", " ")}
          {mark}
        </span>
      );
    case "gap":
      return (
        <span>
          Evidence gap
          {mark}
        </span>
      );
    case "decision":
      return (
        <span>
          Human decision: {node.action.replaceAll("_", " ")}
          {mark}
        </span>
      );
  }
}

function NodeDetail({
  node,
  edges,
  findingRationale,
}: {
  node: TrustNode;
  edges: TrustEdge[];
  findingRationale?: string;
}) {
  return (
    <div className="min-w-0">
      <NodeBody node={node} findingRationale={findingRationale} />
      {edges.length > 0 ? (
        <div className="mt-3 border-t border-border pt-3">
          <p className="text-xs font-medium text-muted-foreground">Connected relationships</p>
          <ul className="mt-1 flex flex-col gap-2">
            {edges.map((edge) => (
              <li key={edge.id} className="text-sm leading-relaxed break-words">
                <p>{edge.label}</p>
                {edge.detail ? <p className="mt-1 text-muted-foreground">{edge.detail}</p> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function NodeBody({
  node,
  findingRationale,
}: {
  node: TrustNode;
  findingRationale?: string;
}) {
  switch (node.kind) {
    case "claim":
      return (
        <>
          <p className="text-sm font-medium">Draft claim</p>
          <p className="mt-2 font-serif text-sm leading-relaxed break-words">“{node.text}”</p>
        </>
      );
    case "evidence":
      return (
        <>
          <p className="text-sm font-medium break-words">{node.title}</p>
          <p className="mt-1 text-xs break-all text-muted-foreground">
            Published kit v{node.kitVersion} · {node.sourceType} · {node.sourceId}
          </p>
          <p className="mt-2 font-serif text-sm leading-relaxed break-words">{node.excerpt}</p>
        </>
      );
    case "policy":
      return (
        <>
          <p className="text-sm font-medium break-words">{node.title}</p>
          <p className="mt-1 text-xs break-all text-muted-foreground">
            {node.ruleId ? `Rule ${node.ruleId}` : "Rule id was not stored"}
            {node.kitVersion ? ` · published kit v${node.kitVersion}` : ""}
          </p>
          <p className="mt-2 text-sm leading-relaxed break-words">{node.detail}</p>
        </>
      );
    case "finding":
      return (
        <>
          <p className="text-sm font-medium capitalize">{node.status.replaceAll("_", " ")}</p>
          <p className="mt-2 text-sm leading-relaxed break-words">{node.summary}</p>
          <p className="mt-2 text-sm leading-relaxed break-words">{node.rationale}</p>
        </>
      );
    case "gap":
      return (
        <>
          <p className="text-sm font-medium">Evidence gap</p>
          <p className="mt-2 text-sm leading-relaxed break-words">{node.reason}</p>
          {findingRationale ? (
            <p className="mt-2 text-sm leading-relaxed break-words text-muted-foreground">
              Recorded explanation: {findingRationale}
            </p>
          ) : null}
        </>
      );
    case "decision":
      return (
        <>
          <p className="text-sm font-medium capitalize">{node.action.replaceAll("_", " ")}</p>
          <p className="mt-2 text-sm leading-relaxed break-words">
            Recorded by {node.actorId} at {node.at}. This is not an automated finding.
          </p>
          {node.reason ? <p className="mt-2 text-sm leading-relaxed break-words">{node.reason}</p> : null}
        </>
      );
  }
}
