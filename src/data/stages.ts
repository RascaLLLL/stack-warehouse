import type { Stage } from "../types/game";
export type WarehouseRoom = Stage & {
  accent: string;
  motif:
    | "dock"
    | "racks"
    | "truck"
    | "sort"
    | "belt"
    | "inventory"
    | "links"
    | "array"
    | "tools"
    | "master";
};
export const stages: WarehouseRoom[] = [
  {
    id: 1,
    title: "Receiving Dock",
    topic: "LIFO",
    description:
      "Pelajari dasar stack dan tentukan TOP pada kiriman yang baru tiba.",
    accent: "#eab45a",
    motif: "dock",
  },
  {
    id: 2,
    title: "Storage Bay",
    topic: "PUSH",
    description: "Masukkan dan keluarkan peti melalui satu ujung stack.",
    accent: "#91be91",
    motif: "racks",
  },
  {
    id: 3,
    title: "Loading Station",
    topic: "PEEK",
    description: "Siapkan gudang kosong dengan createStack dan isEmpty.",
    accent: "#e89867",
    motif: "truck",
  },
  {
    id: 4,
    title: "Sorting Area",
    topic: "PUSH",
    description: "Gunakan representasi array dan konvensi TOP Modul 7.",
    accent: "#9cb8e8",
    motif: "sort",
  },
  {
    id: 5,
    title: "Conveyor Control",
    topic: "POP",
    description: "Telusuri perpindahan TOP dan hubungan next antar node.",
    accent: "#69c7c1",
    motif: "belt",
  },
  {
    id: 6,
    title: "Inventory Room",
    topic: "LIFO",
    description: "Catat isi stack setelah setiap operasi.",
    accent: "#d7bc87",
    motif: "inventory",
  },
  {
    id: 7,
    title: "Linked Storage",
    topic: "KAPASITAS",
    description: "Kenali operasi tidak valid: overflow dan underflow.",
    accent: "#ad9ada",
    motif: "links",
  },
  {
    id: 8,
    title: "Array Storage",
    topic: "PUSH",
    description: "Susun operasi dengan tepat untuk mencapai target stack.",
    accent: "#8db6d3",
    motif: "array",
  },
  {
    id: 9,
    title: "Maintenance Zone",
    topic: "POP",
    description: "Perbaiki siklus hidup stack, alokasi, dan dealokasi node.",
    accent: "#e59191",
    motif: "tools",
  },
  {
    id: 10,
    title: "Master Warehouse",
    topic: "LIFO",
    description: "Gabungkan tracing, TOP array, dan pemeriksaan batas.",
    accent: "#efcf68",
    motif: "master",
  },
];
