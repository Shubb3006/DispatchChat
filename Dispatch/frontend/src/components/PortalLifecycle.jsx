import { Check } from "lucide-react";
import { fmtDate } from "@/lib/portalFormat";

// ---------------------------------------------------------------------------
// The nine-stage shipment lifecycle, rendered straight from the payload the
// backend builds in portalLifecycle.service.js. The dashboard, the shipment
// detail page and the public tracking page all render this one component so a
// customer sees the same stage vocabulary wherever they look.
//
// Nothing here infers a date. A stage the freight has clearly passed but that
// carries no real timestamp is drawn as done with no date line at all — a
// guessed date on a shipment record is worse than no date.
// ---------------------------------------------------------------------------

const TOTAL_STAGES = 9;

// The nine ops stages compress to the four milestones a customer actually
// tracks; each step lights up once the load reaches the rank behind it.
const SUMMARY_STEPS = [
  { label: "Processed", minRank: 1 },
  { label: "Shipped", minRank: 3 },
  { label: "En Route", minRank: 6 },
  { label: "Arrived", minRank: 9 },
];

const STATE_WORD = {
  done: "Completed",
  current: "In progress",
  pending: "Pending",
};

// Number(null), Number("") and Number(false) are all 0, which a Math.max(1, …)
// floor would quietly promote into a confident "Stage 1 of 9" for a shipment
// whose rank the API never sent. An absent rank names no stage, so it returns
// null and the caller renders nothing.
const clampRank = (value) => {
  if (value === null || value === undefined || value === "" || typeof value === "boolean") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return null;
  return Math.min(TOTAL_STAGES, Math.round(n));
};

/** Small "Stage 6 of 9 · In Transit" pill — also used on rows outside this card. */
export function LifecycleBadge({ rank, label }) {
  const current = clampRank(rank);
  if (!current) return null;
  const arrived = current >= TOTAL_STAGES;
  return (
    <span
      // min-w-0 + max-w-full let a long stage label truncate instead of pushing
      // the pill past a 360px viewport.
      className={`inline-flex min-w-0 max-w-full items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${arrived
        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
        : "bg-sky-50 text-sky-700 ring-1 ring-sky-600/20"
        }`}
    >
      <span className="whitespace-nowrap">
        Stage {current} of {TOTAL_STAGES}
      </span>
      {label && <span className="min-w-0 truncate font-medium normal-case">· {label}</span>}
    </span>
  );
}

