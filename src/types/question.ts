export type Difficulty = "easy" | "medium" | "hard";
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
  | "Overflow and underflow";
export type PuzzleType =
  | "execute"
  | "selectTop"
  | "predictStack"
  | "arrangeSequence"
  | "topIndex"
  | "tracePointers"
  | "invalidOperation"
  | "debugCode";
export type StackCommand = {
  operation: "PUSH" | "POP" | "PEEK" | "isEmpty" | "createStack";
  value?: string;
  negate?: boolean;
};
export type QuestionAction = {
  id: string;
  label: string;
  command?: StackCommand;
  program?: StackCommand[];
  code?: string;
};
export type Question = {
  id: string;
  topic: CurriculumTopic;
  difficulty: Difficulty;
  title: string;
  mission: string;
  puzzleType: PuzzleType;
  initialStack: string[];
  expectedAnswer: string;
  availableActions: QuestionAction[];
  explanation: string;
  hint: string;
  materialReference: string;
  basePoints: 100 | 150 | 200;
  coverage: CurriculumTopic[];
  selectionPool: string;
  program?: StackCommand[];
  targetStack?: string[];
  code?: string;
  pointerTarget?: "top" | "next";
};
