
import { useState } from "react";
import { GameSettings, Question, applyFiftyFifty, phoneAFriend, askTheAudience } from "@/utils/gameUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
    switch (type) {
      case "fifty-fifty":
        return (
          <div className="text-xs text-center">
            <span className="block">50</span>
            <span className="block">50</span>
          </div>
        );
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
    switch (type) {
      case "fifty-fifty":
        result = applyFiftyFifty(currentQuestion);
        onUse(type, result);
        break;
      case "phone-friend":
        result = phoneAFriend(currentQuestion);
        setFriendResponse(result);
        setDialogOpen(true);
        onUse(type, result);
        break;
      case "ask-audience":
        result = askTheAudience(currentQuestion);
        setAudienceResults(result);
        setDialogOpen(true);
        onUse(type, result);
        break;
    }
  };

  const renderLifelineDialog = () => {
    switch (type) {
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
        className={`lifeline-button ${isUsed ? "opacity-50" : "animate-pulse-glow"}`}
        onClick={handleUseLifeline}
        disabled={isUsed}
        title={getLifelineName()}
      >
        <span className="text-xl">{getLifelineIcon()}</span>
        <span className="text-xs mt-1 whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">
          {getLifelineName()}
        </span>
      </button>
      {renderLifelineDialog()}
    </>
  );
};

export default Lifeline;
