
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
  onOpenQuestionConfig: () => void;
  onOpenTeamNames: () => void;
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
  onSubmit,
  onOpenQuestionConfig,
  onOpenTeamNames
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
          <p className="text-sm text-millionaire-light">300px x 300px recommended. Default "Kaun Banega Gyani" logo will be used if not uploaded.</p>
        </div>

        <div className="space-y-2">
          <Label>Number of Questions in the Quiz</Label>
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              min="1"
              max="20"
              value={numberOfQuestions}
              onChange={(e) => onNumberOfQuestionsChange(e.target.value)}
              className="bg-millionaire-primary border-millionaire-accent flex-1"
            />
            <Button
              onClick={onOpenQuestionConfig}
              variant="outline"
              className="border-millionaire-accent"
              disabled={numberOfQuestions <= 0 || numberOfQuestions > 20}
            >
              Configure Questions
            </Button>
          </div>
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
            Roll the Dice: You will manually roll the dice offline. Ask the Expert & Audience Poll: Use these lifelines when needed offline.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Number of Players/Teams</Label>
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              min="1"
              max="30"
              value={numberOfTeams}
              onChange={(e) => onNumberOfTeamsChange(e.target.value)}
              className="bg-millionaire-primary border-millionaire-accent flex-1"
            />
            <Button
              onClick={onOpenTeamNames}
              variant="outline"
              className="border-millionaire-accent"
              disabled={numberOfTeams <= 0 || numberOfTeams > 30}
            >
              Configure Teams
            </Button>
          </div>
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
