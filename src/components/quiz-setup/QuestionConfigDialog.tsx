
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface QuestionConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionConfig: Array<{
    questionNumber: number;
    points: number;
    timeLimit: number;
  }>;
  onQuestionConfigUpdate: (index: number, field: 'points' | 'timeLimit', value: string) => void;
}

export const QuestionConfigDialog = ({
  open,
  onOpenChange,
  questionConfig,
  onQuestionConfigUpdate
}: QuestionConfigDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-millionaire-primary border-millionaire-accent">
        <DialogHeader>
          <DialogTitle className="text-millionaire-gold">Configure Questions</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {questionConfig.map((config, index) => (
            <div key={index} className="flex items-center space-x-2 p-2 bg-millionaire-secondary rounded">
              <span className="w-12 text-sm">Q{config.questionNumber}:</span>
              <Input
                type="number"
                placeholder="Points"
                value={config.points}
                onChange={(e) => onQuestionConfigUpdate(index, 'points', e.target.value)}
                className="flex-1 bg-millionaire-primary border-millionaire-accent"
              />
              <Input
                type="number"
                placeholder="Time (sec)"
                value={config.timeLimit}
                onChange={(e) => onQuestionConfigUpdate(index, 'timeLimit', e.target.value)}
                className="flex-1 bg-millionaire-primary border-millionaire-accent"
              />
            </div>
          ))}
        </div>
        <Button
          onClick={() => onOpenChange(false)}
          className="bg-millionaire-accent hover:bg-millionaire-gold text-millionaire-primary"
        >
          OK
        </Button>
      </DialogContent>
    </Dialog>
  );
};
