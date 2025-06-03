
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { availableLifelines } from "@/types/quiz";

interface QuizConfigFormProps {
  logo: string;
  onLogoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  numberOfQuestions: number;
  onNumberOfQuestionsChange: (value: string) => void;
  selectedLifelines: string[];
  onLifelineToggle: (lifelineId: string) => void;
  numberOfTeams: number;
  onNumberOfTeamsChange: (value: string) => void;
  samajName: string;
  onSamajNameChange: (value: string) => void;
  onSubmit: () => void;
}

export const QuizConfigForm = ({
  logo,
  onLogoUpload,
  numberOfQuestions,
  onNumberOfQuestionsChange,
  selectedLifelines,
  onLifelineToggle,
  numberOfTeams,
  onNumberOfTeamsChange,
  samajName,
  onSamajNameChange,
  onSubmit
}: QuizConfigFormProps) => {
  return (
    <Card className="bg-millionaire-secondary border-millionaire-accent">
      <CardHeader>
        <CardTitle className="text-millionaire-gold">Create New Quiz</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Upload Logo</Label>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Input
                type="file"
                accept="image/*"
                onChange={onLogoUpload}
                className="bg-millionaire-primary border-millionaire-accent"
              />
            </div>
            {logo && (
              <img src={logo} alt="Logo preview" className="w-16 h-16 object-cover rounded" />
            )}
          </div>
          <p className="text-sm text-millionaire-light">300px x 300px recommended. Default logo will be used if not uploaded.</p>
        </div>

        <div className="space-y-2">
          <Label>Number of Questions in the Quiz</Label>
          <Input
            type="number"
            min="1"
            max="50"
            value={numberOfQuestions}
            onChange={(e) => onNumberOfQuestionsChange(e.target.value)}
            className="bg-millionaire-primary border-millionaire-accent"
          />
        </div>

        <div className="space-y-4">
          <Label>Select Lifelines</Label>
          <div className="grid grid-cols-2 gap-4">
            {availableLifelines.map((lifeline) => (
              <div key={lifeline.id} className="flex items-center space-x-2">
                <Checkbox
                  id={lifeline.id}
                  checked={selectedLifelines.includes(lifeline.id)}
                  onCheckedChange={() => onLifelineToggle(lifeline.id)}
                />
                <Label htmlFor={lifeline.id}>{lifeline.name}</Label>
              </div>
            ))}
          </div>
          <p className="text-sm text-millionaire-light">
            Roll the Dice Rule: 1-2 Get Hint, 3-4-5 Nothing Happens, 6 Skip Question
          </p>
        </div>

        <div className="space-y-2">
          <Label>Number of Players/Teams</Label>
          <Input
            type="number"
            min="1"
            max="20"
            value={numberOfTeams}
            onChange={(e) => onNumberOfTeamsChange(e.target.value)}
            className="bg-millionaire-primary border-millionaire-accent"
          />
        </div>

        <div className="space-y-2">
          <Label>Enter Samaj/Sangh Name</Label>
          <Input
            value={samajName}
            onChange={(e) => onSamajNameChange(e.target.value)}
            placeholder="Enter organization name"
            className="bg-millionaire-primary border-millionaire-accent"
          />
        </div>

        <Button
          onClick={onSubmit}
          className="w-full bg-millionaire-gold hover:bg-yellow-500 text-millionaire-primary"
        >
          Create Quiz
        </Button>
      </CardContent>
    </Card>
  );
};
