"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { OperationRecord } from "@/lib/game/engine";
import { CAPACITY } from "@/lib/game/engine";
import { linkedStack } from "@/lib/game/stack";
export function AnimatedStack({
  stack,
  mode,
  event,
}: {
  stack: string[];
  mode: "array" | "linked";
  event: OperationRecord | null;
}) {
  const reduced = useReducedMotion();
  const [frame, setFrame] = useState({
    stack: event && !reduced && event.trace.length ? event.before : stack,
    step: 0,
  });
  useEffect(() => {
    if (!event || !event.trace.length || reduced) return;
    const timers = event.trace.map((step, i) =>
      setTimeout(
        () => setFrame({ stack: step.after, step: i + 1 }),
        100 + i * 280,
      ),
    );
    return () => timers.forEach(clearTimeout);
  }, [event, reduced]);
  const shown = reduced || !event?.trace.length ? stack : frame.stack;
  const linked = linkedStack(shown);
  const replaying =
    !!event?.trace.length && !reduced && frame.step < event.trace.length;
  const transition = { duration: reduced ? 0 : 0.22, ease: "easeOut" as const };
  const crate = (value: string, index: number) => (
    <motion.span
      className="game-crate"
      key={`${index}:${value}`}
      initial={event && !reduced ? { y: -22, opacity: 0 } : false}
      animate={{ y: 0, x: 0, opacity: 1 }}
      exit={{ x: 48, y: -14, opacity: 0 }}
      transition={transition}
    >
      <span>{value}</span>
      <i aria-hidden="true" />
    </motion.span>
  );
  return (
    <div
      className="animated-stack"
      aria-label={`Stack ${shown.join(", ") || "kosong"}; TOP ${shown.length}`}
    >
      <div className="stack-readout">
        <strong>
          {mode === "array"
            ? `TOP = ${shown.length}`
            : `TOP → ${linked.TOP ?? "null"}`}
        </strong>
        <span>
          {replaying
            ? `REPLAY ${frame.step}/${event!.trace.length}`
            : "STACK AKTUAL"}
        </span>
      </div>
      {mode === "array" ? (
        <div className="stack-slots">
          <motion.div
            className="moving-top"
            initial={false}
            animate={{ y: (CAPACITY - shown.length) * 78 }}
            transition={transition}
            aria-hidden="true"
          >
            ← TOP{shown.length === 0 ? " = 0" : ""}
          </motion.div>
          {Array.from({ length: CAPACITY }, (_, i) => CAPACITY - i).map((i) => (
            <div
              className={`animated-slot ${i === shown.length ? "slot-top" : ""}`}
              key={i}
            >
              <span>[{i}]</span>
              <div className="crate-mount">
                <AnimatePresence initial={false}>
                  {shown[i - 1] !== undefined ? crate(shown[i - 1], i) : null}
                </AnimatePresence>
              </div>
              <span className="empty-slot">
                {shown[i - 1] === undefined ? "—" : ""}
              </span>
            </div>
          ))}
          <div className="stack-empty-anchor">
            {shown.length === 0 ? "GUDANG KOSONG" : ""}
          </div>
        </div>
      ) : (
        <div className="pointer-slots">
          <AnimatePresence initial={false}>
            {[...linked.nodes].reverse().map((node, i) => (
              <motion.div
                className={`animated-node ${i === 0 ? "slot-top" : ""}`}
                key={`${node.id}:${node.value}`}
                initial={event && !reduced ? { x: -20, opacity: 0 } : false}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 48, opacity: 0 }}
                transition={transition}
              >
                <span>
                  {i === 0 ? "TOP → " : ""}
                  {node.id}
                </span>
                {crate(node.value, Number(node.id.slice(5)))}
                <span className="next-link">next → {node.next ?? "null"}</span>
              </motion.div>
            ))}
          </AnimatePresence>
          {!shown.length && <p className="empty-pointer">TOP → null</p>}
        </div>
      )}
      <p className="stack-convention">
        {mode === "array"
          ? "TOP kosong = 0 · PUSH: TOP++ lalu S[TOP] ← peti."
          : "PUSH: new.next ← TOP; TOP ← new · POP: TOP ← TOP.next."}
      </p>
    </div>
  );
}
