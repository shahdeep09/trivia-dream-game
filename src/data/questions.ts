
import { Question } from "../utils/gameUtils";

// Sample questions for the game
export const SAMPLE_QUESTIONS: Question[] = [
  // Easy Questions ($100-$1,000)
  {
    id: "q1",
    text: "What is the capital city of France?",
    options: ["London", "Berlin", "Paris", "Rome"],
    correctOptionIndex: 2,
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
    text: "Who wrote 'Romeo and Juliet'?",
    options: ["Charles Dickens", "Jane Austen", "William Shakespeare", "Mark Twain"],
    correctOptionIndex: 2,
    value: 300,
    difficulty: "easy",
  },
  {
    id: "q4",
    text: "What is the largest ocean on Earth?",
    options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
    correctOptionIndex: 3,
    value: 500,
    difficulty: "easy",
  },
  {
    id: "q5",
    text: "Which of these is not a primary color?",
    options: ["Red", "Yellow", "Blue", "Green"],
    correctOptionIndex: 3,
    value: 1000,
    difficulty: "easy",
  },
  
  // Medium Questions ($2,000-$32,000)
  {
    id: "q6",
    text: "Which element has the chemical symbol 'Au'?",
    options: ["Silver", "Gold", "Aluminum", "Argon"],
    correctOptionIndex: 1,
    value: 2000,
    difficulty: "medium",
  },
  {
    id: "q7",
    text: "In which year did the Titanic sink?",
    options: ["1905", "1912", "1920", "1931"],
    correctOptionIndex: 1,
    value: 4000,
    difficulty: "medium",
  },
  {
    id: "q8",
    text: "Who painted the Mona Lisa?",
    options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Michelangelo"],
    correctOptionIndex: 2,
    value: 8000,
    difficulty: "medium",
  },
  {
    id: "q9",
    text: "Which of these countries is not in Europe?",
    options: ["Portugal", "Turkey", "Thailand", "Sweden"],
    correctOptionIndex: 2,
    value: 16000,
    difficulty: "medium",
  },
  {
    id: "q10",
    text: "What is the smallest bone in the human body?",
    options: ["Stapes", "Femur", "Radius", "Ulna"],
    correctOptionIndex: 0,
    value: 32000,
    difficulty: "medium",
  },
  
  // Hard Questions ($64,000-$1,000,000)
  {
    id: "q11",
    text: "Which of these scientists developed the theory of general relativity?",
    options: ["Isaac Newton", "Albert Einstein", "Niels Bohr", "Marie Curie"],
    correctOptionIndex: 1,
    value: 64000,
    difficulty: "hard",
  },
  {
    id: "q12",
    text: "What is the capital city of Mozambique?",
    options: ["Maputo", "Lusaka", "Harare", "Luanda"],
    correctOptionIndex: 0,
    value: 125000,
    difficulty: "hard",
  },
  {
    id: "q13",
    text: "Which novel begins with the line: 'All happy families are alike; each unhappy family is unhappy in its own way'?",
    options: ["Crime and Punishment", "War and Peace", "Anna Karenina", "The Brothers Karamazov"],
    correctOptionIndex: 2,
    value: 250000,
    difficulty: "hard",
  },
  {
    id: "q14",
    text: "Who was the first woman to win a Nobel Prize?",
    options: ["Marie Curie", "Rosalind Franklin", "Dorothy Hodgkin", "Irène Joliot-Curie"],
    correctOptionIndex: 0,
    value: 500000,
    difficulty: "hard",
  },
  {
    id: "q15",
    text: "In Greek mythology, who was the messenger of the gods?",
    options: ["Apollo", "Hermes", "Dionysus", "Poseidon"],
    correctOptionIndex: 1,
    value: 1000000,
    difficulty: "hard",
  },
];
