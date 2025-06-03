
import { useState } from "react";
import { GameSettings, Question, applyFiftyFifty, phoneAFriend, askTheAudience } from "@/utils/gameUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from "lucide-react";

interface LifelineProps {
  type: "fifty-fifty" | "phone-friend" | "ask-audience";
  isUsed: boolean;
  onUse: (type: "fifty-fifty" | "phone-friend" | "ask-audience", result: any) => void;
  currentQuestion: Question;
  settings: GameSettings;
}

const Lifeline = ({ type, isUsed, onUse, currentQuestion, settings }: LifelineProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [audienceResults, setAudienceResults] = useState<number[]>([]);
  const [friendResponse, setFriendResponse] = useState("");

  const getLifelineName = () => {
    switch (type) {
      case "fifty-fifty":
        return settings.lifelineNames.lifeline1;
      case "phone-friend":
        return settings.lifelineNames.lifeline2;
      case "ask-audience":
        return settings.lifelineNames.lifeline3;
      default:
        return "";
    }
  };

  const getLifelineIcon = () => {
    const lifelineName = getLifelineName().toLowerCase();
    
    // Check if it's a roll dice lifeline
    if (lifelineName.includes('dice') || lifelineName.includes('roll')) {
      const diceIcons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];
      const randomDice = diceIcons[Math.floor(Math.random() * diceIcons.length)];
      const DiceIcon = randomDice;
      return <DiceIcon size={20} />;
    }
    
    // Check for Ask the Expert
    if (lifelineName.includes('expert') || lifelineName.includes('ask')) {
      return "👨‍🎓";
    }
    
    // Check for Audience Poll
    if (lifelineName.includes('poll') || lifelineName.includes('audience')) {
      return "📊";
    }
    
    switch (type) {
      case "fifty-fifty":
        // Only show 50:50 icon for actual fifty-fifty lifeline
        if (lifelineName.includes('50') || lifelineName === 'fifty-fifty') {
          return (
            <div className="text-sm text-center">
              <span className="block">50</span>
              <span className="block">50</span>
            </div>
          );
        }
        return "🎯";
      case "phone-friend":
        return "📞";
      case "ask-audience":
        return "👥";
      default:
        return "";
    }
  };

  const handleUseLifeline = () => {
    if (isUsed) return;

    let result;
    const lifelineName = getLifelineName().toLowerCase();
    
    switch (type) {
      case "fifty-fifty":
        // Only apply fifty-fifty logic for actual 50:50 lifeline
        if (lifelineName.includes('50') || lifelineName === 'fifty-fifty') {
          result = applyFiftyFifty(currentQuestion);
        } else {
          // For Roll the Dice, just mark as used without any result
          result = null;
        }
        onUse(type, result);
        break;
      case "phone-friend":
        // For ask the expert, just mark as used - no dialog
        if (lifelineName.includes('expert') || lifelineName.includes('ask')) {
          result = null;
          onUse(type, result);
        } else {
          // For actual phone a friend, show dialog
          result = phoneAFriend(currentQuestion);
          setFriendResponse(result);
          setDialogOpen(true);
          onUse(type, result);
        }
        break;
      case "ask-audience":
        // For audience poll, just mark as used - no dialog
        if (lifelineName.includes('poll') || lifelineName.includes('audience')) {
          result = null;
          onUse(type, result);
        } else {
          // For actual ask the audience, show dialog
          result = askTheAudience(currentQuestion);
          setAudienceResults(result);
          setDialogOpen(true);
          onUse(type, result);
        }
        break;
    }
  };

  const renderLifelineDialog = () => {
    const lifelineName = getLifelineName().toLowerCase();
    
    switch (type) {
      case "phone-friend":
        // Only show dialog for actual phone a friend, not ask the expert
        if (lifelineName.includes('expert') || lifelineName.includes('ask')) {
          return null;
        }
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
        // Only show dialog for actual ask the audience, not audience poll
        if (lifelineName.includes('poll') || lifelineName.includes('audience')) {
          return null;
        }
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
        className={`w-16 h-16 rounded-full border-2 border-millionaire-accent bg-millionaire-primary flex flex-col items-center justify-center ${isUsed ? "opacity-50" : "hover:bg-millionaire-secondary transition-colors"}`}
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
