import type { Difficulty, Question, QueueCommand } from "../types/question";

type Choice = [string, string, QueueCommand?];
type Entry = {
  id: string;
  difficulty: Difficulty;
  topic: Question["topic"];
  title: string;
  mission: string;
  initial: string[];
  answer: string;
  choices: Choice[];
  explanation: string;
  hint: string;
  kind?: "queueChoice" | "queueExecute" | "queuePredict" | "queueDebug";
  program?: QueueCommand[];
  reference?: string;
  answerKind?: Question["queueAnswerKind"];
};
const cmd = (
  operation: QueueCommand["operation"],
  value?: string,
): QueueCommand => ({ operation, value });
const entry = (e: Entry): Question => ({
  id: e.id,
  questionTopic: "queue",
  topic: e.topic,
  difficulty: e.difficulty,
  title: e.title,
  mission: e.mission,
  question: e.mission,
  puzzleType: e.kind ?? "queueChoice",
  initialStack: [],
  initialQueue: e.initial,
  expectedAnswer: e.answer,
  availableActions: e.choices.map(([id, label, queueCommand]) => ({
    id,
    label,
    queueCommand,
  })),
  queueProgram: e.program,
  explanation: e.explanation,
  hint: e.hint,
  queueAnswerKind: e.answerKind,
  materialReference: e.reference ?? "Modul 8 · Queue dan operasi FIFO",
  basePoints: ({ easy: 100, medium: 150, hard: 200 } as const)[e.difficulty],
  coverage: [e.topic],
  selectionPool: `queue-${e.difficulty}`,
});

