import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Question, GameSettings } from "@/utils/game/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { QuizConfig } from "@/types/quiz";

interface LifelineProps {
  lifelineId: string;
  isUsed: boolean;
  onUse: (lifelineId: string, result: any) => void;
  currentQuestion: Question;
  settings: GameSettings;
  quizConfig: QuizConfig;
}

const Lifeline = ({ lifelineId, isUsed, onUse, currentQuestion, settings, quizConfig }: LifelineProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pollResults, setPollResults] = useState<number[]>([]);
  const [expertAnswer, setExpertAnswer] = useState<string>("");
  const [diceResult, setDiceResult] = useState<number | null>(null);

  const getLifelineIcon = () => {
    switch (lifelineId) {
      case "fifty-fifty":
        return "50:50";
      case "audience-poll":
        return "👥";
      case "ask-expert":
        return "👨‍🎓";
      case "roll-dice":
        return "🎲";
      default:
        return "?";
    }
  };

  const getLifelineName = () => {
    switch (lifelineId) {
      case "fifty-fifty":
        return "50:50";
      case "audience-poll":
        return "Audience Poll";
      case "ask-expert":
        return "Ask the Expert";
      case "roll-dice":
        return "Roll the Dice";
      default:
        return "Lifeline";
    }
  };

  const handleUseLifeline = () => {
    if (isUsed) return;

    switch (lifelineId) {
      case "fifty-fifty":
        useFiftyFifty();
        break;
      case "audience-poll":
        useAudiencePoll();
        setDialogOpen(true);
        break;
      case "ask-expert":
        useAskExpert();
        setDialogOpen(true);
        break;
      case "roll-dice":
        useRollDice();
        setDialogOpen(true);
        break;
    }
  };

  const useFiftyFifty = () => {
    const correctIndex = currentQuestion.correctOptionIndex;
    const wrongIndices = currentQuestion.options
      .map((_, index) => index)
      .filter(index => index !== correctIndex);
    
    // Randomly select two wrong options to remove
    const shuffledWrongIndices = [...wrongIndices].sort(() => Math.random() - 0.5);
    const indicesToRemove = shuffledWrongIndices.slice(0, 2);
    
    onUse(lifelineId, indicesToRemove);
  };

  const useAudiencePoll = () => {
    const correctIndex = currentQuestion.correctOptionIndex;
    const numOptions = currentQuestion.options.length;
    
    // Generate realistic audience poll results
    // Correct answer gets 45-75% of votes, others split the rest
    const correctPercentage = Math.floor(Math.random() * 30) + 45;
    let remainingPercentage = 100 - correctPercentage;
    
    const results = Array(numOptions).fill(0);
    
    // Assign the correct percentage to the correct answer
    results[correctIndex] = correctPercentage;
    
    // Distribute remaining percentage among wrong answers
    const wrongIndices = Array.from({ length: numOptions }, (_, i) => i).filter(i => i !== correctIndex);
    
    for (let i = 0; i < wrongIndices.length - 1; i++) {
      const wrongPercentage = Math.floor(Math.random() * remainingPercentage);
      results[wrongIndices[i]] = wrongPercentage;
      remainingPercentage -= wrongPercentage;
    }
    
    // Assign remaining percentage to the last wrong answer
    results[wrongIndices[wrongIndices.length - 1]] = remainingPercentage;
    
    setPollResults(results);
    onUse(lifelineId, results);
  };

  const useAskExpert = () => {
    const correctIndex = currentQuestion.correctOptionIndex;
    const correctAnswer = currentQuestion.options[correctIndex];
    
    // 80% chance the expert is correct
    const isExpertCorrect = Math.random() < 0.8;
    
    let expertResponse;
    if (isExpertCorrect) {
      expertResponse = `I'm quite confident the answer is ${correctAnswer}. The reasoning is...`;
    } else {
      // Expert gives wrong answer
      const wrongIndices = currentQuestion.options
        .map((_, index) => index)
        .filter(index => index !== correctIndex);
      const randomWrongIndex = wrongIndices[Math.floor(Math.random() * wrongIndices.length)];
      const wrongAnswer = currentQuestion.options[randomWrongIndex];
      
      expertResponse = `I believe the answer is ${wrongAnswer}, but I'm not 100% certain.`;
    }
    
    setExpertAnswer(expertResponse);
    onUse(lifelineId, { expertResponse, isCorrect: isExpertCorrect });
  };

  const useRollDice = () => {
    // Roll a dice (1-6)
    const roll = Math.floor(Math.random() * 6) + 1;
    setDiceResult(roll);
    
    // If roll is 5 or 6, reveal correct answer
    const revealCorrect = roll >= 5;
    const result = {
      roll,
      revealCorrect,
      correctAnswer: revealCorrect ? currentQuestion.options[currentQuestion.correctOptionIndex] : null
    };
    
    onUse(lifelineId, result);
  };

  const renderLifelineContent = () => {
    switch (lifelineId) {
      case "audience-poll":
        return (
          <>
            <DialogHeader>
              <DialogTitle>Audience Poll Results</DialogTitle>
              <DialogDescription>
                Here's how the audience voted:
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{option}</span>
                    <span className="text-sm font-medium">{pollResults[index]}%</span>
                  </div>
                  <Progress value={pollResults[index]} className="h-2" />
                </div>
              ))}
            </div>
          </>
        );
      
      case "ask-expert":
        return (
          <>
            <DialogHeader>
              <DialogTitle>Expert Opinion</DialogTitle>
              <DialogDescription>
                Our expert has analyzed the question:
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="bg-millionaire-secondary p-4 rounded-md">
                <p className="italic">"{expertAnswer}"</p>
              </div>
              <p className="mt-4 text-sm text-millionaire-light">
                Remember, experts can sometimes be wrong too!
              </p>
            </div>
          </>
        );
      
      case "roll-dice":
        return (
          <>
            <DialogHeader>
              <DialogTitle>Roll the Dice</DialogTitle>
              <DialogDescription>
                You rolled:
              </DialogDescription>
            </DialogHeader>
            <div className="py-8 flex flex-col items-center">
              <div className="text-6xl mb-4">
                {diceResult === 1 && "⚀"}
                {diceResult === 2 && "⚁"}
                {diceResult === 3 && "⚂"}
                {diceResult === 4 && "⚃"}
                {diceResult === 5 && "⚄"}
                {diceResult === 6 && "⚅"}
              </div>
              <p className="text-xl font-bold mb-2">You rolled a {diceResult}!</p>
              {diceResult && diceResult >= 5 ? (
                <div className="text-center">
                  <Badge className="bg-green-500 mb-2">Lucky Roll!</Badge>
                  <p>The correct answer is:</p>
                  <p className="text-millionaire-gold font-bold text-xl mt-2">
                    {currentQuestion.options[currentQuestion.correctOptionIndex]}
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <Badge className="bg-red-500 mb-2">Unlucky!</Badge>
                  <p>You need to roll a 5 or 6 to reveal the correct answer.</p>
                  <p className="text-sm mt-2">Better luck next time!</p>
                </div>
              )}
            </div>
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <>
      <Button
        variant={isUsed ? "outline" : "default"}
        className={`w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold ${
          isUsed 
            ? "bg-gray-700 text-gray-400 border-gray-600 opacity-50 cursor-not-allowed" 
            : "bg-millionaire-accent hover:bg-millionaire-gold hover:text-millionaire-primary"
        }`}
        onClick={handleUseLifeline}
        disabled={isUsed}
        title={getLifelineName()}
      >
        {getLifelineIcon()}
      </Button>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-millionaire-primary border-millionaire-accent">
          {renderLifelineContent()}
          <DialogFooter>
            <Button 
              onClick={() => setDialogOpen(false)}
              className="bg-millionaire-gold hover:bg-yellow-500 text-millionaire-primary"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Lifeline;
