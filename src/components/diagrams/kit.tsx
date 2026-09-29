"use client";

/**
 * A tiny diagram kit: nodes, edges that route themselves, packets that travel
 * along edges, and a step player. Pure SVG, no dependencies. Each diagram
 * supplies a wide and a tall layout; the tall one is used on narrow screens so
 * text stays readable instead of shrinking.
 */

import { useEffect, useId, useLayoutEffect, useState, useSyncExternalStore } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export type Tone = "default" | "accent" | "muted";

export interface DNode {
  id: string;
  title: string;
  sub?: string[]; // short lines; SVG text doesn't wrap
  tone?: Tone;
}

export interface Placement {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Layout {
  width: number;
  height: number;
  place: Record<string, Placement>;
  /** Per-edge curvature for this layout (positive bends to the left of travel). */
  bend?: Record<string, number>;
  /** Per-edge waypoints, for routing a line around boxes instead of through them. */
  route?: Record<string, { x: number; y: number }[]>;
}

export interface DEdge {
  id: string;
  a: string;
  b: string;
  label?: string;
  dashed?: boolean;
}

export interface Step {
  /** Edge to animate, and which end the packet starts from. */
  edge?: string;
  from?: string;
  /** Nodes to highlight during this step. */
  nodes?: string[];
  /** Nodes where the request is stopped (shown in red). */
  stop?: string[];
  /** Marks a successful final step. */
  ok?: boolean;
  title: string;
  detail?: string;
}

export interface Flow {
  id: string;
  name: string;
  steps: Step[];
}

// ── geometry ────────────────────────────────────────────────────────────────

type Pt = { x: number; y: number };

function anchor(p: Placement, toward: Pt): Pt {
  const cx = p.x + p.w / 2;
  const cy = p.y + p.h / 2;
  const dx = toward.x - cx;
  const dy = toward.y - cy;
  // Leave from the side that faces the other node (normalised by box shape).
  if (Math.abs(dx) / p.w > Math.abs(dy) / p.h) return { x: dx > 0 ? p.x + p.w : p.x, y: cy };
  return { x: cx, y: dy > 0 ? p.y + p.h : p.y };
}

/** Polyline through waypoints with rounded corners (radius r). */
function routedPath(pa: Placement, pb: Placement, via: Pt[], r = 12): string {
  const pts = [anchor(pa, via[0]), ...via, anchor(pb, via[via.length - 1])];
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [p0, p1, p2] = [pts[i - 1], pts[i], pts[i + 1]];
    const l1 = Math.hypot(p1.x - p0.x, p1.y - p0.y) || 1;
    const l2 = Math.hypot(p2.x - p1.x, p2.y - p1.y) || 1;
    const k1 = Math.min(r, l1 / 2) / l1;
    const k2 = Math.min(r, l2 / 2) / l2;
    d += ` L ${p1.x - (p1.x - p0.x) * k1} ${p1.y - (p1.y - p0.y) * k1}`;
    d += ` Q ${p1.x} ${p1.y} ${p1.x + (p2.x - p1.x) * k2} ${p1.y + (p2.y - p1.y) * k2}`;
  }
  const last = pts[pts.length - 1];
  return `${d} L ${last.x} ${last.y}`;
}

function edgePath(pa: Placement, pb: Placement, bend = 0): string {
  const ca = { x: pa.x + pa.w / 2, y: pa.y + pa.h / 2 };
  const cb = { x: pb.x + pb.w / 2, y: pb.y + pb.h / 2 };
  const s = anchor(pa, cb);
  const e = anchor(pb, ca);
  if (!bend) return `M ${s.x} ${s.y} L ${e.x} ${e.y}`;
  const mx = (s.x + e.x) / 2;
  const my = (s.y + e.y) / 2;
  const len = Math.hypot(e.x - s.x, e.y - s.y) || 1;
  const nx = -(e.y - s.y) / len;
  const ny = (e.x - s.x) / len;
  return `M ${s.x} ${s.y} Q ${mx + nx * bend} ${my + ny * bend} ${e.x} ${e.y}`;
}

// ── hooks ───────────────────────────────────────────────────────────────────

function subscribeMotion(cb: () => void) {
  const m = window.matchMedia("(prefers-reduced-motion: reduce)");
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribeMotion, () => window.matchMedia("(prefers-reduced-motion: reduce)").matches, () => false);
}

/** Picks the wide or tall layout from the container's actual width. Returns a callback ref. */
export function useContainerWidth<T extends HTMLElement>() {
  const [el, setEl] = useState<T | null>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  return { attach: setEl, width };
}

// ── rendering ───────────────────────────────────────────────────────────────

const NODE_STYLE: Record<Tone, { box: string; title: string; sub: string }> = {
  default: { box: "fill-zinc-900 stroke-zinc-700", title: "fill-zinc-100", sub: "fill-zinc-500" },
  accent: { box: "fill-emerald-950 stroke-emerald-800", title: "fill-zinc-100", sub: "fill-emerald-300/70" },
  muted: { box: "fill-zinc-950 stroke-zinc-800", title: "fill-zinc-400", sub: "fill-zinc-600" },
};

