import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Question } from "@/utils/game/types";
import { parseCSV } from "@/utils/csvUtils";
import { toast } from "@/hooks/use-toast";
import { Upload, FileText, Download } from "lucide-react";

interface CSVUploaderProps {
  onQuestionsImported: (questions: Question[]) => void;
}

const CSVUploader: React.FC<CSVUploaderProps> = ({ onQuestionsImported }) => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    setCsvFile(file);
  };

  const handleUpload = async () => {
    if (!csvFile) {
      toast({
        title: "Error",
        description: "Please select a CSV file to upload.",
        variant: "destructive",
      });
      return;
    }

    try {
      const text = await csvFile.text();
      const questions = await parseCSV(text);
      onQuestionsImported(questions);
      toast({
        title: "Success",
        description: `${questions.length} questions imported successfully!`,
      });
    } catch (error: any) {
      console.error("Error parsing CSV:", error);
      toast({
        title: "Error",
        description: "Failed to parse CSV file. Please check the format.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadSampleCSV = () => {
    const csvContent =
      "text,options,correctOptionIndex,value,category,difficulty,explanation\n" +
      "What is the capital of France?,Paris;London;Berlin;Rome,0,100,Geography,easy,The capital of France is Paris.\n" +
      "Which planet is known as the Red Planet?,Mars;Venus;Jupiter;Saturn,0,200,Astronomy,medium,Mars is called the Red Planet because of its iron oxide on the surface.\n" +
      "What is the largest mammal in the world?,Blue Whale;African Elephant;Giraffe;Polar Bear,0,300,Biology,hard,The Blue Whale is the largest mammal on Earth.";

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_questions.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast({
      title: "Sample CSV Downloaded",
      description: "A sample CSV file has been downloaded to help you format your questions.",
    });
  };

  const handleOpenFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="flex flex-col space-y-4 w-full">
      <div className="flex flex-col space-y-2">
        <Label htmlFor="csv-upload">
          Upload CSV File
        </Label>
        <div className="flex items-center space-x-2">
          <Input
            id="csv-upload"
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
            ref={fileInputRef}
          />
          <Button variant="secondary" onClick={handleOpenFileDialog}>
            <Upload className="mr-2 h-4 w-4" />
            Choose File
          </Button>
          {csvFile && (
            <span className="text-sm text-gray-500">
              {csvFile.name}
            </span>
          )}
        </div>
      </div>
      <div className="flex space-x-2">
        <Button className="bg-green-500 hover:bg-green-700 text-white" onClick={handleUpload} disabled={!csvFile}>
          <FileText className="mr-2 h-4 w-4" />
          Import Questions
        </Button>
        <Button variant="outline" onClick={handleDownloadSampleCSV}>
          <Download className="mr-2 h-4 w-4" />
          Download Sample CSV
        </Button>
      </div>
    </div>
  );
};

export default CSVUploader;
