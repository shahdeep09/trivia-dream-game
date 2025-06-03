
export interface QuizConfig {
  id: string;
  logo?: string;
  numberOfQuestions: number;
  questionConfig: Array<{
    questionNumber: number;
    points: number;
    timeLimit: number;
  }>;
  selectedLifelines: string[];
  numberOfTeams: number;
  teamNames: string[];
  samajName: string;
  createdAt: string;
}

export const availableLifelines = [
  { id: "fifty-fifty", name: "50:50" },
  { id: "audience-poll", name: "Audience Poll" },
  { id: "ask-expert", name: "Ask The Expert" },
  { id: "roll-dice", name: "Roll the Dice" }
];
