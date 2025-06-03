
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QuizHeader from "@/components/home/QuizHeader";
import TeamsTab from "@/components/home/TeamsTab";
import NoQuizConfigured from "@/components/home/NoQuizConfigured";
import { UserMenu } from "@/components/auth/UserMenu";
import { useQuizConfig } from "@/hooks/useQuizConfig";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const [activeTab, setActiveTab] = useState("teams");
  const navigate = useNavigate();

  const quizConfig = localStorage.getItem("current-quiz-config");
  const hasQuizConfig = !!quizConfig;

  if (!hasQuizConfig) {
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

        <QuizHeader />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
          <TabsList className="grid w-full grid-cols-3 bg-millionaire-dark border border-millionaire-accent">
            <TabsTrigger 
              value="teams"
              className="data-[state=active]:bg-millionaire-accent data-[state=active]:text-millionaire-dark"
            >
              Teams
            </TabsTrigger>
            <TabsTrigger 
              value="questions"
              className="data-[state=active]:bg-millionaire-accent data-[state=active]:text-millionaire-dark"
            >
              Questions
            </TabsTrigger>
            <TabsTrigger 
              value="game"
              className="data-[state=active]:bg-millionaire-accent data-[state=active]:text-millionaire-dark"
            >
              Game
            </TabsTrigger>
          </TabsList>

          <TabsContent value="teams">
            <TeamsTab />
          </TabsContent>

          <TabsContent value="questions">
            <div className="bg-millionaire-card border border-millionaire-accent rounded-lg p-6">
              <h2 className="text-2xl font-bold text-millionaire-gold mb-4">Question Management</h2>
              <p className="text-millionaire-light mb-4">Upload and manage your quiz questions</p>
              <Button
                onClick={() => navigate("/manager")}
                className="bg-millionaire-gold hover:bg-millionaire-gold/90 text-millionaire-dark"
              >
                Open Question Manager
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="game">
            <div className="bg-millionaire-card border border-millionaire-accent rounded-lg p-6">
              <h2 className="text-2xl font-bold text-millionaire-gold mb-4">Game Control</h2>
              <p className="text-millionaire-light mb-4">Start and control your quiz game</p>
              <Button
                onClick={() => navigate("/game")}
                className="bg-millionaire-gold hover:bg-millionaire-gold/90 text-millionaire-dark"
              >
                Start Game
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Home;
