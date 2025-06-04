
import { parse } from 'papaparse';
import { Question } from './game/types';
import { v4 as uuidv4 } from 'uuid';

export const parseCSV = async (csvText: string): Promise<Question[]> => {
  return new Promise((resolve, reject) => {
    parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transform: (value: string, field: string) => {
        // Trim whitespace from all values
        return value.trim();
      },
      complete: (results) => {
        try {
          const questions: Question[] = results.data.map((row: any, index: number) => {
            if (!row.text || !row.options) {
              throw new Error(`Missing required fields in row ${index + 1}`);
            }

            const options = row.options.split(';').map((opt: string) => opt.trim());
            if (options.length < 2) {
              throw new Error(`At least 2 options required in row ${index + 1}`);
            }

            const correctIndex = parseInt(row.correctOptionIndex);
            if (isNaN(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
              throw new Error(`Invalid correct option index in row ${index + 1}`);
            }

            return {
              id: uuidv4(),
              text: row.text,
              options,
              correctOptionIndex: correctIndex,
              value: parseInt(row.value) || 100,
              category: row.category || '',
              difficulty: (row.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
              explanation: row.explanation || ''
            };
          });

          resolve(questions);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      }
    });
  });
};
