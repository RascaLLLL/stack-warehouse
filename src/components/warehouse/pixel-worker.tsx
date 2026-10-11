"use client";

export function PixelWorker({
  className = "",
  pose = "idle",
  active = true,
}: {
  className?: string;
  pose?: "idle" | "working" | "celebrate" | "sad";
  active?: boolean;
}) {
  return (
    <svg
      className={`pixel-worker worker-${pose} ${active ? "" : "worker-paused"} ${className}`}
      viewBox="0 0 32 48"
      aria-hidden="true"
      shapeRendering="crispEdges"
    >
      <rect x="7" y="3" width="18" height="9" fill="#eab45a" />
      <rect x="11" y="0" width="10" height="4" fill="#ffd68a" />
      <rect x="5" y="10" width="22" height="4" fill="#f6c576" />
      <rect x="9" y="14" width="14" height="11" fill="#d8a176" />
      <rect x="9" y="14" width="4" height="4" fill="#78543b" />
      <rect x="19" y="17" width="3" height="3" fill="#182330" />
      <rect x="18" y="23" width="5" height="2" fill="#8e6447" />
      <rect x="7" y="26" width="18" height="13" fill="#ce874a" />
      <rect x="10" y="26" width="3" height="12" fill="#f4d989" />
      <rect x="20" y="26" width="3" height="12" fill="#f4d989" />
      <rect x="13" y="31" width="7" height="4" fill="#5a655b" />
      <g className="worker-arms">
        <rect x="3" y="28" width="4" height="10" fill="#bd7b43" />
        <rect x="25" y="28" width="4" height="10" fill="#bd7b43" />
        <rect x="3" y="38" width="4" height="4" fill="#d8a176" />
        <rect x="25" y="38" width="4" height="4" fill="#d8a176" />
      </g>
      <rect x="8" y="39" width="7" height="7" fill="#4d6475" />
      <rect x="18" y="39" width="7" height="7" fill="#4d6475" />
      <rect x="6" y="45" width="10" height="3" fill="#182330" />
      <rect x="18" y="45" width="11" height="3" fill="#182330" />
    </svg>
  );
}
