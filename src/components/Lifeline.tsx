
import { useState } from "react";
import { GameSettings, Question, applyFiftyFifty, phoneAFriend, askTheAudience } from "@/utils/gameUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from "lucide-react";
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
  const [audienceResults, setAudienceResults] = useState<number[]>([]);
  const [friendResponse, setFriendResponse] = useState("");

  const getLifelineName = () => {
    switch (lifelineId) {
      case "fifty-fifty":
        return "50:50";
      case "phone-friend":
        return "Phone a Friend";
      case "ask-audience":
        return "Ask the Audience";
      case "ask-expert":
        return "Ask the Expert";
      case "audience-poll":
        return "Audience Poll";
      case "roll-dice":
        return "Roll the Dice";
      default:
        return lifelineId;
    }
  };

  const getLifelineIcon = () => {
    switch (lifelineId) {
      case "fifty-fifty":
        return (
          <div className="text-sm text-center">
            <span className="block">50</span>
            <span className="block">50</span>
          </div>
        );
      case "phone-friend":
        return "📞";
      case "ask-audience":
        return "👥";
      case "ask-expert":
        return "👨‍🎓";
      case "audience-poll":
        return "📊";
      case "roll-dice":
        const diceIcons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];
        const randomDice = diceIcons[Math.floor(Math.random() * diceIcons.length)];
        const DiceIcon = randomDice;
        return <DiceIcon size={20} />;
      default:
        return "❓";
    }
  };

  const handleUseLifeline = () => {
    if (isUsed) return;

    let result;
    
    switch (lifelineId) {
      case "fifty-fifty":
        // Standard 50:50 - remove two wrong answers
        result = applyFiftyFifty(currentQuestion);
        onUse(lifelineId, result);
        break;
        
      case "phone-friend":
        // Standard Phone a Friend - show dialog
        result = phoneAFriend(currentQuestion);
        setFriendResponse(result);
        setDialogOpen(true);
        onUse(lifelineId, result);
        break;
        
      case "ask-audience":
        // Standard Ask the Audience - show dialog
        result = askTheAudience(currentQuestion);
        setAudienceResults(result);
        setDialogOpen(true);
        onUse(lifelineId, result);
        break;
        
      case "ask-expert":
      case "audience-poll":
      case "roll-dice":
        // Custom lifelines - just mark as used, no popup
        result = null;
        onUse(lifelineId, result);
        break;
        
      default:
        result = null;
        onUse(lifelineId, result);
        break;
    }
  };

  const renderLifelineDialog = () => {
    switch (lifelineId) {
      case "phone-friend":
        return (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="bg-millionaire-primary border-millionaire-accent">
              <DialogHeader>
                <DialogTitle>Phone a Friend</DialogTitle>
              </DialogHeader>
              <div className="p-4 bg-millionaire-secondary rounded-md mt-2">
                <p className="italic">"Hello? Yes, I'm watching the show..."</p>
                <p className="mt-2">{friendResponse}</p>
                <p className="mt-2 italic">"Sorry, that's all I've got. Good luck!"</p>
              </div>
            </DialogContent>
          </Dialog>
        );
        
      case "ask-audience":
        return (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="bg-millionaire-primary border-millionaire-accent">
              <DialogHeader>
                <DialogTitle>Ask the Audience</DialogTitle>
              </DialogHeader>
              <div className="p-4 bg-millionaire-secondary rounded-md mt-2">
                <p className="mb-4">The audience voted:</p>
                <div className="flex justify-between items-end h-40 gap-4">
                  {audienceResults.map((percent, index) => (
                    <div key={index} className="flex flex-col items-center flex-1">
                      <div className="w-full bg-millionaire-accent relative">
                        <div
                          className="bg-millionaire-gold transition-all duration-1000 ease-out"
                          style={{ height: `${percent}%`, width: '100%' }}
                        ></div>
                      </div>
                      <div className="mt-2">
                        <span className="font-bold">{String.fromCharCode(65 + index)}</span>
                        <span className="ml-2">{percent}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        );
        
      default:
        return null;
    }
  };

  return (
    <>
      <button
        className={`w-16 h-16 rounded-full border-4 border-yellow-400 bg-millionaire-primary flex flex-col items-center justify-center ${
          isUsed 
            ? "opacity-50 border-gray-400" 
            : "hover:bg-millionaire-secondary hover:border-yellow-300 transition-colors"
        }`}
        onClick={handleUseLifeline}
        disabled={isUsed}
        title={getLifelineName()}
      >
        <span className="text-lg mb-0.5">{getLifelineIcon()}</span>
        <span className="text-xs mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis w-full text-center px-1">
          {getLifelineName()}
        </span>
      </button>
      {renderLifelineDialog()}
    </>
  );
};

export default Lifeline;
