
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { QuizConfig } from "@/types/quiz";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useQuizSubmission = (updateQuizHistory: (quiz: QuizConfig) => void) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSubmit = async (
    samajName: string,
    selectedLifelines: string[],
    logo: string,
    numberOfQuestions: number,
    questionConfig: Array<{ questionNumber: number; points: number; timeLimit: number }>,
    numberOfTeams: number,
    teamNames: string[]
  ) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a quiz",
        variant: "destructive",
      });
      return;
    }

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
          user_id: user.id,
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
        user_id: user.id,
        name
      }));

      const { error: teamsError } = await supabase
        .from('teams')
        .insert(teamsData);

      if (teamsError) {
        console.error('Error saving teams to Supabase:', teamsError);
      }

      // Clear any previous quiz data from localStorage
      localStorage.removeItem("millionaire-teams");
      localStorage.removeItem("current-quiz-config");
      
      // Set new quiz config
      localStorage.setItem("current-quiz-config", JSON.stringify(quizConfig));

      // Update local history
      updateQuizHistory(quizConfig);

      toast({
        title: "Quiz Created Successfully",
        description: "Your quiz has been configured and saved to database",
      });

      navigate("/");
    } catch (error) {
      console.error('Error saving quiz:', error);
      // Fallback to localStorage only
      localStorage.removeItem("millionaire-teams");
      localStorage.removeItem("current-quiz-config");
      
      localStorage.setItem("current-quiz-config", JSON.stringify(quizConfig));
      updateQuizHistory(quizConfig);

      toast({
        title: "Quiz Created",
        description: "Quiz saved locally. Database connection failed.",
        variant: "destructive",
      });

      navigate("/");
    }
  };

  const loadExistingQuiz = async (config: QuizConfig) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to load a quiz",
        variant: "destructive",
      });
      return;
    }

    // Clear previous quiz data
    localStorage.removeItem("millionaire-teams");
    localStorage.removeItem("current-quiz-config");
    
    localStorage.setItem("current-quiz-config", JSON.stringify(config));
    
    // Load teams from Supabase for this quiz
    try {
      const { data: teams, error } = await supabase
        .from('teams')
        .select('*')
        .eq('quiz_id', config.id)
        .eq('user_id', user.id);

      if (!error && teams) {
        // Store teams data for the loaded quiz
        localStorage.setItem(`teams-${config.id}`, JSON.stringify(teams));
      }
    } catch (error) {
      console.error('Error loading teams for quiz:', error);
    }
    
    navigate("/");
  };

  return {
    handleSubmit,
    loadExistingQuiz
  };
};
