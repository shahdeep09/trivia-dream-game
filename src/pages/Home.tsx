
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { QuizConfig } from "@/types/quiz";
import { useQuizHistory } from "@/hooks/useQuizHistory";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import QuizHeader from "@/components/home/QuizHeader";
import NoQuizConfigured from "@/components/home/NoQuizConfigured";
import { UserMenu } from "@/components/auth/UserMenu";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { quizHistory, loadQuizHistory } = useQuizHistory();
  const [currentQuizConfig, setCurrentQuizConfig] = useState<QuizConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializePage = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      // Load user's quiz history
      await loadQuizHistory();
      
      // Check for current quiz config in localStorage
      const savedConfig = localStorage.getItem("current-quiz-config");
      if (savedConfig) {
        try {
          const config = JSON.parse(savedConfig);
          
          // Verify this quiz belongs to the current user by checking if it exists in their quiz history
          // We'll check this after quiz history is loaded
          setCurrentQuizConfig(config);
        } catch (error) {
          console.error("Error parsing saved quiz config:", error);
          localStorage.removeItem("current-quiz-config");
        }
      }
      
      setLoading(false);
    };

    initializePage();
  }, [user, loadQuizHistory]);

  // Verify the current quiz belongs to the user once quiz history is loaded
  useEffect(() => {
    if (currentQuizConfig && quizHistory.length > 0 && user) {
      const userOwnsQuiz = quizHistory.some(quiz => quiz.id === currentQuizConfig.id);
      
      if (!userOwnsQuiz) {
        // This quiz doesn't belong to the current user, clear it
        localStorage.removeItem("current-quiz-config");
        localStorage.removeItem("millionaire-teams");
        setCurrentQuizConfig(null);
        
        toast({
          title: "Quiz Access Denied",
          description: "You can only access quizzes that you have created.",
          variant: "destructive"
        });
      }
    }
  }, [currentQuizConfig, quizHistory, user]);

  const forceRefresh = async () => {
    if (!user) return;
    
    setLoading(true);
    await loadQuizHistory();
    
    // Refresh teams data from Supabase
    if (currentQuizConfig) {
      try {
        const { data: teams, error } = await supabase
          .from('teams')
          .select('*')
          .eq('quiz_id', currentQuizConfig.id)
          .eq('user_id', user.id);

        if (!error && teams) {
          localStorage.setItem(`teams-${currentQuizConfig.id}`, JSON.stringify(teams));
          localStorage.setItem("millionaire-teams", JSON.stringify(teams));
        }
      } catch (error) {
        console.error('Error refreshing teams data:', error);
      }
    }
    
    setLoading(false);
    
    toast({
      title: "Data Refreshed",
      description: "Quiz and team data has been updated from the database."
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-millionaire-dark text-millionaire-light">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-millionaire-gold">Loading...</h1>
            <UserMenu />
          </div>
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-millionaire-light">Loading your quiz data...</div>
          </div>
        </div>
      </div>
    );
  }

  // Show NoQuizConfigured if user has no quizzes or no current quiz is selected
  if (!currentQuizConfig || quizHistory.length === 0) {
    return (
      <div className="min-h-screen bg-millionaire-dark text-millionaire-light">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-millionaire-gold">Quiz Master</h1>
            <UserMenu />
          </div>
          <NoQuizConfigured />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-millionaire-dark text-millionaire-light">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex-1">
            <QuizHeader currentQuizConfig={currentQuizConfig} forceRefresh={forceRefresh} />
          </div>
          <UserMenu />
        </div>
        
        <div className="text-center">
          <p className="text-millionaire-light mb-4">
            Your quiz is ready! You can manage teams, view statistics, or start playing the game.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
