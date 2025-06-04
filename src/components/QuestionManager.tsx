import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Question } from "@/utils/game/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Plus, Play } from "lucide-react";

interface QuestionManagerProps {
  questions: Question[];
  onAddQuestion: (question: Question) => void;
  onUpdateQuestion: (question: Question) => void;
  onDeleteQuestion: (id: string) => void;
  onStartGame: () => void;
  maxQuestions: number;
}

const QuestionManager = ({
  questions,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onStartGame,
  maxQuestions
}: QuestionManagerProps) => {
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [newQuestion, setNewQuestion] = useState({
    text: "",
    options: ["", "", "", ""],
    correctOptionIndex: 0,
    value: 100,
    category: "",
    difficulty: "medium" as "easy" | "medium" | "hard",
    explanation: ""
  });

  const handleAddQuestion = () => {
    if (newQuestion.text && newQuestion.options.every(opt => opt.trim())) {
      const question: Question = {
        id: Date.now().toString(),
        text: newQuestion.text,
        options: newQuestion.options,
        correctOptionIndex: newQuestion.correctOptionIndex,
        value: newQuestion.value,
        category: newQuestion.category,
        difficulty: newQuestion.difficulty,
        explanation: newQuestion.explanation
      };
      
      onAddQuestion(question);
      
      // Reset form
      setNewQuestion({
        text: "",
        options: ["", "", "", ""],
        correctOptionIndex: 0,
        value: 100,
        category: "",
        difficulty: "medium",
        explanation: ""
      });
      setIsAddingQuestion(false);
    }
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setNewQuestion({
      text: question.text,
      options: [...question.options],
      correctOptionIndex: question.correctOptionIndex,
      value: question.value,
      category: question.category || "",
      difficulty: question.difficulty || "medium",
      explanation: question.explanation || ""
    });
  };

  const handleUpdateQuestion = () => {
    if (editingQuestion && newQuestion.text && newQuestion.options.every(opt => opt.trim())) {
      const updatedQuestion: Question = {
        ...editingQuestion,
        text: newQuestion.text,
        options: newQuestion.options,
        correctOptionIndex: newQuestion.correctOptionIndex,
        value: newQuestion.value,
        category: newQuestion.category,
        difficulty: newQuestion.difficulty,
        explanation: newQuestion.explanation
      };
      
      onUpdateQuestion(updatedQuestion);
      setEditingQuestion(null);
      
      // Reset form
      setNewQuestion({
        text: "",
        options: ["", "", "", ""],
        correctOptionIndex: 0,
        value: 100,
        category: "",
        difficulty: "medium",
        explanation: ""
      });
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const updatedOptions = [...newQuestion.options];
    updatedOptions[index] = value;
    setNewQuestion({ ...newQuestion, options: updatedOptions });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-millionaire-gold">Question Bank</h2>
          <p className="text-millionaire-light">
            {questions.length} questions available | Need {maxQuestions} for quiz
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsAddingQuestion(true)}
            className="bg-millionaire-accent hover:bg-millionaire-gold text-millionaire-primary"
          >
            <Plus size={16} className="mr-2" />
            Add Question
          </Button>
          <Button
            onClick={onStartGame}
            className="bg-millionaire-gold hover:bg-yellow-500 text-millionaire-primary"
            disabled={questions.length < maxQuestions}
          >
            Start Game
          </Button>
        </div>
      </div>

      <Card className="bg-millionaire-secondary border-millionaire-accent">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-millionaire-primary">
                <TableHead className="text-millionaire-gold">Question</TableHead>
                <TableHead className="text-millionaire-gold">Category</TableHead>
                <TableHead className="text-millionaire-gold">Difficulty</TableHead>
                <TableHead className="text-millionaire-gold">Points</TableHead>
                <TableHead className="text-millionaire-gold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((question) => (
                <TableRow key={question.id} className="border-b border-millionaire-accent">
                  <TableCell className="max-w-xs truncate">{question.text}</TableCell>
                  <TableCell>{question.category || "General"}</TableCell>
                  <TableCell className="capitalize">{question.difficulty || "medium"}</TableCell>
                  <TableCell>{question.value}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditQuestion(question)}
                        className="border-millionaire-accent"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDeleteQuestion(question.id)}
                        className="border-millionaire-wrong text-millionaire-wrong hover:bg-millionaire-wrong hover:text-white"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Question Dialog */}
      <Dialog open={isAddingQuestion || !!editingQuestion} onOpenChange={(open) => {
        if (!open) {
          setIsAddingQuestion(false);
          setEditingQuestion(null);
        }
      }}>
        <DialogContent className="max-w-2xl bg-millionaire-primary border-millionaire-accent">
          <DialogHeader>
            <DialogTitle>{editingQuestion ? "Edit Question" : "Add New Question"}</DialogTitle>
          </DialogHeader>
          
          <DialogDescription>
            {editingQuestion ? "Edit the existing question" : "Add a new question to the bank"}
          </DialogDescription>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Question Text</Label>
              <Textarea
                value={newQuestion.text}
                onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                placeholder="Enter your question..."
                className="bg-millionaire-secondary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {newQuestion.options.map((option, index) => (
                <div key={index} className="space-y-2">
                  <Label>Option {String.fromCharCode(65 + index)}</Label>
                  <Input
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    className="bg-millionaire-secondary"
                  />
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Correct Answer</Label>
              <Select 
                value={newQuestion.correctOptionIndex.toString()} 
                onValueChange={(value) => setNewQuestion({ ...newQuestion, correctOptionIndex: parseInt(value) })}
              >
                <SelectTrigger className="bg-millionaire-secondary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {newQuestion.options.map((option, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {String.fromCharCode(65 + index)}: {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Points</Label>
                <Input
                  type="number"
                  value={newQuestion.value}
                  onChange={(e) => setNewQuestion({ ...newQuestion, value: parseInt(e.target.value) || 0 })}
                  className="bg-millionaire-secondary"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  value={newQuestion.category}
                  onChange={(e) => setNewQuestion({ ...newQuestion, category: e.target.value })}
                  placeholder="e.g., Science, History"
                  className="bg-millionaire-secondary"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select 
                  value={newQuestion.difficulty} 
                  onValueChange={(value: "easy" | "medium" | "hard") => setNewQuestion({ ...newQuestion, difficulty: value })}
                >
                  <SelectTrigger className="bg-millionaire-secondary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Explanation (Optional)</Label>
              <Textarea
                value={newQuestion.explanation}
                onChange={(e) => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
                placeholder="Explain why this is the correct answer..."
                className="bg-millionaire-secondary"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddingQuestion(false);
                setEditingQuestion(null);
              }}
              className="border-millionaire-accent"
            >
              Cancel
            </Button>
            <Button
              onClick={editingQuestion ? handleUpdateQuestion : handleAddQuestion}
              className="bg-millionaire-accent hover:bg-millionaire-gold text-millionaire-primary"
              disabled={!newQuestion.text || !newQuestion.options.every(opt => opt.trim())}
            >
              {editingQuestion ? "Update" : "Add"} Question
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuestionManager;
