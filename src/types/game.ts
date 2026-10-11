export type Player = { name: string; nim: string; className: string };
// Null menandakan mesin permainan belum memasok data, bukan skor contoh.
export type HudSnapshot = {
  hearts: number | null;
  room: number;
  score: number | null;
  elapsedSeconds: number | null;
  completedStages: number;
  totalStages: number;
};
export type MissionOutcome = {
  kind: "success" | "failure";
  title: string;
  message: string;
};
export type StageTopic = "PUSH" | "POP" | "PEEK" | "LIFO" | "KAPASITAS";
export type Stage = {
  id: number;
  title: string;
  topic: StageTopic;
  description: string;
};
export type GameResult = {
  version: 1;
  player: Player;
  score: number;
  completedStages: number;
  completedAt: string;
};
