
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { QuizConfigForm } from "@/components/quiz-setup/QuizConfigForm";
import { QuestionConfigDialog } from "@/components/quiz-setup/QuestionConfigDialog";
import { TeamNamesDialog } from "@/components/quiz-setup/TeamNamesDialog";
import { QuizHistoryCard } from "@/components/quiz-setup/QuizHistoryCard";
import { useQuizHistory } from "@/hooks/useQuizHistory";
import { useQuizConfig } from "@/hooks/useQuizConfig";
import { useQuizSubmission } from "@/hooks/useQuizSubmission";
import { handleLogoUpload } from "@/utils/quizUtils";

const QuizSetup = () => {
  const navigate = useNavigate();
  const { quizHistory, updateQuizHistory } = useQuizHistory();
  const {
    logo,
    setLogo,
    numberOfQuestions,
    handleNumberOfQuestionsChange,
    showQuestionConfig,
    setShowQuestionConfig,
    questionConfig,
    handleQuestionConfigUpdate,
    selectedLifelines,
    handleLifelineToggle,
    numberOfTeams,
    handleNumberOfTeamsChange,
    showTeamNames,
    setShowTeamNames,
    teamNames,
    handleTeamNameUpdate,
    samajName,
    setSamajName,
    openQuestionConfig,
    openTeamNames
  } = useQuizConfig();

  const { handleSubmit, loadExistingQuiz } = useQuizSubmission(updateQuizHistory);

  const onLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleLogoUpload(event, setLogo);
  };

  const onSubmit = () => {
    handleSubmit(
      samajName,
      selectedLifelines,
      logo,
      numberOfQuestions,
      questionConfig,
      numberOfTeams,
      teamNames
    );
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
              onLogoUpload={onLogoUpload}
              numberOfQuestions={numberOfQuestions}
              onNumberOfQuestionsChange={handleNumberOfQuestionsChange}
              selectedLifelines={selectedLifelines}
              onLifelineToggle={handleLifelineToggle}
              numberOfTeams={numberOfTeams}
              onNumberOfTeamsChange={handleNumberOfTeamsChange}
              samajName={samajName}
              onSamajNameChange={setSamajName}
              onSubmit={onSubmit}
              onOpenQuestionConfig={openQuestionConfig}
              onOpenTeamNames={openTeamNames}
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