export const queueQuestions: Question[] = [
  entry({
    id: "Q01",
    difficulty: "easy",
    topic: "FIFO",
    title: "Aturan jalur kirim",
    mission:
      "Paket A masuk sebelum B. Prinsip antrean apa yang menentukan paket pertama keluar?",
    initial: ["A", "B"],
    answer: "fifo",
    choices: [
      ["fifo", "FIFO: pertama masuk, pertama keluar"],
      ["lifo", "LIFO: terakhir masuk, pertama keluar"],
      ["acak", "Urutan acak"],
    ],
    explanation: "Queue memakai FIFO. Paket A di HEAD dikirim sebelum B.",
    hint: "Bayangkan antrean di loket.",
    reference: "Modul 8 · Prinsip Queue: FIFO",
  }),
  entry({
    id: "Q02",
    difficulty: "easy",
    topic: "ENQUEUE",
    title: "Paket tiba",
    mission: "Di ujung mana ENQUEUE menambahkan paket baru?",
    initial: ["A"],
    answer: "tail",
    choices: [
      ["head", "HEAD (depan)"],
      ["tail", "TAIL (belakang)"],
      ["middle", "Tengah"],
    ],
    explanation:
      "ENQUEUE menambahkan node sesudah TAIL; HEAD tetap menunjuk paket pertama.",
    hint: "Paket baru menunggu di belakang.",
    reference: "Modul 8 · ENQUEUE pada TAIL",
  }),
  entry({
    id: "Q03",
    difficulty: "easy",
    topic: "HEAD",
    title: "Jalur kosong",
    mission: "Dalam queue berbasis pointer yang kosong, nilai HEAD adalah …",
    initial: [],
    answer: "nil",
    choices: [
      ["nil", "NIL"],
      ["first", "Node pertama"],
      ["index", "IndexMax"],
    ],
    explanation: "Tidak ada node pertama, sehingga HEAD = NIL. TAIL juga NIL.",
    hint: "Pointer kosong tidak menunjuk node.",
    reference: "Modul 8 · HEAD queue kosong",
  }),
  entry({
    id: "Q04",
    difficulty: "easy",
    topic: "TAIL",
    title: "Paket terakhir dikirim",
    mission:
      "Queue pointer hanya berisi A. Setelah DEQUEUE(A), apa yang terjadi pada TAIL?",
    initial: ["A"],
    answer: "nil",
    program: [cmd("DEQUEUE")],
    choices: [
      ["a", "Tetap menunjuk A"],
      ["nil", "Menjadi NIL"],
      ["new", "Menunjuk node baru"],
    ],
    explanation:
      "Menghapus satu-satunya node membuat HEAD dan TAIL sama-sama NIL.",
    hint: "Tidak ada node terakhir setelah A keluar.",
    reference: "Modul 8 · DEQUEUE elemen tunggal",
  }),
  entry({
    id: "Q05",
    difficulty: "easy",
    topic: "Queue array",
    title: "Batas rak linear",
    mission:
      "Alternatif 2: HEAD dan TAIL bergerak. Kapan elemen aktif digeser ke awal array?",
    initial: ["A", "B"],
    answer: "max",
    choices: [
      ["each", "Setiap DEQUEUE"],
      ["max", "Saat TAIL = IndexMax sebelum ENQUEUE berikutnya"],
      ["never", "Tidak pernah"],
    ],
    explanation:
      "Pada Alternatif 2, pergeseran hanya diperlukan ketika TAIL mencapai IndexMax dan ada slot kosong di depan HEAD. Ini queue linear, bukan sirkular.",
    hint: "Pergeseran mengosongkan slot ujung untuk paket baru.",
    reference: "Modul 8 · Tabel Queue, Alternatif 2",
  }),
  entry({
    id: "Q06",
    difficulty: "easy",
    topic: "DEQUEUE",
    title: "Truk pertama",
    mission:
      "Jalankan operasi yang mengirim paket A dari depan antrean [A, B].",
    initial: ["A", "B"],
    answer: "deq",
    kind: "queueExecute",
    choices: [
      ["deq", "DEQUEUE()", cmd("DEQUEUE")],
      ["front", "FRONT()", cmd("FRONT")],
      ["add", "ENQUEUE(C)", cmd("ENQUEUE", "C")],
    ],
    explanation: "DEQUEUE menghapus HEAD A. B menjadi HEAD sekaligus TAIL.",
    hint: "Membaca FRONT tidak mengeluarkan paket.",
  }),
  entry({
    id: "Q07",
    difficulty: "easy",
    topic: "ENQUEUE",
    title: "Isi jalur",
    mission: "Queue [A] menerima B. Jalankan operasi agar B berada di TAIL.",
    initial: ["A"],
    answer: "add",
    kind: "queueExecute",
    choices: [
      ["add", "ENQUEUE(B)", cmd("ENQUEUE", "B")],
      ["deq", "DEQUEUE()", cmd("DEQUEUE")],
      ["front", "FRONT()", cmd("FRONT")],
    ],
    explanation: "ENQUEUE(B) menghasilkan [A, B]; HEAD A dan TAIL B.",
    hint: "Masukkan di belakang.",
  }),
  entry({
    id: "Q08",
    difficulty: "easy",
    topic: "HEAD",
    title: "Intip pengiriman",
    mission:
      "Queue [A, B] harus dibaca tanpa mengeluarkan A. Operasi mana yang tepat?",
    initial: ["A", "B"],
    answer: "front",
    kind: "queueExecute",
    choices: [
      ["front", "FRONT()", cmd("FRONT")],
      ["deq", "DEQUEUE()", cmd("DEQUEUE")],
      ["add", "ENQUEUE(C)", cmd("ENQUEUE", "C")],
    ],
    explanation: "FRONT membaca A tanpa mengubah antrean.",
    hint: "Cari operasi yang hanya membaca HEAD.",
  }),
  entry({
    id: "Q09",
    difficulty: "medium",
    topic: "FIFO",
    title: "Urutan truk",
    mission:
      "Queue [A, B, C] menjalankan DEQUEUE lalu ENQUEUE(D). Urutan akhir dari HEAD ke TAIL?",
    initial: ["A", "B", "C"],
    answer: '["B","C","D"]',
    kind: "queuePredict",
    program: [cmd("DEQUEUE"), cmd("ENQUEUE", "D")],
    choices: [
      ['["B","C","D"]', "[B, C, D]"],
      ['["D","B","C"]', "[D, B, C]"],
      ['["A","B","D"]', "[A, B, D]"],
    ],
    explanation: "A keluar dahulu; D masuk paling belakang.",
    hint: "Jaga urutan paket yang tersisa.",
  }),
  entry({
    id: "Q10",
    difficulty: "medium",
    topic: "HEAD",
    title: "Kepala jalur",
    mission:
      "Queue [P, Q, R] menjalankan dua DEQUEUE. Paket mana menjadi HEAD?",
    initial: ["P", "Q", "R"],
    answer: "R",
    kind: "queuePredict",
    answerKind: "front",
    program: [cmd("DEQUEUE"), cmd("DEQUEUE"), cmd("FRONT")],
    choices: [
      ["P", "P"],
      ["Q", "Q"],
      ["R", "R"],
    ],
    explanation: "P dan Q keluar berurutan. R adalah HEAD dan TAIL.",
    hint: "Hapus dari depan dua kali.",
  }),
  entry({
    id: "Q11",
    difficulty: "medium",
    topic: "TAIL",
    title: "Sambung node",
    mission: "Queue pointer [A, B] menerima C. Tautan baru yang benar adalah …",
    initial: ["A", "B"],
    answer: "b-c",
    program: [cmd("ENQUEUE", "C")],
    choices: [
      ["b-c", "B.next → C; TAIL → C"],
      ["c-a", "C.next → A; HEAD → C"],
      ["a-c", "A.next → C; TAIL tetap B"],
    ],
    explanation:
      "Node baru disambung sesudah TAIL lama B, kemudian TAIL menunjuk C.",
    hint: "Paket baru ditaruh setelah paket terakhir.",
  }),
  entry({
    id: "Q12",
    difficulty: "medium",
    topic: "Queue pointer",
    title: "Lepas HEAD",
    mission:
      "Queue pointer [A, B, C] mengirim A. Perubahan pointer yang benar?",
    initial: ["A", "B", "C"],
    answer: "b",
    program: [cmd("DEQUEUE")],
    choices: [
      ["b", "HEAD → B; TAIL tetap C"],
      ["c", "HEAD → C; TAIL → B"],
      ["a", "HEAD tetap A"],
    ],
    explanation: "DEQUEUE memindahkan HEAD ke node berikutnya B; TAIL tetap C.",
    hint: "Hanya node depan yang dilepas.",
  }),
  entry({
    id: "Q13",
    difficulty: "medium",
    topic: "Queue array",
    title: "Indeks bergerak",
    mission:
      "Array Alternatif 2 berisi [A, B, C] pada indeks 1–3. Setelah satu DEQUEUE, berapa HEAD dan TAIL?",
    initial: ["A", "B", "C"],
    answer: "2-3",
    program: [cmd("DEQUEUE")],
    choices: [
      ["2-3", "HEAD 2, TAIL 3"],
      ["1-2", "HEAD 1, TAIL 2"],
      ["2-2", "HEAD 2, TAIL 2"],
    ],
    explanation:
      "HEAD maju ke 2. TAIL tetap 3; tidak ada pergeseran saat DEQUEUE.",
    hint: "Alternatif 2 membiarkan indeks bergerak.",
  }),
  entry({
    id: "Q14",
    difficulty: "medium",
    topic: "Queue array",
    title: "Geser saat ujung",
    mission:
      "Kapasitas 4: setelah queue [A,B,C,D] melakukan dua DEQUEUE, ENQUEUE(E). Di indeks berapa HEAD dan TAIL setelah pergeseran?",
    initial: ["A", "B", "C", "D"],
    answer: "1-3",
    kind: "queuePredict",
    answerKind: "indices",
    program: [cmd("DEQUEUE"), cmd("DEQUEUE"), cmd("ENQUEUE", "E")],
    choices: [
      ["1-3", "HEAD 1, TAIL 3"],
      ["3-5", "HEAD 3, TAIL 5"],
      ["3-4", "HEAD 3, TAIL 4"],
    ],
    explanation:
      "TAIL semula di IndexMax 4. C dan D digeser ke indeks 1–2, lalu E masuk indeks 3.",
    hint: "Geser elemen aktif hanya saat ujung penuh.",
  }),
  entry({
    id: "Q15",
    difficulty: "medium",
    topic: "DEQUEUE",
    title: "Jalur kembali kosong",
    mission:
      "Jalankan operasi yang menghapus satu-satunya paket X dan mengosongkan kedua pointer.",
    initial: ["X"],
    answer: "deq",
    kind: "queueExecute",
    choices: [
      ["deq", "DEQUEUE()", cmd("DEQUEUE")],
      ["front", "FRONT()", cmd("FRONT")],
      ["add", "ENQUEUE(Y)", cmd("ENQUEUE", "Y")],
    ],
    explanation:
      "DEQUEUE(X) menghasilkan antrean kosong; HEAD dan TAIL menjadi NIL.",
    hint: "Paket X harus keluar.",
  }),
  entry({
    id: "Q16",
    difficulty: "medium",
    topic: "isEmpty",
    title: "Detektor kosong",
    mission: "Queue kosong. Pilih hasil isEmpty() yang benar.",
    initial: [],
    answer: "true",
    kind: "queuePredict",
    answerKind: "output",
    program: [cmd("isEmpty")],
    choices: [
      ["true", "true"],
      ["false", "false"],
      ["error", "underflow"],
    ],
    explanation:
      "isEmpty() bernilai true pada antrean tanpa paket; pemeriksaan ini aman.",
    hint: "Tidak ada HEAD aktif.",
  }),
  entry({
    id: "Q17",
    difficulty: "hard",
    topic: "Queue array",
    title: "Siklus linear",
    mission:
      "Array kapasitas 4: [A,B,C,D], DEQUEUE dua kali, ENQUEUE(E), lalu DEQUEUE. Berapa HEAD dan TAIL?",
    initial: ["A", "B", "C", "D"],
    answer: "2-3",
    kind: "queuePredict",
    answerKind: "indices",
    program: [
      cmd("DEQUEUE"),
      cmd("DEQUEUE"),
      cmd("ENQUEUE", "E"),
      cmd("DEQUEUE"),
    ],
    choices: [
      ["2-3", "HEAD 2, TAIL 3"],
      ["4-4", "HEAD 4, TAIL 4"],
      ["1-2", "HEAD 1, TAIL 2"],
    ],
    explanation:
      "Pergeseran saat E masuk memberi [C,D,E] pada 1–3. Setelah C keluar, HEAD 2 dan TAIL 3.",
    hint: "Ikuti pergeseran sebelum DEQUEUE terakhir.",
  }),
  entry({
    id: "Q18",
    difficulty: "hard",
    topic: "Queue pointer",
    title: "Perbaiki penghapusan",
    mission:
      "Kode menghapus HEAD terakhir tetapi membiarkan TAIL menunjuk node lama. Pilih perbaikan.",
    initial: ["A"],
    answer: "nil",
    program: [cmd("DEQUEUE")],
    kind: "queueDebug",
    choices: [
      ["nil", "Jika HEAD = NIL, set TAIL = NIL"],
      ["keep", "Biarkan TAIL menunjuk A"],
      ["new", "Buat node pengganti kosong"],
    ],
    explanation:
      "Setelah node tunggal dihapus, kedua pointer wajib NIL agar tidak ada tautan menggantung.",
    hint: "Tidak ada node belakang bila antrean kosong.",
  }),
  entry({
    id: "Q19",
    difficulty: "hard",
    topic: "Queue array",
    title: "Rak penuh",
    mission: "Array kapasitas 4 berisi [A,B,C,D]. ENQUEUE(E) menghasilkan apa?",
    initial: ["A", "B", "C", "D"],
    answer: "overflow",
    kind: "queuePredict",
    answerKind: "output",
    program: [cmd("ENQUEUE", "E")],
    choices: [
      ["overflow", "overflow; isi tetap"],
      ["shift", "A bergeser dan E masuk"],
      ["replace", "D diganti E"],
    ],
    explanation:
      "Empat slot aktif sudah penuh. Operasi ditolak tanpa mengubah antrean.",
    hint: "Tidak ada slot kosong untuk digeser.",
  }),
  entry({
    id: "Q20",
    difficulty: "hard",
    topic: "DEQUEUE",
    title: "Jalur nihil",
    mission:
      "Pilih operasi yang akan menghasilkan underflow tanpa merusak antrean kosong.",
    initial: [],
    answer: "deq",
    kind: "queueExecute",
    choices: [
      ["deq", "DEQUEUE()", cmd("DEQUEUE")],
      ["add", "ENQUEUE(A)", cmd("ENQUEUE", "A")],
      ["empty", "isEmpty()", cmd("isEmpty")],
    ],
    explanation:
      "DEQUEUE pada antrean kosong menghasilkan underflow; HEAD dan TAIL tetap NIL.",
    hint: "Mengeluarkan dari antrean kosong tidak mungkin.",
  }),
  entry({
    id: "Q21",
    difficulty: "hard",
    topic: "FIFO",
    title: "Jejak sortir",
    mission:
      "[A,B] → ENQUEUE(C) → DEQUEUE → ENQUEUE(D) → DEQUEUE. Urutan akhir?",
    initial: ["A", "B"],
    answer: '["C","D"]',
    kind: "queuePredict",
    program: [
      cmd("ENQUEUE", "C"),
      cmd("DEQUEUE"),
      cmd("ENQUEUE", "D"),
      cmd("DEQUEUE"),
    ],
    choices: [
      ['["C","D"]', "[C, D]"],
      ['["B","D"]', "[B, D]"],
      ['["D","C"]', "[D, C]"],
    ],
    explanation:
      "A lalu B keluar. C dan D tetap berurutan menurut waktu kedatangan.",
    hint: "Catat paket yang keluar satu per satu.",
  }),
  entry({
    id: "Q22",
    difficulty: "hard",
    topic: "Queue array",
    title: "Jangan melingkar",
    mission:
      "Queue [A,B,C,D] menjalankan dua DEQUEUE: HEAD=3 dan TAIL=IndexMax. ENQUEUE(E) berikutnya harus …",
    initial: ["A", "B", "C", "D"],
    answer: "shift",
    program: [cmd("DEQUEUE"), cmd("DEQUEUE"), cmd("ENQUEUE", "E")],
    kind: "queueDebug",
    choices: [
      ["shift", "Geser C,D ke indeks awal lalu tambahkan paket"],
      ["wrap", "Langsung putar TAIL ke indeks 1 seperti queue sirkular"],
      ["reject", "Selalu tolak karena TAIL di IndexMax"],
    ],
    explanation:
      "Alternatif 2 melakukan pergeseran elemen aktif saat TAIL mencapai IndexMax; pembungkusan indeks adalah aturan queue sirkular yang berbeda.",
    hint: "Masih ada slot kosong sebelum HEAD.",
  }),
  entry({
    id: "Q23",
    difficulty: "hard",
    topic: "TAIL",
    title: "Periksa akhir",
    mission: "Queue [A,B,C] → DEQUEUE → ENQUEUE(D). Paket di TAIL?",
    initial: ["A", "B", "C"],
    answer: "D",
    kind: "queuePredict",
    answerKind: "tail",
    program: [cmd("DEQUEUE"), cmd("ENQUEUE", "D")],
    choices: [
      ["A", "A"],
      ["C", "C"],
      ["D", "D"],
    ],
    explanation: "D masuk terakhir dan menjadi TAIL; B tetap HEAD.",
    hint: "TAIL selalu paket terakhir yang aktif.",
  }),
  entry({
    id: "Q24",
    difficulty: "hard",
    topic: "isEmpty",
    title: "Urutan pulih",
    mission: "Queue [A] → DEQUEUE → ENQUEUE(B). Pointer yang benar setelahnya?",
    initial: ["A"],
    answer: "b-b",
    program: [cmd("DEQUEUE"), cmd("ENQUEUE", "B")],
    choices: [
      ["b-b", "HEAD → B dan TAIL → B"],
      ["nil-b", "HEAD → NIL dan TAIL → B"],
      ["a-b", "HEAD → A dan TAIL → B"],
    ],
    explanation:
      "Setelah A keluar queue kosong. ENQUEUE(B) membuat B menjadi HEAD sekaligus TAIL.",
    hint: "Paket pertama dalam antrean kosong memegang dua ujung.",
  }),
];
