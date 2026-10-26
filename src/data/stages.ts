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
    title: "Dermaga Penerimaan",
    topic: "LIFO",
    description:
      "Pelajari dasar stack dan tentukan TOP pada kiriman yang baru tiba.",
    accent: "#eab45a",
    motif: "dock",
  },
  {
    id: 2,
    title: "Rak Penyimpanan",
    topic: "PUSH",
    description: "Masukkan dan keluarkan peti melalui satu ujung stack.",
    accent: "#91be91",
    motif: "racks",
  },
  {
    id: 3,
    title: "Stasiun Muat",
    topic: "PEEK",
    description: "Siapkan gudang kosong dengan createStack dan isEmpty.",
    accent: "#e89867",
    motif: "truck",
  },
  {
    id: 4,
    title: "Area Sortir",
    topic: "PUSH",
    description: "Gunakan representasi array dan konvensi TOP Modul 7.",
    accent: "#9cb8e8",
    motif: "sort",
  },
  {
    id: 5,
    title: "Kontrol Konveyor",
    topic: "POP",
    description: "Telusuri perpindahan TOP dan hubungan next antar node.",
    accent: "#69c7c1",
    motif: "belt",
  },
  {
    id: 6,
    title: "Ruang Inventaris",
    topic: "LIFO",
    description: "Catat isi stack setelah setiap operasi.",
    accent: "#d7bc87",
    motif: "inventory",
  },
  {
    id: 7,
    title: "Gudang Tertaut",
    topic: "KAPASITAS",
    description: "Kenali operasi tidak valid: overflow dan underflow.",
    accent: "#ad9ada",
    motif: "links",
  },
  {
    id: 8,
    title: "Gudang Array",
    topic: "PUSH",
    description: "Susun operasi dengan tepat untuk mencapai target stack.",
    accent: "#8db6d3",
    motif: "array",
  },
  {
    id: 9,
    title: "Zona Perawatan",
    topic: "POP",
    description: "Perbaiki siklus hidup stack, alokasi, dan dealokasi node.",
    accent: "#e59191",
    motif: "tools",
  },
  {
    id: 10,
    title: "Gudang Utama",
    topic: "LIFO",
    description: "Gabungkan tracing, TOP array, dan pemeriksaan batas.",
    accent: "#efcf68",
    motif: "master",
  },
  {
    id: 11,
    title: "Gerbang Logistik",
    topic: "FIFO",
    description:
      "Buka jalur kirim dan kenali aturan pertama masuk, pertama keluar.",
    accent: "#64d4cf",
    motif: "belt",
  },
  {
    id: 12,
    title: "Konveyor Kedatangan",
    topic: "ENQUEUE",
    description: "Paket baru masuk dari ujung TAIL.",
    accent: "#69c7c1",
    motif: "belt",
  },
  {
    id: 13,
    title: "Dermaga Pengiriman",
    topic: "DEQUEUE",
    description: "Kirim paket pertama dari HEAD ke truk.",
    accent: "#e89867",
    motif: "truck",
  },
  {
    id: 14,
    title: "Jalur Antrean",
    topic: "HEAD",
    description: "Amati HEAD dan TAIL saat paket bergerak.",
    accent: "#9cb8e8",
    motif: "links",
  },
  {
    id: 15,
    title: "Mesin Sortir",
    topic: "TAIL",
    description: "Sambungkan paket baru pada node terakhir.",
    accent: "#91be91",
    motif: "sort",
  },
  {
    id: 16,
    title: "Rak Indeks Bergerak",
    topic: "QUEUE ARRAY",
    description: "Ikuti HEAD dan TAIL dalam array linear Alternatif 2.",
    accent: "#8db6d3",
    motif: "array",
  },
  {
    id: 17,
    title: "Pintu Kapasitas",
    topic: "QUEUE ARRAY",
    description: "Geser elemen aktif hanya saat TAIL mencapai IndexMax.",
    accent: "#ad9ada",
    motif: "array",
  },
  {
    id: 18,
    title: "Bengkel Pointer",
    topic: "HEAD",
    description: "Perbaiki tautan dan kosongkan kedua pointer dengan aman.",
    accent: "#e59191",
    motif: "tools",
  },
  {
    id: 19,
    title: "Truk Ekspres",
    topic: "FIFO",
    description: "Telusuri operasi kirim dan terima beruntun.",
    accent: "#d7bc87",
    motif: "truck",
  },
  {
    id: 20,
    title: "Pusat Distribusi",
    topic: "FIFO",
    description: "Tuntaskan seluruh jalur logistik.",
    accent: "#efcf68",
    motif: "master",
  },
];
