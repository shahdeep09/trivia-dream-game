import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export interface QuizConfig {
  id: string;
  logo?: string;
  numberOfQuestions: number;
  questionConfig: Array<{
    questionNumber: number;
    points: number;
    timeLimit: number;
  }>;
  selectedLifelines: string[];
  numberOfTeams: number;
  teamNames: string[];
  samajName: string;
  createdAt: string;
}

const QuizSetup = () => {
  const navigate = useNavigate();
  const [logo, setLogo] = useState<string>("/lovable-uploads/0d1e7ef2-aeab-4808-882b-a623fe6dc254.png");
  const [numberOfQuestions, setNumberOfQuestions] = useState<number>(15);
  const [showQuestionConfig, setShowQuestionConfig] = useState(false);
  const [questionConfig, setQuestionConfig] = useState<Array<{
    questionNumber: number;
    points: number;
    timeLimit: number;
  }>>([]);
  const [selectedLifelines, setSelectedLifelines] = useState<string[]>([]);
  const [numberOfTeams, setNumberOfTeams] = useState<number>(10);
  const [showTeamNames, setShowTeamNames] = useState(false);
  const [teamNames, setTeamNames] = useState<string[]>([]);
  const [samajName, setSamajName] = useState<string>("");
  const [quizHistory, setQuizHistory] = useState<QuizConfig[]>([]);

  const availableLifelines = [
    { id: "fifty-fifty", name: "50:50" },
    { id: "audience-poll", name: "Audience Poll" },
    { id: "ask-expert", name: "Ask The Expert" },
    { id: "roll-dice", name: "Roll the Dice" }
  ];

  useEffect(() => {
    const savedHistory = localStorage.getItem("quiz-history");
    if (savedHistory) {
      setQuizHistory(JSON.parse(savedHistory));
    }
  }, []);

  useEffect(() => {
    if (numberOfQuestions > 0) {
      const config = Array.from({ length: numberOfQuestions }, (_, index) => ({
        questionNumber: index + 1,
        points: 100,
        timeLimit: 30
      }));
      setQuestionConfig(config);
    }
  }, [numberOfQuestions]);

  useEffect(() => {
    if (numberOfTeams > 0) {
      const names = Array.from({ length: numberOfTeams }, (_, index) => `Team ${index + 1}`);
      setTeamNames(names);
    }
  }, [numberOfTeams]);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogo(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNumberOfQuestionsChange = (value: string) => {
    const num = parseInt(value) || 0;
    if (num > 0 && num <= 50) {
      setNumberOfQuestions(num);
      setShowQuestionConfig(true);
    }
  };

  const handleQuestionConfigUpdate = (index: number, field: 'points' | 'timeLimit', value: string) => {
    const numValue = parseInt(value) || 0;
    const updatedConfig = [...questionConfig];
    updatedConfig[index] = {
      ...updatedConfig[index],
      [field]: numValue
    };
    setQuestionConfig(updatedConfig);
  };

  const handleLifelineToggle = (lifelineId: string) => {
    setSelectedLifelines(prev => 
      prev.includes(lifelineId) 
        ? prev.filter(id => id !== lifelineId)
        : [...prev, lifelineId]
    );
  };

  const handleNumberOfTeamsChange = (value: string) => {
    const num = parseInt(value) || 0;
    if (num > 0 && num <= 20) {
      setNumberOfTeams(num);
      setShowTeamNames(true);
    }
  };

  const handleTeamNameUpdate = (index: number, name: string) => {
    const updatedNames = [...teamNames];
    updatedNames[index] = name;
    setTeamNames(updatedNames);
  };

  const handleSubmit = () => {
    if (!samajName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter the Samaj/Sangh name",
        variant: "destructive",
      });
      return;
    }

    if (selectedLifelines.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please select at least one lifeline",
        variant: "destructive",
      });
      return;
    }

    const quizConfig: QuizConfig = {
      id: Date.now().toString(),
      logo,
      numberOfQuestions,
      questionConfig,
      selectedLifelines,
      numberOfTeams,
      teamNames,
      samajName,
      createdAt: new Date().toISOString()
    };

    const updatedHistory = [...quizHistory, quizConfig];
    setQuizHistory(updatedHistory);
    localStorage.setItem("quiz-history", JSON.stringify(updatedHistory));
    localStorage.setItem("current-quiz-config", JSON.stringify(quizConfig));

    toast({
      title: "Quiz Created Successfully",
      description: "Your quiz has been configured and saved",
    });

    navigate("/");
  };

  const loadExistingQuiz = (config: QuizConfig) => {
    localStorage.setItem("current-quiz-config", JSON.stringify(config));
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-millionaire-dark text-millionaire-light">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-millionaire-gold">Quiz Setup</h1>
            <p className="text-millionaire-light mt-2">Configure your quiz game</p>
          </div>
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="border-millionaire-accent flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
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
                        onChange={handleLogoUpload}
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
                    onChange={(e) => handleNumberOfQuestionsChange(e.target.value)}
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
                          onCheckedChange={() => handleLifelineToggle(lifeline.id)}
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
                    onChange={(e) => handleNumberOfTeamsChange(e.target.value)}
                    className="bg-millionaire-primary border-millionaire-accent"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Enter Samaj/Sangh Name</Label>
                  <Input
                    value={samajName}
                    onChange={(e) => setSamajName(e.target.value)}
                    placeholder="Enter organization name"
                    className="bg-millionaire-primary border-millionaire-accent"
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  className="w-full bg-millionaire-gold hover:bg-yellow-500 text-millionaire-primary"
                >
                  Create Quiz
                </Button>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="bg-millionaire-secondary border-millionaire-accent">
              <CardHeader>
                <CardTitle className="text-millionaire-gold">Quiz History</CardTitle>
              </CardHeader>
              <CardContent>
                {quizHistory.length === 0 ? (
                  <p className="text-millionaire-light">No previous quizzes found</p>
                ) : (
                  <div className="space-y-3">
                    {quizHistory.map((quiz) => (
                      <div
                        key={quiz.id}
                        className="p-3 bg-millionaire-primary rounded border border-millionaire-accent hover:bg-millionaire-dark cursor-pointer"
                        onClick={() => loadExistingQuiz(quiz)}
                      >
                        <h4 className="font-medium text-millionaire-gold">{quiz.samajName}</h4>
                        <p className="text-sm text-millionaire-light">
                          {quiz.numberOfQuestions} questions • {quiz.numberOfTeams} teams
                        </p>
                        <p className="text-xs text-millionaire-accent">
                          {new Date(quiz.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <Dialog open={showQuestionConfig} onOpenChange={setShowQuestionConfig}>
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
                    onChange={(e) => handleQuestionConfigUpdate(index, 'points', e.target.value)}
                    className="flex-1 bg-millionaire-primary border-millionaire-accent"
                  />
                  <Input
                    type="number"
                    placeholder="Time (sec)"
                    value={config.timeLimit}
                    onChange={(e) => handleQuestionConfigUpdate(index, 'timeLimit', e.target.value)}
                    className="flex-1 bg-millionaire-primary border-millionaire-accent"
                  />
                </div>
              ))}
            </div>
            <Button
              onClick={() => setShowQuestionConfig(false)}
              className="bg-millionaire-accent hover:bg-millionaire-gold text-millionaire-primary"
            >
              OK
            </Button>
          </DialogContent>
        </Dialog>

        <Dialog open={showTeamNames} onOpenChange={setShowTeamNames}>
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
                    onChange={(e) => handleTeamNameUpdate(index, e.target.value)}
                    placeholder={`Team ${index + 1}`}
                    className="flex-1 bg-millionaire-secondary border-millionaire-accent"
                  />
                </div>
              ))}
            </div>
            <Button
              onClick={() => setShowTeamNames(false)}
              className="bg-millionaire-accent hover:bg-millionaire-gold text-millionaire-primary"
            >
              OK
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default QuizSetup;
