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
import { ScrollArea } from "@/components/ui/scroll-area";
import * as XLSX from 'xlsx';

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
        // Extract filename without extension for both .csv and .xlsx files
        const fileName = file.name.replace(/\.(csv|xlsx?)$/i, '');
        setProcessingMessage(`Processing ${fileName} (${i+1}/${files.length})`);
        
        // Update progress
        setUploadProgress(Math.round((i / files.length) * 100));
        
        try {
          // Check if we're dealing with an Excel file
          if (file.name.match(/\.xlsx?$/i)) {
            // For Excel files, we need to convert to CSV first
            const fileContent = await convertExcelToCSV(file);
            const questions = parseQuestionsFromCSV(fileContent);

            if (questions.length > 0) {
              newQuestionSets[fileName] = questions;
              loadedSetsCount++;
              console.log(`Successfully loaded Excel file "${fileName}" with ${questions.length} questions`);
            } else {
              totalErrors++;
              console.error(`Failed to extract any questions from Excel file ${fileName}`);
            }
          } else {
            // For CSV files, read as UTF-8 to handle Hindi and Gujarati characters
            const fileContent = await readFileAsText(file);
            const questions = parseQuestionsFromCSV(fileContent);

            if (questions.length > 0) {
              newQuestionSets[fileName] = questions;
              loadedSetsCount++;
              console.log(`Successfully loaded "${fileName}" with ${questions.length} questions`);
            } else {
              totalErrors++;
              console.error(`Failed to extract any questions from ${fileName}`);
            }
          }
        } catch (err) {
          totalErrors++;
          console.error(`Error processing file ${file.name}:`, err);
        }
      }
      
      setQuestionSets(newQuestionSets);
      setUploadProgress(100);
      
      // Show appropriate toast based on results
      if (loadedSetsCount > 0) {
        toast({
          title: "File Import Complete",
          description: `Successfully loaded ${loadedSetsCount} question sets.${totalErrors > 0 ? ` (${totalErrors} files had errors)` : ''}`,
        });
        
        // If this is the first upload, select the first set
        if (Object.keys(questionSets).length === 0 && loadedSetsCount > 0) {
          const firstSetName = Object.keys(newQuestionSets)[0];
          setSelectedSet(firstSetName);
        }
      } else {
        toast({
          title: "Import Failed",
          description: "Could not extract any questions from the uploaded files. Check the format.",
          variant: "destructive",
        });
      }
      
    } catch (error) {
      console.error("Error processing files:", error);
      toast({
        title: "Import Error",
        description: "There was an error processing the files. Please check the format.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setProcessingMessage("");
      
      // Reset the input to allow uploading the same file again
      event.target.value = '';
    }
  };
  
  // Helper function to convert Excel to CSV format
  const convertExcelToCSV = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          if (!e.target?.result) {
            reject(new Error("Failed to read Excel file"));
            return;
          }
          
          const data = new Uint8Array(e.target.result as ArrayBuffer);
          // Use SheetJS to parse Excel file
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get first worksheet
          const worksheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[worksheetName];
          
          // Convert to CSV
          const csvContent = XLSX.utils.sheet_to_csv(worksheet);
          resolve(csvContent);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Error reading Excel file"));
      reader.readAsArrayBuffer(file);
    });
  };
  
  // Helper function to read file as text with UTF-8 encoding
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error("Failed to read file content"));
        }
      };
      reader.onerror = () => reject(new Error("Error reading file"));
      // Use readAsText with UTF-8 encoding to properly handle Hindi/Gujarati text
      reader.readAsText(file, 'UTF-8');
    });
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
          <FileText className="h-6 w-6" /> Import Questions from File
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="file-upload" className="text-millionaire-light">
            Upload CSV or Excel Files (Column A: Question, B-E: Options, F: Correct Answer as A/B/C/D or full text)
          </Label>
          <div className="border-2 border-dashed border-millionaire-accent rounded-lg p-4 text-center">
            <input
              id="file-upload"
              type="file"
              accept=".csv,.xlsx,.xls"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              disabled={isLoading}
            />
            <label 
              htmlFor="file-upload" 
              className="cursor-pointer flex flex-col items-center justify-center space-y-2"
            >
              <Upload className="h-8 w-8 text-millionaire-light" />
              <span className="text-millionaire-light">
                {isLoading ? 'Uploading...' : 'Click to upload CSV or Excel files'}
              </span>
              <span className="text-xs text-gray-400">
                You can upload multiple files at once, each containing a set of 15 questions.
                <br />Supports .csv, .xls, .xlsx formats and Unicode text (Hindi/Gujarati).
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
              <ScrollArea className="max-h-40">
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
              </ScrollArea>
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
