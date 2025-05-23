
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { parseQuestionsFromCSV } from '@/utils/csvUtils';
import { Question } from '@/utils/gameUtils';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { FileText, Upload } from 'lucide-react';
import { Progress } from './ui/progress';

interface CSVUploaderProps {
  onQuestionsImported: (questions: Question[]) => void;
}

const CSVUploader = ({ onQuestionsImported }: CSVUploaderProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [questionSets, setQuestionSets] = useState<{[key: string]: Question[]}>({});
  const [selectedSet, setSelectedSet] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState("");
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    setIsLoading(true);
    setUploadProgress(0);
    
    try {
      const newQuestionSets: {[key: string]: Question[]} = { ...questionSets };
      let loadedSetsCount = 0;
      let totalErrors = 0;
      
      // Process files sequentially to provide better progress indication
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = file.name.replace('.csv', '');
        setProcessingMessage(`Processing ${fileName} (${i+1}/${files.length})`);
        
        // Update progress
        setUploadProgress(Math.round((i / files.length) * 100));
        
        const fileContent = await file.text();
        const questions = parseQuestionsFromCSV(fileContent);
        
        // Only add the set if it has questions
        if (questions.length > 0) {
          newQuestionSets[fileName] = questions;
          loadedSetsCount++;
          
          // Log success details
          console.log(`Successfully loaded "${fileName}" with ${questions.length} questions`);
        } else {
          totalErrors++;
          console.error(`Failed to extract any questions from ${fileName}`);
        }
      }
      
      setQuestionSets(newQuestionSets);
      setUploadProgress(100);
      
      // Show appropriate toast based on results
      if (loadedSetsCount > 0) {
        toast({
          title: "CSV Import Complete",
          description: `Successfully loaded ${loadedSetsCount} question sets.${totalErrors > 0 ? ` (${totalErrors} files had errors)` : ''}`,
        });
        
        // If this is the first upload, select the first set
        if (Object.keys(questionSets).length === 0 && loadedSetsCount > 0) {
          const firstSetName = Object.keys(newQuestionSets)[0];
          setSelectedSet(firstSetName);
        }
      } else {
        toast({
          title: "CSV Import Failed",
          description: "Could not extract any questions from the uploaded files. Check the format.",
          variant: "destructive",
        });
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
      setProcessingMessage("");
      
      // Reset the input to allow uploading the same file again
      event.target.value = '';
    }
  };
  
  const handleUseSelectedSet = () => {
    if (!selectedSet || !questionSets[selectedSet]) return;
    
    const selectedQuestions = questionSets[selectedSet];
    
    // Verify set has questions before importing
    if (selectedQuestions.length === 0) {
      toast({
        title: "Empty Question Set",
        description: "The selected question set doesn't contain any questions.",
        variant: "destructive",
      });
      return;
    }
    
    onQuestionsImported(selectedQuestions);
    
    toast({
      title: "Question Set Loaded",
      description: `Loaded the "${selectedSet}" question set with ${selectedQuestions.length} questions.`,
    });
  };
  
  return (
    <Card className="bg-millionaire-primary border-millionaire-accent mb-6">
      <CardHeader>
        <CardTitle className="text-millionaire-light flex items-center gap-2">
          <FileText className="h-6 w-6" /> Import Questions from CSV
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="csv-upload" className="text-millionaire-light">
            Upload CSV Files (Column A: Question, B-E: Options, F: Correct Answer as A/B/C/D or full text)
          </Label>
          <div className="border-2 border-dashed border-millionaire-accent rounded-lg p-4 text-center">
            <input
              id="csv-upload"
              type="file"
              accept=".csv"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              disabled={isLoading}
            />
            <label 
              htmlFor="csv-upload" 
              className="cursor-pointer flex flex-col items-center justify-center space-y-2"
            >
              <Upload className="h-8 w-8 text-millionaire-light" />
              <span className="text-millionaire-light">
                {isLoading ? 'Uploading...' : 'Click to upload CSV files'}
              </span>
              <span className="text-xs text-gray-400">
                You can upload multiple CSV files at once, each containing a set of 15 questions.
              </span>
            </label>
          </div>
          
          {isLoading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="h-2 w-full" />
              <p className="text-xs text-millionaire-light text-center">{processingMessage}</p>
            </div>
          )}
        </div>
        
        {Object.keys(questionSets).length > 0 && (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="question-set" className="text-millionaire-light">
                Select Question Set ({Object.keys(questionSets).length} sets available)
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
