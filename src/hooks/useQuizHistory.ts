
import { useState, useEffect } from "react";
import { QuizConfig } from "@/types/quiz";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useQuizHistory = () => {
  const [quizHistory, setQuizHistory] = useState<QuizConfig[]>([]);
  const { user } = useAuth();

  const loadQuizHistory = async () => {
    if (!user) {
      setQuizHistory([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading quiz history:', error);
        // Fallback to localStorage if Supabase fails
        const savedHistory = localStorage.getItem(`quiz-history-${user.id}`);
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
      const savedHistory = localStorage.getItem(`quiz-history-${user.id}`);
      if (savedHistory) {
        setQuizHistory(JSON.parse(savedHistory));
      }
    }
  };

  useEffect(() => {
    if (user) {
      loadQuizHistory();
    } else {
      setQuizHistory([]);
    }
  }, [user]);

  const updateQuizHistory = (newQuiz: QuizConfig) => {
    if (!user) return;
    
    const updatedHistory = [newQuiz, ...quizHistory];
    setQuizHistory(updatedHistory);
    localStorage.setItem(`quiz-history-${user.id}`, JSON.stringify(updatedHistory));
  };

  return {
    quizHistory,
    loadQuizHistory,
    updateQuizHistory
  };
};