/** Starts an SVG animation when it mounts. begin="indefinite" + beginElement() makes a freshly
 * inserted animation start now, rather than at document time 0 (which would already be over). */
function startOnMount(el: SVGAnimateMotionElement | null) {
  if (el) requestAnimationFrame(() => el.beginElement());
}

function Packet({ path, reverse, duration }: { path: string; reverse: boolean; duration: number }) {
  const motion = { begin: "indefinite", dur: `${duration}ms`, fill: "freeze" as const, path,
    keyPoints: reverse ? "1;0" : "0;1", keyTimes: "0;1", calcMode: "linear" as const };
  return (
    <g>
      <circle r="9" className="fill-emerald-400/20"><animateMotion ref={startOnMount} {...motion} /></circle>
      <circle r="4.5" className="fill-emerald-400"><animateMotion ref={startOnMount} {...motion} /></circle>
    </g>
  );
}

export function DiagramCanvas({
  nodes, edges, layout, activeEdge, activeNodes = [], stopNodes = [], packet, title, description,
}: {
  nodes: DNode[];
  edges: DEdge[];
  layout: Layout;
  activeEdge?: string;
  activeNodes?: string[];
  stopNodes?: string[];
  packet?: { edge: string; reverse: boolean; runKey: string; duration: number } | null;
  title: string;
  description: string;
}) {
  const id = useId();
  const paths = Object.fromEntries(edges.map((e) => {
    const via = layout.route?.[e.id];
    return [e.id, via?.length
      ? routedPath(layout.place[e.a], layout.place[e.b], via)
      : edgePath(layout.place[e.a], layout.place[e.b], layout.bend?.[e.id] ?? 0)];
  }));
  return (
    <svg viewBox={`0 0 ${layout.width} ${layout.height}`} className="w-full h-auto" role="img" aria-labelledby={`${id}-t ${id}-d`}>
      <title id={`${id}-t`}>{title}</title>
      <desc id={`${id}-d`}>{description}</desc>

      {edges.map((e) => {
        const active = e.id === activeEdge;
        return (
          <g key={e.id}>
            <path d={paths[e.id]} fill="none" strokeWidth={active ? 2 : 1.25}
              strokeDasharray={e.dashed ? "5 5" : undefined}
              className={cn("transition-[stroke] duration-300", active ? "stroke-emerald-500" : "stroke-zinc-700")} />
          </g>
        );
      })}

      {nodes.map((n) => {
        const p = layout.place[n.id];
        const s = NODE_STYLE[n.tone ?? "default"];
        const stopped = stopNodes.includes(n.id);
        const active = !stopped && activeNodes.includes(n.id);
        const lines = n.sub ?? [];
        const titleY = p.y + p.h / 2 - (lines.length * 16) / 2 + 5;
        return (
          <g key={n.id}>
            <rect x={p.x} y={p.y} width={p.w} height={p.h} rx="10" strokeWidth={active ? 1.75 : 1}
              className={cn(s.box, "transition-[stroke,fill] duration-300", active && "stroke-emerald-400", stopped && "stroke-red-400 fill-red-950")} />
            <text x={p.x + p.w / 2} y={titleY} textAnchor="middle" className={cn(s.title, "text-[15px] font-medium")}>{n.title}</text>
            {lines.map((l, i) => (
              <text key={l} x={p.x + p.w / 2} y={titleY + 19 + i * 16} textAnchor="middle" className={cn(s.sub, "text-[12.5px]")}>{l}</text>
            ))}
          </g>
        );
      })}

      {packet && paths[packet.edge] && (
        <Packet key={packet.runKey} path={paths[packet.edge]} reverse={packet.reverse} duration={packet.duration} />
      )}
    </svg>
  );
}

// ── player ──────────────────────────────────────────────────────────────────

const STEP_MS = 2600;
const PACKET_MS = 1100;

/**
 * Step player shared by every animated diagram: auto-plays the first time it
 * scrolls into view (never for reduced motion), pauses off screen, and can be
 * stepped by hand.
 */
