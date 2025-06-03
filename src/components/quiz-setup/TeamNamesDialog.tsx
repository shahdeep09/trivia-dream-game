
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface TeamNamesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamNames: string[];
  onTeamNameUpdate: (index: number, name: string) => void;
}

export const TeamNamesDialog = ({
  open,
  onOpenChange,
  teamNames,
  onTeamNameUpdate
}: TeamNamesDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-millionaire-primary border-millionaire-accent">
        <DialogHeader>
          <DialogTitle className="text-millionaire-gold">Enter Team Names</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teamNames.map((name, index) => (
            <div key={index} className="flex items-center space-x-2">
              <span className="w-8 text-sm">{index + 1}.</span>
              <Input
                value={name}
                onChange={(e) => onTeamNameUpdate(index, e.target.value)}
                placeholder={`Team ${index + 1}`}
                className="flex-1 bg-millionaire-secondary border-millionaire-accent"
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
