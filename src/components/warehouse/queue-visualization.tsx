"use client";
import { linkedQueue, QUEUE_CAPACITY, type QueueStep } from "@/lib/game/queue";

export function QueueVisualization({
  items,
  head,
  tail,
  mode,
  last,
}: {
  items: string[];
  head: number;
  tail: number;
  mode: "array" | "linked";
  last?: QueueStep | null;
}) {
  const nodes = linkedQueue({ items, head, tail });
  return (
    <div
      className="queue-visualization"
      aria-label={`Antrean ${items.join(", ") || "kosong"}`}
    >
      <div className="queue-directions">
        <span>TRUK PENGIRIMAN ← KELUAR</span>
        <span>MASUK → TAIL</span>
      </div>
      <div className="queue-lane">
        {last?.command.operation === "DEQUEUE" &&
          last.output !== "underflow" && (
            <span
              className="queue-departing"
              aria-hidden="true"
              key={`${last.output}-${last.before.head}`}
            >
              {last.output}
            </span>
          )}
        {mode === "array" ? (
          <div className="queue-cells">
            {Array.from({ length: QUEUE_CAPACITY }, (_, i) => {
              const index = i + 1,
                value = items[index - head];
              return (
                <div className="queue-cell" key={index}>
                  <small>INDEKS {index}</small>
                  <strong className={value ? "queue-package" : "queue-empty"}>
                    {value ?? "·"}
                  </strong>
                  <small>
                    {head === index ? "▲ HEAD" : ""}
                    {tail === index
                      ? `${head === index ? " / " : "▲ "}TAIL`
                      : ""}
                  </small>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="queue-nodes">
            {nodes.nodes.length ? (
              nodes.nodes.map((node, i) => (
                <div className="queue-node" key={node.id}>
                  <small>{i === 0 ? "HEAD ↓" : "\u00a0"}</small>
                  <strong className="queue-package">{node.value}</strong>
                  <small>
                    {i === nodes.nodes.length - 1 ? "TAIL ↑" : `${node.id} →`}
                  </small>
                </div>
              ))
            ) : (
              <div className="queue-empty-lane">
                Jalur kosong · HEAD = NIL · TAIL = NIL
              </div>
            )}
          </div>
        )}
      </div>
      <p className="queue-readout">
        HEAD: {mode === "array" ? head || "NIL" : (nodes.HEAD ?? "NIL")} · TAIL:{" "}
        {mode === "array" ? tail || "NIL" : (nodes.TAIL ?? "NIL")} · FIFO: [
        {items.join(", ") || "kosong"}]
      </p>
      {last && (
        <p
          className="queue-action"
          key={`${last.command.operation}-${last.after.head}-${last.after.tail}`}
        >
          {last.command.operation === "ENQUEUE"
            ? "📦 Paket meluncur ke belakang"
            : last.command.operation === "DEQUEUE"
              ? "🚚 Paket depan menuju truk"
              : "📋 Pemeriksaan jalur"}{" "}
          · {last.output}
          {last.shifted &&
            " · elemen aktif digeser karena TAIL mencapai IndexMax"}
        </p>
      )}
    </div>
  );
}
