
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { parseQuestionsFromCSV } from '@/utils/csvUtils';
import { Question } from '@/utils/gameUtils';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface CSVUploaderProps {
  onQuestionsImported: (questions: Question[]) => void;
}

const CSVUploader = ({ onQuestionsImported }: CSVUploaderProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [questionSets, setQuestionSets] = useState<{[key: string]: Question[]}>({});
  const [selectedSet, setSelectedSet] = useState<string | null>(null);
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    setIsLoading(true);
    
    try {
      const newQuestionSets: {[key: string]: Question[]} = { ...questionSets };
      let loadedSetsCount = 0;
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = file.name.replace('.csv', '');
        const fileContent = await file.text();
        
        const questions = parseQuestionsFromCSV(fileContent);
        
        // Only add the set if it has questions
        if (questions.length > 0) {
          newQuestionSets[fileName] = questions;
          loadedSetsCount++;
        }
      }
      
      setQuestionSets(newQuestionSets);
      
      toast({
        title: "CSV Import Complete",
        description: `Successfully loaded ${loadedSetsCount} question sets.`,
      });
      
      // If this is the first upload, select the first set
      if (Object.keys(questionSets).length === 0 && loadedSetsCount > 0) {
        const firstSetName = Object.keys(newQuestionSets)[0];
        setSelectedSet(firstSetName);
      }
      
    } catch (error) {
      console.error("Error processing CSV files:", error);
      toast({
        title: "Import Error",
        description: "There was an error processing the CSV files. Please check the format.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      
      // Reset the input to allow uploading the same file again
      event.target.value = '';
    }
  };
  
  const handleUseSelectedSet = () => {
    if (!selectedSet || !questionSets[selectedSet]) return;
    
    onQuestionsImported(questionSets[selectedSet]);
    
    toast({
      title: "Question Set Loaded",
      description: `Loaded the "${selectedSet}" question set with ${questionSets[selectedSet].length} questions.`,
    });
  };
  
  return (
    <Card className="bg-millionaire-primary border-millionaire-accent mb-6">
      <CardHeader>
        <CardTitle className="text-millionaire-light">Import Questions from CSV</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="csv-upload" className="text-millionaire-light">
            Upload CSV Files (Column A: Question, B-E: Options, F: Correct Answer)
          </Label>
          <input
            id="csv-upload"
            type="file"
            accept=".csv"
            multiple
            onChange={handleFileUpload}
            className="w-full p-2 border rounded bg-millionaire-secondary text-millionaire-light"
          />
          <p className="text-xs text-gray-400">
            You can upload multiple CSV files at once, each containing a set of 15 questions.
          </p>
        </div>
        
        {Object.keys(questionSets).length > 0 && (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="question-set" className="text-millionaire-light">
                Select Question Set
              </Label>
              <Select
                value={selectedSet || ''}
                onValueChange={setSelectedSet}
              >
                <SelectTrigger className="w-full bg-millionaire-secondary">
                  <SelectValue placeholder="Select a question set" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(questionSets).map((setName) => (
                    <SelectItem key={setName} value={setName}>
                      {setName} ({questionSets[setName].length} questions)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button
              onClick={handleUseSelectedSet}
              disabled={!selectedSet || isLoading}
              className="w-full bg-millionaire-gold hover:bg-yellow-500 text-millionaire-primary"
            >
              Use Selected Question Set
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CSVUploader;
