
import { Question } from "./gameUtils";

/**
 * Parse CSV data into Question objects
 * Expected format:
 * - Column A: Question text
 * - Columns B-E: Options (4 options)
 * - Column F: Correct answer (should match one of the options)
 */
export const parseQuestionsFromCSV = (csvContent: string): Question[] => {
  // Split the CSV content into rows
  const rows = csvContent.split(/\r\n|\n/).filter(row => row.trim() !== '');
  
  // Skip header row if it exists
  const startRow = rows[0].toLowerCase().includes('question') || 
                  rows[0].toLowerCase().includes('option') ? 1 : 0;
  
  const parsedQuestions: Question[] = [];
  
  // Process each row to extract question data
  for (let i = startRow; i < rows.length; i++) {
    const columns = parseCSVRow(rows[i]);
    
    // Ensure we have all required columns
    if (columns.length < 6) continue;
    
    const questionText = columns[0].trim();
    const options = [
      columns[1].trim(),
      columns[2].trim(),
      columns[3].trim(),
      columns[4].trim()
    ];
    
    // Find the correct option index based on the value in column F
    const correctAnswerText = columns[5].trim();
    const correctOptionIndex = options.findIndex(
      option => option.toLowerCase() === correctAnswerText.toLowerCase()
    );
    
    // If we couldn't match the correct answer to an option, skip this row
    if (correctOptionIndex === -1) {
      console.error(`Could not find the correct option "${correctAnswerText}" for question "${questionText}"`);
      continue;
    }
    
    // Determine difficulty and value based on the question number in the set
    // We'll distribute difficulties evenly across the 15 questions in a set
    const questionPositionInSet = (parsedQuestions.length % 15) + 1;
    let difficulty: 'easy' | 'medium' | 'hard';
    let value: number;
    
    if (questionPositionInSet <= 5) {
      difficulty = 'easy';
      value = [100, 200, 300, 500, 1000][questionPositionInSet - 1];
    } else if (questionPositionInSet <= 10) {
      difficulty = 'medium';
      const mediumIndex = questionPositionInSet - 6;
      value = [2000, 4000, 8000, 16000, 32000][mediumIndex];
    } else {
      difficulty = 'hard';
      const hardIndex = questionPositionInSet - 11;
      value = [64000, 125000, 250000, 500000, 1000000][hardIndex];
    }
    
    parsedQuestions.push({
      id: `q${Date.now()}-${parsedQuestions.length}`,
      text: questionText,
      options,
      correctOptionIndex,
      value,
      difficulty
    });
  }
  
  return parsedQuestions;
};

/**
 * Parse a CSV row into columns, handling cases where text is quoted
 */
function parseCSVRow(row: string): string[] {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last column
  result.push(current);
  return result;
}
