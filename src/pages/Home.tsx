
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QuizHeader from "@/components/home/QuizHeader";
import TeamsTab from "@/components/home/TeamsTab";
import PointsTable from "@/components/home/PointsTable";
import NoQuizConfigured from "@/components/home/NoQuizConfigured";
import { UserMenu } from "@/components/auth/UserMenu";
import { useQuizConfig } from "@/hooks/useQuizConfig";
import { useNavigate } from "react-router-dom";
import { QuizConfig } from "@/types/quiz";
import { Team, loadTeams, saveTeams } from "@/utils/gameUtils";

const Home = () => {
  const [activeTab, setActiveTab] = useState("teams");
  const [currentQuizConfig, setCurrentQuizConfig] = useState<QuizConfig | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const loadQuizData = () => {
      const quizConfig = localStorage.getItem("current-quiz-config");
      if (quizConfig) {
        const config = JSON.parse(quizConfig);
        setCurrentQuizConfig(config);
        
        // Load teams for this quiz
        const loadedTeams = loadTeams();
        setTeams(loadedTeams);
      }
    };

    loadQuizData();
  }, [refreshKey]);

  const forceRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const calculateTotalPoints = (team: Team): number => {
    return (team.points || 0) + (team.bonusPoints || 0);
  };

  const handleBonusPointsChange = (teamId: string, value: string) => {
    const updatedTeams = teams.map(team => 
      team.id === teamId 
        ? { ...team, bonusPoints: parseInt(value) || 0 }
        : team
    );
    setTeams(updatedTeams);
  };

  const saveBonusPoints = async (teamId: string) => {
    saveTeams(teams);
    forceRefresh();
  };

  if (!currentQuizConfig) {
    return <NoQuizConfigured />;
  }

  return (
    <div className="min-h-screen bg-millionaire-dark text-millionaire-light">
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold text-millionaire-gold mb-2">
              Quiz Master Dashboard
            </h1>
            <p className="text-millionaire-light">
              Manage your quiz game and track team progress
            </p>
          </div>
          <div className="flex items-center gap-4">
            <UserMenu />
            <Button
              onClick={() => navigate("/setup")}
              className="bg-millionaire-accent hover:bg-millionaire-accent/90"
            >
              Create New Quiz
            </Button>
          </div>
        </div>

        <QuizHeader 
          currentQuizConfig={currentQuizConfig}
          forceRefresh={forceRefresh}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
          <TabsList className="grid w-full grid-cols-2 bg-millionaire-dark border border-millionaire-accent">
            <TabsTrigger 
              value="teams"
              className="data-[state=active]:bg-millionaire-accent data-[state=active]:text-millionaire-dark"
            >
              Teams
            </TabsTrigger>
            <TabsTrigger 
              value="points"
              className="data-[state=active]:bg-millionaire-accent data-[state=active]:text-millionaire-dark"
            >
              Points Table
            </TabsTrigger>
          </TabsList>

          <TabsContent value="teams">
            <TeamsTab 
              teams={teams}
              refreshKey={refreshKey}
              calculateTotalPoints={calculateTotalPoints}
            />
          </TabsContent>

          <PointsTable 
            teams={teams}
            refreshKey={refreshKey}
            calculateTotalPoints={calculateTotalPoints}
            handleBonusPointsChange={handleBonusPointsChange}
            saveBonusPoints={saveBonusPoints}
          />
        </Tabs>
      </div>
    </div>
  );
};

export default Home;
