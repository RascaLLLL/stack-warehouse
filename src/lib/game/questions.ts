import { questionBank } from "../../data/questions";
import { queueQuestions } from "../../data/queue-questions";
import type { Question } from "../../types/question";
export const BANK_VERSION = 3;
export const TOTAL_STAGES = 20;
export const SELECTION_POOLS = [
  "fundamentals",
  "operations",
  "initialization",
  "array",
  "pointer",
  "tracing",
  "safety",
  "sequence",
  "lifecycle",
  "master",
] as const;
export function selectQuestions(seed: number): Question[] {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), state | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return (mixed ^ (mixed >>> 14)) >>> 0;
  };
  const stack = SELECTION_POOLS.map((pool) => {
    const candidates = questionBank.filter((q) => q.selectionPool === pool);
    const selected = candidates[next() % candidates.length];
    const q: Question = JSON.parse(JSON.stringify(selected));
    for (let i = q.availableActions.length - 1; i > 0; i--) {
      const j = next() % (i + 1);
      [q.availableActions[i], q.availableActions[j]] = [
        q.availableActions[j],
        q.availableActions[i],
      ];
    }
    return q;
  });
  const queue = (["easy", "medium", "hard"] as const).flatMap((difficulty) => {
    const candidates = queueQuestions.filter(
      (q) => q.difficulty === difficulty,
    );
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = next() % (i + 1);
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    const count = { easy: 3, medium: 4, hard: 3 }[difficulty];
    return candidates.slice(0, count).map((candidate) => {
      const q: Question = JSON.parse(JSON.stringify(candidate));
      for (let i = q.availableActions.length - 1; i > 0; i--) {
        const j = next() % (i + 1);
        [q.availableActions[i], q.availableActions[j]] = [
          q.availableActions[j],
          q.availableActions[i],
        ];
      }
      return q;
    });
  });
  return [...stack, ...queue];
}
