
import { useState, useEffect } from "react";

export const useQuizConfig = () => {
  const [logo, setLogo] = useState<string>("/lovable-uploads/2eddc572-47b4-4a7f-9677-0df901c20273.png");
  const [numberOfQuestions, setNumberOfQuestions] = useState<number>(15);
  const [showQuestionConfig, setShowQuestionConfig] = useState(false);
  const [questionConfig, setQuestionConfig] = useState<Array<{
    questionNumber: number;
    points: number;
    timeLimit: number;
  }>>([]);
  const [selectedLifelines, setSelectedLifelines] = useState<string[]>([]);
  const [numberOfTeams, setNumberOfTeams] = useState<number>(10);
  const [showTeamNames, setShowTeamNames] = useState(false);
  const [teamNames, setTeamNames] = useState<string[]>([]);
  const [samajName, setSamajName] = useState<string>("");

  useEffect(() => {
    if (numberOfQuestions > 0) {
      const config = Array.from({ length: numberOfQuestions }, (_, index) => ({
        questionNumber: index + 1,
        points: 100,
        timeLimit: 30
      }));
      setQuestionConfig(config);
    }
  }, [numberOfQuestions]);

  useEffect(() => {
    if (numberOfTeams > 0) {
      const names = Array.from({ length: numberOfTeams }, (_, index) => `Team ${index + 1}`);
      setTeamNames(names);
    }
  }, [numberOfTeams]);

  const handleNumberOfQuestionsChange = (value: string) => {
    const num = parseInt(value) || 0;
    if (num >= 0 && num <= 20) {
      setNumberOfQuestions(num);
    }
  };

  const handleQuestionConfigUpdate = (index: number, field: 'points' | 'timeLimit', value: string) => {
    const numValue = parseInt(value) || 0;
    const updatedConfig = [...questionConfig];
    updatedConfig[index] = {
      ...updatedConfig[index],
      [field]: numValue
    };
    setQuestionConfig(updatedConfig);
  };

  const handleLifelineToggle = (lifelineId: string) => {
    setSelectedLifelines(prev => 
      prev.includes(lifelineId) 
        ? prev.filter(id => id !== lifelineId)
        : [...prev, lifelineId]
    );
  };

  const handleNumberOfTeamsChange = (value: string) => {
    const num = parseInt(value) || 0;
    if (num >= 0 && num <= 30) {
      setNumberOfTeams(num);
    }
  };

  const handleTeamNameUpdate = (index: number, name: string) => {
    const updatedNames = [...teamNames];
    updatedNames[index] = name;
    setTeamNames(updatedNames);
  };

  const openQuestionConfig = () => {
    if (numberOfQuestions > 0 && numberOfQuestions <= 20) {
      setShowQuestionConfig(true);
    }
  };

  const openTeamNames = () => {
    if (numberOfTeams > 0 && numberOfTeams <= 30) {
      setShowTeamNames(true);
    }
  };

  return {
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
  };
};
