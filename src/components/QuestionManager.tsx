
import { useState } from "react";
import { Question } from "@/utils/gameUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";

interface QuestionManagerProps {
  questions: Question[];
  onAddQuestion: (question: Question) => void;
  onUpdateQuestion: (question: Question) => void;
  onDeleteQuestion: (id: string) => void;
  onStartGame: () => void;
}

const QuestionManager = ({
  questions,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onStartGame,
}: QuestionManagerProps) => {
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    text: "",
    options: ["", "", "", ""],
    correctOptionIndex: 0,
    value: 100,
    difficulty: "easy",
  });
  
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const handleAddQuestion = () => {
    if (!newQuestion.text || newQuestion.options?.some(opt => !opt)) {
      toast({
        title: "Error",
        description: "Please fill all fields for the question.",
        variant: "destructive",
      });
      return;
    }

    const questionToAdd: Question = {
      id: `q${Date.now()}`,
      text: newQuestion.text || "",
      options: newQuestion.options || ["", "", "", ""],
      correctOptionIndex: newQuestion.correctOptionIndex || 0,
      value: newQuestion.value || 100,
      difficulty: newQuestion.difficulty as "easy" | "medium" | "hard" || "easy",
    };

    onAddQuestion(questionToAdd);
    
    // Reset form
    setNewQuestion({
      text: "",
      options: ["", "", "", ""],
      correctOptionIndex: 0,
      value: 100,
      difficulty: "easy",
    });
    
    toast({
      title: "Success",
      description: "Question added successfully!",
    });
  };

  const handleUpdateQuestion = () => {
    if (!editingQuestion) return;
    
    onUpdateQuestion(editingQuestion);
    setEditingQuestion(null);
    
    toast({
      title: "Success",
      description: "Question updated successfully!",
    });
  };

  const handleDeleteQuestion = (id: string) => {
    if (confirm("Are you sure you want to delete this question?")) {
      onDeleteQuestion(id);
      
      toast({
        title: "Success",
        description: "Question deleted successfully!",
      });
    }
  };

  const handleOptionChange = (value: string, index: number, isEditing: boolean) => {
    if (isEditing && editingQuestion) {
      const updatedOptions = [...editingQuestion.options];
      updatedOptions[index] = value;
      setEditingQuestion({ ...editingQuestion, options: updatedOptions });
    } else {
      const updatedOptions = [...(newQuestion.options || ["", "", "", ""])];
      updatedOptions[index] = value;
      setNewQuestion({ ...newQuestion, options: updatedOptions });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-millionaire-light">Question Manager</h1>
        <Button
          onClick={onStartGame}
          className="bg-millionaire-gold hover:bg-yellow-500 text-millionaire-primary"
        >
          Start Game
        </Button>
      </div>

      <Tabs defaultValue="add" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="add">Add Question</TabsTrigger>
          <TabsTrigger value="manage">Manage Questions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="add" className="mt-4">
          <Card className="bg-millionaire-primary border-millionaire-accent">
            <CardHeader>
              <CardTitle>Add New Question</CardTitle>
              <CardDescription>Create a new question for your game</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="question-text">Question Text</Label>
                  <Input
                    id="question-text"
                    value={newQuestion.text || ""}
                    onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                    className="bg-millionaire-secondary"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Options</Label>
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <RadioGroup
                        value={String(newQuestion.correctOptionIndex)}
                        onValueChange={(value) =>
                          setNewQuestion({ ...newQuestion, correctOptionIndex: parseInt(value) })
                        }
                        className="flex items-center"
                      >
                        <RadioGroupItem value={String(i)} id={`option-${i}`} />
                      </RadioGroup>
                      <Input
                        value={newQuestion.options?.[i] || ""}
                        onChange={(e) => handleOptionChange(e.target.value, i, false)}
                        placeholder={`Option ${String.fromCharCode(65 + i)}`}
                        className="bg-millionaire-secondary flex-1"
                      />
                    </div>
                  ))}
                  <p className="text-xs text-gray-400">Select the radio button next to the correct answer</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="question-value">Value ($)</Label>
                    <Input
                      id="question-value"
                      type="number"
                      value={newQuestion.value || 100}
                      onChange={(e) =>
                        setNewQuestion({ ...newQuestion, value: parseInt(e.target.value) })
                      }
                      className="bg-millionaire-secondary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="question-difficulty">Difficulty</Label>
                    <select
                      id="question-difficulty"
                      value={newQuestion.difficulty || "easy"}
                      onChange={(e) =>
                        setNewQuestion({
                          ...newQuestion,
                          difficulty: e.target.value as "easy" | "medium" | "hard",
                        })
                      }
                      className="w-full h-10 px-3 rounded-md border border-input bg-millionaire-secondary"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleAddQuestion}
                className="bg-millionaire-accent hover:bg-millionaire-secondary"
              >
                Add Question
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="manage" className="mt-4">
          <Card className="bg-millionaire-primary border-millionaire-accent">
            <CardHeader>
              <CardTitle>Manage Questions</CardTitle>
              <CardDescription>Edit or delete existing questions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {questions.length === 0 ? (
                  <p className="text-center py-4 italic">No questions added yet.</p>
                ) : (
                  questions.map((question) => (
                    <div key={question.id} className="bg-millionaire-secondary p-4 rounded-md">
                      {editingQuestion?.id === question.id ? (
                        <div className="space-y-4">
                          <Input
                            value={editingQuestion.text}
                            onChange={(e) =>
                              setEditingQuestion({ ...editingQuestion, text: e.target.value })
                            }
                            className="font-medium"
                          />
                          
                          {[0, 1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center space-x-2">
                              <RadioGroup
                                value={String(editingQuestion.correctOptionIndex)}
                                onValueChange={(value) =>
                                  setEditingQuestion({
                                    ...editingQuestion,
                                    correctOptionIndex: parseInt(value),
                                  })
                                }
                                className="flex items-center"
                              >
                                <RadioGroupItem value={String(i)} id={`edit-option-${i}`} />
                              </RadioGroup>
                              <Input
                                value={editingQuestion.options[i]}
                                onChange={(e) => handleOptionChange(e.target.value, i, true)}
                                placeholder={`Option ${String.fromCharCode(65 + i)}`}
                              />
                            </div>
                          ))}
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="edit-value">Value ($)</Label>
                              <Input
                                id="edit-value"
                                type="number"
                                value={editingQuestion.value}
                                onChange={(e) =>
                                  setEditingQuestion({
                                    ...editingQuestion,
                                    value: parseInt(e.target.value),
                                  })
                                }
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit-difficulty">Difficulty</Label>
                              <select
                                id="edit-difficulty"
                                value={editingQuestion.difficulty}
                                onChange={(e) =>
                                  setEditingQuestion({
                                    ...editingQuestion,
                                    difficulty: e.target.value as "easy" | "medium" | "hard",
                                  })
                                }
                                className="w-full h-10 px-3 rounded-md border"
                              >
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                              </select>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2 justify-end">
                            <Button
                              variant="outline"
                              onClick={() => setEditingQuestion(null)}
                            >
                              Cancel
                            </Button>
                            <Button onClick={handleUpdateQuestion}>Save Changes</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between mb-2">
                            <h3 className="font-medium">{question.text}</h3>
                            <div className="space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingQuestion(question)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteQuestion(question.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                          <div>
                            {question.options.map((option, idx) => (
                              <p
                                key={idx}
                                className={`text-sm ${
                                  idx === question.correctOptionIndex
                                    ? "text-green-400 font-medium"
                                    : ""
                                }`}
                              >
                                {String.fromCharCode(65 + idx)}: {option}
                                {idx === question.correctOptionIndex && " (✓)"}
                              </p>
                            ))}
                          </div>
                          <Separator className="my-2" />
                          <div className="flex justify-between text-xs">
                            <span>Value: ${question.value}</span>
                            <span>Difficulty: {question.difficulty}</span>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QuestionManager;
