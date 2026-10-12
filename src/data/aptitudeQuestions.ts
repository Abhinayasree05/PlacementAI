// data/aptitudeQuestions.ts
// Static question bank for the Aptitude Agent. Each topic has a real set of
// questions with 4 options and the index of the correct answer.

export interface AptitudeQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export type AptitudeTopic =
  | "Quantitative"
  | "Logical Reasoning"
  | "Verbal Ability"
  | "Data Interpretation"
  | "Number Series"
  | "Puzzles";

export const APTITUDE_TOPICS: AptitudeTopic[] = [
  "Quantitative",
  "Logical Reasoning",
  "Verbal Ability",
  "Data Interpretation",
  "Number Series",
  "Puzzles",
];

export const APTITUDE_QUESTIONS: Record<AptitudeTopic, AptitudeQuestion[]> = {
  Quantitative: [
    { id: "q1", question: "A train 150m long is running at 60 km/hr. How long does it take to cross a platform 250m long?", options: ["16 sec", "20 sec", "24 sec", "28 sec"], correctIndex: 2 },
    { id: "q2", question: "If the cost price of 20 articles equals the selling price of 16 articles, what is the profit percent?", options: ["20%", "25%", "30%", "16.67%"], correctIndex: 1 },
    { id: "q3", question: "What is the compound interest on ₹5000 at 10% per annum for 2 years?", options: ["₹1000", "₹1050", "₹1100", "₹1150"], correctIndex: 1 },
    { id: "q4", question: "The average of 5 consecutive numbers is 30. What is the largest number?", options: ["30", "31", "32", "33"], correctIndex: 2 },
    { id: "q5", question: "A can complete a task in 12 days and B in 18 days. Working together, how many days will they take?", options: ["6.4 days", "7.2 days", "8 days", "9 days"], correctIndex: 1 },
    { id: "q6", question: "What is 15% of 240?", options: ["32", "36", "40", "42"], correctIndex: 1 },
  ],
  "Logical Reasoning": [
    { id: "l1", question: "Find the odd one out: Apple, Banana, Carrot, Mango", options: ["Apple", "Banana", "Carrot", "Mango"], correctIndex: 2 },
    { id: "l2", question: "If CAT is coded as 3120, how is DOG coded in the same pattern?", options: ["4157", "4715", "4157", "4257"], correctIndex: 0 },
    { id: "l3", question: "Pointing to a photo, Ravi said, 'She is the daughter of my grandfather's only son.' Who is she to Ravi?", options: ["Mother", "Sister", "Aunt", "Cousin"], correctIndex: 1 },
    { id: "l4", question: "Complete the series: 2, 6, 12, 20, 30, ?", options: ["36", "40", "42", "48"], correctIndex: 2 },
    { id: "l5", question: "All roses are flowers. Some flowers fade quickly. Which conclusion follows?", options: ["All roses fade quickly", "Some roses may fade quickly", "No roses fade quickly", "All flowers are roses"], correctIndex: 1 },
    { id: "l6", question: "If 'A + B' means A is the mother of B, what does 'A + B - C' most likely need to conclude 'C is grandchild of A'?", options: ["'-' means father of", "'-' means sister of", "'-' means son/daughter of", "Cannot be determined"], correctIndex: 2 },
  ],
  "Verbal Ability": [
    { id: "v1", question: "Choose the synonym of 'Meticulous'", options: ["Careless", "Precise", "Lazy", "Fast"], correctIndex: 1 },
    { id: "v2", question: "Choose the antonym of 'Benevolent'", options: ["Kind", "Generous", "Malevolent", "Charitable"], correctIndex: 2 },
    { id: "v3", question: "Fill in the blank: She has been working here ___ 2019.", options: ["for", "since", "from", "at"], correctIndex: 1 },
    { id: "v4", question: "Identify the correctly spelled word.", options: ["Occassion", "Occasion", "Ocassion", "Ocasion"], correctIndex: 1 },
    { id: "v5", question: "Choose the correct passive voice: 'She writes a letter.'", options: ["A letter was written by her.", "A letter is written by her.", "A letter is being written by her.", "A letter has written by her."], correctIndex: 1 },
    { id: "v6", question: "Choose the word that best completes: The manager was ___ by the sudden resignation.", options: ["blindsided", "prepared", "informed", "notified"], correctIndex: 0 },
  ],
  "Data Interpretation": [
    { id: "d1", question: "If a pie chart shows Engineering at 40%, Arts at 25%, Commerce at 20%, and Others at 15% of 800 students, how many study Engineering?", options: ["280", "300", "320", "360"], correctIndex: 2 },
    { id: "d2", question: "A bar graph shows sales of 100, 150, 120, 180 units over 4 months. What is the average monthly sale?", options: ["135", "137.5", "140", "145"], correctIndex: 1 },
    { id: "d3", question: "In a table, Company A's revenue grew from ₹50L to ₹65L. What is the percentage growth?", options: ["20%", "25%", "30%", "15%"], correctIndex: 2 },
    { id: "d4", question: "A line graph shows temperature rising from 20°C to 35°C over 5 hours. What is the average rate of increase per hour?", options: ["2°C", "3°C", "4°C", "5°C"], correctIndex: 1 },
    { id: "d5", question: "If a table shows a product's stock decreasing from 500 to 320 units, what percentage of stock was sold?", options: ["30%", "34%", "36%", "40%"], correctIndex: 2 },
  ],
  "Number Series": [
    { id: "n1", question: "Find the next number: 1, 4, 9, 16, 25, ?", options: ["30", "36", "42", "49"], correctIndex: 1 },
    { id: "n2", question: "Find the next number: 3, 6, 12, 24, 48, ?", options: ["72", "84", "96", "108"], correctIndex: 2 },
    { id: "n3", question: "Find the missing number: 7, 14, 28, ?, 112", options: ["42", "49", "56", "63"], correctIndex: 2 },
    { id: "n4", question: "Find the next number: 2, 5, 10, 17, 26, ?", options: ["35", "37", "39", "41"], correctIndex: 1 },
    { id: "n5", question: "Find the next number: 100, 81, 64, 49, ?", options: ["36", "38", "40", "42"], correctIndex: 0 },
  ],
  Puzzles: [
    { id: "p1", question: "Five friends sit in a row. A is left of B, C is right of B, D is left of A, E is at an end. Who is at the other end?", options: ["A", "B", "C", "Cannot be determined"], correctIndex: 2 },
    { id: "p2", question: "A man has 6 sons. Each son has one sister. How many children does the man have?", options: ["6", "7", "12", "13"], correctIndex: 1 },
    { id: "p3", question: "If today is Wednesday, what day will it be 100 days from now?", options: ["Monday", "Tuesday", "Thursday", "Friday"], correctIndex: 2 },
    { id: "p4", question: "A clock shows 3:15. What is the angle between the hour and minute hands?", options: ["0°", "7.5°", "15°", "30°"], correctIndex: 1 },
    { id: "p5", question: "Three boxes are labeled Apples, Oranges, and Mixed — but all labels are wrong. You pick one fruit from the 'Mixed' box and get an apple. What is in the 'Mixed' box?", options: ["Apples", "Oranges", "Mixed", "Cannot be determined"], correctIndex: 0 },
  ],
};
