
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, Play, Settings, Trash2 } from "lucide-react";
import { QuizConfig } from "@/types/quiz";
import { toast } from "@/hooks/use-toast";

const QuizManager = () => {
  const navigate = useNavigate();
  const [quizHistory, setQuizHistory] = useState<QuizConfig[]>([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem("quiz-history");
    if (savedHistory) {
      setQuizHistory(JSON.parse(savedHistory));
    }
  }, []);

  const loadQuiz = (config: QuizConfig) => {
    localStorage.setItem("current-quiz-config", JSON.stringify(config));
    navigate("/");
  };

  const deleteQuiz = (quizId: string) => {
    const updatedHistory = quizHistory.filter(quiz => quiz.id !== quizId);
    setQuizHistory(updatedHistory);
    localStorage.setItem("quiz-history", JSON.stringify(updatedHistory));
    
    toast({
      title: "Quiz Deleted",
      description: "The quiz has been removed from history",
    });
  };

  return (
    <div className="min-h-screen bg-millionaire-dark text-millionaire-light">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-millionaire-gold">Quiz Manager</h1>
            <p className="text-millionaire-light mt-2">Manage your quiz configurations</p>
          </div>
          <div className="flex space-x-4">
            <Button
              asChild
              variant="outline"
              className="border-millionaire-accent flex items-center gap-2"
            >
              <Link to="/">
                <ArrowLeft size={16} />
                Back to Home
              </Link>
            </Button>
            <Button
              asChild
              className="bg-millionaire-gold hover:bg-yellow-500 text-millionaire-primary"
            >
              <Link to="/setup">
                Create New Quiz
              </Link>
            </Button>
          </div>
        </div>

        {quizHistory.length === 0 ? (
          <Card className="bg-millionaire-secondary border-millionaire-accent">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Settings className="w-16 h-16 text-millionaire-accent mb-4" />
              <h2 className="text-xl font-semibold text-millionaire-gold mb-2">No Quizzes Found</h2>
              <p className="text-millionaire-light mb-6 text-center">
                You haven't created any quizzes yet. Create your first quiz to get started.
              </p>
              <Button
                asChild
                className="bg-millionaire-gold hover:bg-yellow-500 text-millionaire-primary"
              >
                <Link to="/setup">
                  Create Your First Quiz
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizHistory.map((quiz) => (
              <Card key={quiz.id} className="bg-millionaire-secondary border-millionaire-accent">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-millionaire-gold">{quiz.samajName}</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteQuiz(quiz.id)}
                      className="text-millionaire-wrong hover:text-white hover:bg-millionaire-wrong"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <p className="text-sm">
                      <span className="font-medium">Questions:</span> {quiz.numberOfQuestions}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Teams:</span> {quiz.numberOfTeams}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Lifelines:</span> {quiz.selectedLifelines.length}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Created:</span>{" "}
                      {new Date(quiz.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {quiz.logo && (
                    <div className="mb-4">
                      <img
                        src={quiz.logo}
                        alt="Quiz logo"
                        className="w-16 h-16 object-cover rounded mx-auto"
                      />
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Button
                      onClick={() => loadQuiz(quiz)}
                      className="flex-1 bg-millionaire-accent hover:bg-millionaire-gold text-millionaire-primary"
                    >
                      <Play size={16} className="mr-2" />
                      Load Quiz
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizManager;