export function usePlayer(count: number, reset: string) {
  const [el, setEl] = useState<HTMLElement | null>(null);
  const reduced = useReducedMotion();
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [visible, setVisible] = useState(false);
  const [started, setStarted] = useState(false);
  const [run, setRun] = useState(0);
  const [lastReset, setLastReset] = useState(reset);

  // A new flow or scenario starts from the top (state adjusted during render, not in an effect).
  if (reset !== lastReset) {
    setLastReset(reset);
    setI(0);
    setRun((r) => r + 1);
    if (started && !reduced) setPlaying(true);
  }
  // First time on screen: start playing, unless the visitor prefers reduced motion.
  if (visible && !started && !reduced) {
    setStarted(true);
    setPlaying(true);
  }

  useEffect(() => {
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, [el]);

  useEffect(() => {
    if (!playing || !visible) return;
    const t = setTimeout(() => {
      if (i < count - 1) {
        setI(i + 1);
        setRun((r) => r + 1);
      } else {
        setPlaying(false);
      }
    }, STEP_MS);
    return () => clearTimeout(t);
  }, [playing, visible, i, count]);

  const go = (n: number) => { setPlaying(false); setI(Math.max(0, Math.min(count - 1, n))); setRun((r) => r + 1); };
  const toggle = () => {
    if (!playing && i === count - 1) { setI(0); setRun((r) => r + 1); }
    setPlaying((p) => !p);
  };
  return { attach: setEl, i, run, playing, reduced, go, toggle, last: i === count - 1 };
}

export function PlayerCaption({ player, count, title, detail, tone }: {
  player: Omit<ReturnType<typeof usePlayer>, "attach">;
  count: number;
  title: string;
  detail?: string;
  tone?: "stop" | "ok";
}) {
  const { i, playing, last, go, toggle } = player;
  return (
    <figcaption className="border-t border-zinc-800 px-4 py-3 sm:px-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
      <div className="min-w-0 flex-1" aria-live="polite">
        <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Step {i + 1} of {count}</p>
        <p className={cn("mt-1 text-sm font-medium", tone === "stop" ? "text-red-300" : tone === "ok" ? "text-emerald-300" : "text-zinc-100")}>{title}</p>
        {detail && <p className="mt-0.5 text-sm text-zinc-400">{detail}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <IconButton label="Previous step" onClick={() => go(i - 1)} disabled={i === 0}><ChevronLeft size={15} /></IconButton>
        <IconButton label={playing ? "Pause" : last ? "Replay" : "Play"} onClick={toggle}>
          {playing ? <Pause size={14} /> : last ? <RotateCcw size={14} /> : <Play size={14} />}
        </IconButton>
        <IconButton label="Next step" onClick={() => go(i + 1)} disabled={last}><ChevronRight size={15} /></IconButton>
      </div>
    </figcaption>
  );
}

export function Tabs<T extends string>({ items, value, onChange, label }: { items: { id: T; name: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-zinc-800 px-3 py-2.5" role="tablist" aria-label={label}>
      {items.map((f) => (
        <button key={f.id} role="tab" aria-selected={f.id === value} onClick={() => onChange(f.id)}
          className={cn("rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
            f.id === value ? "bg-zinc-100 text-zinc-900" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900")}>
          {f.name}
        </button>
      ))}
    </div>
  );
}

export function Legend({ items }: { items: { label: string; dashed?: boolean }[] }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-zinc-500" aria-hidden="true">
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-2">
          <svg width="22" height="2"><line x1="0" y1="1" x2="22" y2="1" className="stroke-zinc-500" strokeWidth="1.5" strokeDasharray={it.dashed ? "4 3" : undefined} /></svg>
          {it.label}
        </span>
      ))}
    </div>
  );
}

/** Interactive node-and-edge diagram: pick a flow, play it, or step through it. */
export function FlowDiagram({
  nodes, edges, wide, tall, flows, title, description, breakpoint = 480, legend, tabsLabel = "Choose a flow",
}: {
  nodes: DNode[];
  edges: DEdge[];
  wide: Layout;
  tall: Layout;
  flows: Flow[];
  title: string;
  description: string;
  breakpoint?: number;
  legend?: { label: string; dashed?: boolean }[];
  tabsLabel?: string;
}) {
  const { attach: measure, width } = useContainerWidth<HTMLDivElement>();
  const [flowId, setFlowId] = useState(flows[0].id);
  const flow = flows.find((f) => f.id === flowId)!;
  const { attach, ...player } = usePlayer(flow.steps.length, flowId);
  const step = flow.steps[player.i];
  const layout = width && width < breakpoint ? tall : wide;
  const edge = edges.find((e) => e.id === step.edge);

  return (
    <figure ref={attach} className="-mx-6 overflow-hidden border-y border-zinc-800 bg-zinc-950 sm:mx-0 sm:rounded-xl sm:border">
      {flows.length > 1 && <Tabs items={flows} value={flowId} onChange={setFlowId} label={tabsLabel} />}
      <div ref={measure} className="px-2 pt-4 pb-3 sm:px-5">
        <DiagramCanvas
          nodes={nodes}
          edges={edges}
          layout={layout}
          activeEdge={step.edge}
          activeNodes={step.nodes ?? (edge ? [edge.a, edge.b] : [])}
          stopNodes={step.stop}
          packet={edge && !player.reduced ? {
            edge: edge.id,
            reverse: step.from === edge.b,
            runKey: `${flowId}-${player.i}-${player.run}-${layout.width}`,
            duration: PACKET_MS,
          } : null}
          title={title}
          description={description}
        />
        {legend && <Legend items={legend} />}
      </div>
      <PlayerCaption player={player} count={flow.steps.length} title={step.title} detail={step.detail}
        tone={step.stop?.length ? "stop" : step.ok ? "ok" : undefined} />
    </figure>
  );
}

function IconButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled}
      className="h-8 w-8 flex items-center justify-center rounded-md border border-zinc-800 text-zinc-300 hover:bg-zinc-900 disabled:opacity-30 disabled:hover:bg-transparent">
      {children}
    </button>
  );
}
