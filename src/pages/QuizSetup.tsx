
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { QuizConfig } from "@/types/quiz";
import { QuizConfigForm } from "@/components/quiz-setup/QuizConfigForm";
import { QuestionConfigDialog } from "@/components/quiz-setup/QuestionConfigDialog";
import { TeamNamesDialog } from "@/components/quiz-setup/TeamNamesDialog";
import { QuizHistoryCard } from "@/components/quiz-setup/QuizHistoryCard";

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
            <QuizConfigForm
              logo={logo}
              onLogoUpload={handleLogoUpload}
              numberOfQuestions={numberOfQuestions}
              onNumberOfQuestionsChange={handleNumberOfQuestionsChange}
              selectedLifelines={selectedLifelines}
              onLifelineToggle={handleLifelineToggle}
              numberOfTeams={numberOfTeams}
              onNumberOfTeamsChange={handleNumberOfTeamsChange}
              samajName={samajName}
              onSamajNameChange={setSamajName}
              onSubmit={handleSubmit}
            />
          </div>

          <div>
            <QuizHistoryCard
              quizHistory={quizHistory}
              onLoadExistingQuiz={loadExistingQuiz}
            />
          </div>
        </div>

        <QuestionConfigDialog
          open={showQuestionConfig}
          onOpenChange={setShowQuestionConfig}
          questionConfig={questionConfig}
          onQuestionConfigUpdate={handleQuestionConfigUpdate}
        />

        <TeamNamesDialog
          open={showTeamNames}
          onOpenChange={setShowTeamNames}
          teamNames={teamNames}
          onTeamNameUpdate={handleTeamNameUpdate}
        />
      </div>
    </div>
  );
};

export default QuizSetup;
