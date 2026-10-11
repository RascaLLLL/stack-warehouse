"use client";
import { create } from "zustand";
import type { EffectBatch } from "@/lib/effects/events";
// Transient presentation data is intentionally neither persisted nor part of the reducer.
export const useEffectsStore = create<{
  batch: EffectBatch | null;
  entry: string | null;
  publish: (batch: EffectBatch) => void;
  clear: () => void;
}>((set) => ({
  batch: null,
  entry: null,
  publish: (batch) =>
    set((s) => ({
      batch: batch.record ? batch : s.batch,
      entry: batch.roomEntry ? batch.key : s.entry,
    })),
  clear: () => set({ batch: null, entry: null }),
}));
