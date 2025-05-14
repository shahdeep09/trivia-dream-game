
import { Question } from "../utils/gameUtils";

// 15 General Knowledge Questions for the game
export const SAMPLE_QUESTIONS: Question[] = [
  // Easy Questions ($100-$1,000)
  {
    id: "q1",
    text: "Which is the largest ocean on Earth?",
    options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
    correctOptionIndex: 3,
    value: 100,
    difficulty: "easy",
  },
  {
    id: "q2",
    text: "Which planet is known as the Red Planet?",
    options: ["Jupiter", "Mars", "Venus", "Saturn"],
    correctOptionIndex: 1,
    value: 200,
    difficulty: "easy",
  },
  {
    id: "q3",
    text: "What is the chemical symbol for gold?",
    options: ["Go", "Gd", "Au", "Ag"],
    correctOptionIndex: 2,
    value: 300,
    difficulty: "easy",
  },
  {
    id: "q4",
    text: "In which year did World War II end?",
    options: ["1943", "1945", "1947", "1950"],
    correctOptionIndex: 1,
    value: 500,
    difficulty: "easy",
  },
  {
    id: "q5",
    text: "Which famous scientist developed the theory of relativity?",
    options: ["Isaac Newton", "Albert Einstein", "Nikola Tesla", "Galileo Galilei"],
    correctOptionIndex: 1,
    value: 1000,
    difficulty: "easy",
  },
  
  // Medium Questions ($2,000-$32,000)
  {
    id: "q6",
    text: "What is the capital city of Australia?",
    options: ["Sydney", "Melbourne", "Canberra", "Perth"],
    correctOptionIndex: 2,
    value: 2000,
    difficulty: "medium",
  },
  {
    id: "q7",
    text: "Who painted the Mona Lisa?",
    options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Claude Monet"],
    correctOptionIndex: 2,
    value: 4000,
    difficulty: "medium",
  },
  {
    id: "q8",
    text: "What is the smallest country in the world by land area?",
    options: ["Monaco", "Vatican City", "San Marino", "Liechtenstein"],
    correctOptionIndex: 1,
    value: 8000,
    difficulty: "medium",
  },
  {
    id: "q9",
    text: "Which element has the atomic number 1?",
    options: ["Oxygen", "Carbon", "Hydrogen", "Helium"],
    correctOptionIndex: 2,
    value: 16000,
    difficulty: "medium",
  },
  {
    id: "q10",
    text: "What is the name of the longest river in Africa?",
    options: ["Nile", "Congo", "Niger", "Zambezi"],
    correctOptionIndex: 0,
    value: 32000,
    difficulty: "medium",
  },
  
  // Hard Questions ($64,000-$1,000,000)
  {
    id: "q11",
    text: "Who wrote the novel 'One Hundred Years of Solitude'?",
    options: ["Isabel Allende", "Gabriel García Márquez", "Jorge Luis Borges", "Mario Vargas Llosa"],
    correctOptionIndex: 1,
    value: 64000,
    difficulty: "hard",
  },
  {
    id: "q12",
    text: "Which year did the Chernobyl disaster occur?",
    options: ["1984", "1986", "1989", "1991"],
    correctOptionIndex: 1,
    value: 125000,
    difficulty: "hard",
  },
  {
    id: "q13",
    text: "What is the main component of the Earth's atmosphere?",
    options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Argon"],
    correctOptionIndex: 2,
    value: 250000,
    difficulty: "hard",
  },
  {
    id: "q14",
    text: "Which ancient wonder was located in Alexandria?",
    options: ["Hanging Gardens", "Colossus of Rhodes", "Lighthouse", "Temple of Artemis"],
    correctOptionIndex: 2,
    value: 500000,
    difficulty: "hard",
  },
  {
    id: "q15",
    text: "Who discovered penicillin?",
    options: ["Alexander Fleming", "Marie Curie", "Louis Pasteur", "Joseph Lister"],
    correctOptionIndex: 0,
    value: 1000000,
    difficulty: "hard",
  },
];