function StageMarker({ state, rank }) {
  if (state === "done") {
    return (
      <span
        aria-hidden="true"
        className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-emerald-500"
      >
        <Check className="h-3 w-3 text-white" strokeWidth={3} />
      </span>
    );
  }
  if (state === "current") {
    return (
      <span
        aria-hidden="true"
        className="relative flex h-5 w-5 flex-none items-center justify-center rounded-full bg-sky-600"
      >
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
        <span className="relative h-1.5 w-1.5 rounded-full bg-base-100" />
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex h-5 w-5 flex-none items-center justify-center rounded-full border-2 border-slate-200 bg-base-100 text-[10px] font-bold text-slate-400"
    >
      {rank}
    </span>
  );
}

function StageCard({ stage, rank, currentRank }) {
  // A payload that predates the lifecycle service can arrive without a state;
  // rank order still tells us where the freight sits.
  const state = STATE_WORD[stage.state]
    ? stage.state
    : rank < currentRank
      ? "done"
      : rank === currentRank
        ? "current"
        : "pending";
  const shownDate = stage.at ? fmtDate(stage.at) : null;

  return (
    <li
      aria-current={state === "current" ? "step" : undefined}
      className={`min-w-0 rounded-xl border p-3.5 transition-colors ${state === "done"
        ? "border-emerald-200 bg-emerald-50/60"
        : state === "current"
          ? "border-sky-300 bg-sky-50 shadow-sm ring-1 ring-sky-200"
          : "border-slate-200 bg-base-100"
        }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={`text-[11px] font-semibold uppercase tracking-wider ${state === "done" ? "text-emerald-700" : state === "current" ? "text-sky-700" : "text-slate-400"
            }`}
        >
          Stage {rank}
        </span>
        <StageMarker state={state} rank={rank} />
      </div>

      {stage.label && (
        <p
          className={`mt-2 break-words text-sm font-bold leading-snug ${state === "pending" ? "text-base-content" : "text-base-content"
            }`}
        >
          {stage.label}
        </p>
      )}
      {stage.description && (
        <p className="mt-0.5 break-words text-xs leading-snug text-base-content">{stage.description}</p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <span
          className={`text-[11px] font-semibold uppercase tracking-wider ${state === "done" ? "text-emerald-700" : state === "current" ? "text-sky-700" : "text-slate-400"
            }`}
        >
          {STATE_WORD[state]}
        </span>
        {/* No timestamp means the stage is known only by sequence — say nothing. */}
        {shownDate && <span className="text-[11px] font-medium text-base-content">{shownDate}</span>}
      </div>

      {stage.detail && (
        <p className="mt-1.5 break-words text-xs leading-snug text-slate-600">{stage.detail}</p>
      )}
    </li>
  );
}

export default function PortalLifecycle({ lifecycle, variant = "full", className = "" }) {
  // The backend adds `lifecycle` to the load payloads; an older cached response
  // or a failed poll simply renders nothing rather than a half-built tracker.
  if (!lifecycle) return null;

  const stages = Array.isArray(lifecycle.stages) ? lifecycle.stages : [];
  const currentRank =
    clampRank(lifecycle.current_rank) ??
    clampRank(lifecycle.current?.rank) ??
    clampRank(stages.find((stage) => stage?.state === "current")?.rank);

  if (!currentRank) return null;

  // A null percent numbers to 0, which would draw an empty bar under a "Stage 6
  // of 9" badge — the two halves of the same card contradicting each other.
  // Only a real number is trusted; otherwise the rank derives it.
  const sentPercent = lifecycle.percent;
  const percent =
    sentPercent !== null && sentPercent !== undefined && sentPercent !== "" && Number.isFinite(Number(sentPercent))
      ? Math.min(100, Math.max(0, Math.round(Number(sentPercent))))
      : Math.round(((currentRank - 1) / (TOTAL_STAGES - 1)) * 100);

  const isCompact = variant === "compact";
  const arrived = currentRank >= TOTAL_STAGES;
  const currentLabel = lifecycle.current?.label || null;

  return (
    <div className={`space-y-5 ${className}`}>
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-base-content">
            Shipment progress
          </p>
          <LifecycleBadge rank={currentRank} label={currentLabel} />
        </div>

        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-full rounded-full transition-[width] duration-500 ease-out ${arrived ? "bg-emerald-500" : "bg-sky-500"
              }`}
            style={{ width: `${percent}%` }}
          />
        </div>

        <ol className="mt-3 grid grid-cols-4 gap-1.5 sm:gap-2">
          {SUMMARY_STEPS.map((step, index) => {
            const reached = currentRank >= step.minRank;
            const next = SUMMARY_STEPS[index + 1];
            const isActiveStep = reached && (!next || currentRank < next.minRank);
            return (
              <li
                key={step.label}
                // With the grid hidden there is no card to carry it, so the
                // furthest reached summary step announces the position instead.
                aria-current={isActiveStep && isCompact ? "step" : undefined}
                className="min-w-0 text-center"
              >
                <span
                  aria-hidden="true"
                  className={`mx-auto block h-3 w-3 rounded-full border-2 ${reached
                    ? arrived
                      ? "border-emerald-500 bg-emerald-500"
                      : "border-sky-500 bg-sky-500"
                    : "border-slate-300 bg-base-100"
                    }`}
                />
                <span
                  className={`mt-1.5 block break-words text-[10px] font-semibold uppercase leading-tight tracking-wide sm:text-[11px] ${isActiveStep
                    ? arrived
                      ? "text-emerald-700"
                      : "text-sky-700"
                    : reached
                      ? "text-slate-600"
                      : "text-slate-400"
                    }`}
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {!isCompact && stages.length > 0 && (
        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {stages.map((stage, index) => {
            if (!stage) return null;
            const rank = clampRank(stage.rank) ?? index + 1;
            return (
              <StageCard
                key={stage.key || rank}
                stage={stage}
                rank={rank}
                currentRank={currentRank}
              />
            );
          })}
        </ol>
      )}
    </div>
  );
}
