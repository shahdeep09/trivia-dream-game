
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { QuizConfig } from "@/types/quiz";

interface QuizHistoryCardProps {
  quizHistory: QuizConfig[];
  onLoadExistingQuiz: (config: QuizConfig) => void;
}

export const QuizHistoryCard = ({ quizHistory, onLoadExistingQuiz }: QuizHistoryCardProps) => {
  return (
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
                onClick={() => onLoadExistingQuiz(quiz)}
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
  );
};
