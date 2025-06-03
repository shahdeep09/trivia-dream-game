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
import { supabase } from "@/integrations/supabase/client";

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
    loadQuizHistory();
  }, []);

  const loadQuizHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading quiz history:', error);
        // Fallback to localStorage if Supabase fails
        const savedHistory = localStorage.getItem("quiz-history");
        if (savedHistory) {
          setQuizHistory(JSON.parse(savedHistory));
        }
      } else {
        // Convert Supabase data to QuizConfig format
        const formattedQuizzes: QuizConfig[] = data.map(quiz => ({
          id: quiz.id,
          logo: quiz.logo,
          numberOfQuestions: quiz.number_of_questions,
          questionConfig: quiz.question_config,
          selectedLifelines: quiz.selected_lifelines,
          numberOfTeams: quiz.number_of_teams,
          teamNames: quiz.team_names,
          samajName: quiz.samaj_name,
          createdAt: quiz.created_at
        }));
        setQuizHistory(formattedQuizzes);
      }
    } catch (error) {
      console.error('Error loading quiz history:', error);
      // Fallback to localStorage
      const savedHistory = localStorage.getItem("quiz-history");
      if (savedHistory) {
        setQuizHistory(JSON.parse(savedHistory));
      }
    }
  };

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

  const handleSubmit = async () => {
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

    const quizId = crypto.randomUUID();
    const quizConfig: QuizConfig = {
      id: quizId,
      logo,
      numberOfQuestions,
      questionConfig,
      selectedLifelines,
      numberOfTeams,
      teamNames,
      samajName,
      createdAt: new Date().toISOString()
    };

    try {
      // Save to Supabase
      const { error: quizError } = await supabase
        .from('quizzes')
        .insert({
          id: quizId,
          samaj_name: samajName,
          logo,
          number_of_questions: numberOfQuestions,
          number_of_teams: numberOfTeams,
          selected_lifelines: selectedLifelines,
          question_config: questionConfig,
          team_names: teamNames
        });

      if (quizError) {
        console.error('Error saving quiz to Supabase:', quizError);
        throw quizError;
      }

      // Create teams in Supabase
      const teamsData = teamNames.map(name => ({
        quiz_id: quizId,
        name
      }));

      const { error: teamsError } = await supabase
        .from('teams')
        .insert(teamsData);

      if (teamsError) {
        console.error('Error saving teams to Supabase:', teamsError);
      }

      // Update local history
      const updatedHistory = [...quizHistory, quizConfig];
      setQuizHistory(updatedHistory);
      
      // Keep localStorage as backup
      localStorage.setItem("quiz-history", JSON.stringify(updatedHistory));
      localStorage.setItem("current-quiz-config", JSON.stringify(quizConfig));

      toast({
        title: "Quiz Created Successfully",
        description: "Your quiz has been configured and saved to database",
      });

      navigate("/");
    } catch (error) {
      console.error('Error saving quiz:', error);
      // Fallback to localStorage only
      const updatedHistory = [...quizHistory, quizConfig];
      setQuizHistory(updatedHistory);
      localStorage.setItem("quiz-history", JSON.stringify(updatedHistory));
      localStorage.setItem("current-quiz-config", JSON.stringify(quizConfig));

      toast({
        title: "Quiz Created",
        description: "Quiz saved locally. Database connection failed.",
        variant: "destructive",
      });

      navigate("/");
    }
  };

  const loadExistingQuiz = async (config: QuizConfig) => {
    localStorage.setItem("current-quiz-config", JSON.stringify(config));
    
    // Load teams from Supabase for this quiz
    try {
      const { data: teams, error } = await supabase
        .from('teams')
        .select('*')
        .eq('quiz_id', config.id);

      if (!error && teams) {
        // Store teams data for the loaded quiz
        localStorage.setItem(`teams-${config.id}`, JSON.stringify(teams));
      }
    } catch (error) {
      console.error('Error loading teams for quiz:', error);
    }
    
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
