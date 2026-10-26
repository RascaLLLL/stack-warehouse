export type Difficulty = "easy" | "medium" | "hard";
export type QuestionTopic = "stack" | "queue";
export type CurriculumTopic =
  | "Stack definition"
  | "LIFO"
  | "TOP"
  | "PUSH"
  | "POP"
  | "Pointer representation"
  | "Array representation"
  | "createStack"
  | "isEmpty"
  | "Allocation/deallocation"
  | "Operation tracing"
  | "Overflow and underflow"
  | "FIFO"
  | "ENQUEUE"
  | "DEQUEUE"
  | "HEAD"
  | "TAIL"
  | "Queue pointer"
  | "Queue array";
export type PuzzleType =
  | "execute"
  | "selectTop"
  | "predictStack"
  | "arrangeSequence"
  | "topIndex"
  | "tracePointers"
  | "invalidOperation"
  | "debugCode"
  | "queueChoice"
  | "queueExecute"
  | "queuePredict"
  | "queueDebug";
export type StackCommand = {
  operation: "PUSH" | "POP" | "PEEK" | "isEmpty" | "createStack";
  value?: string;
  negate?: boolean;
};
export type QueueCommand = {
  operation: "ENQUEUE" | "DEQUEUE" | "FRONT" | "isEmpty" | "isFull";
  value?: string;
};
export type QuestionAction = {
  id: string;
  label: string;
  command?: StackCommand;
  program?: StackCommand[];
  code?: string;
  queueCommand?: QueueCommand;
  queueProgram?: QueueCommand[];
};
export type Question = {
  id: string;
  questionTopic: QuestionTopic;
  topic: CurriculumTopic;
  difficulty: Difficulty;
  title: string;
  mission: string;
  puzzleType: PuzzleType;
  initialStack: string[];
  initialQueue?: string[];
  question: string;
  expectedAnswer: string;
  availableActions: QuestionAction[];
  explanation: string;
  hint: string;
  materialReference: string;
  basePoints: 100 | 150 | 200;
  coverage: CurriculumTopic[];
  selectionPool: string;
  program?: StackCommand[];
  queueProgram?: QueueCommand[];
  queueAnswerKind?: "items" | "front" | "tail" | "indices" | "output";
  targetStack?: string[];
  code?: string;
  pointerTarget?: "top" | "next";
};
