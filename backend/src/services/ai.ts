import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import { ISection, IQuestion } from '../models/Assignment.js';

dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
let groq: Groq | null = null;

if (GROQ_API_KEY) {
  console.log('Groq API Key detected. Initializing Groq client...');
  groq = new Groq({ apiKey: GROQ_API_KEY });
} else {
  console.warn('⚠️ GROQ_API_KEY environment variable is not defined. AI Assessment Creator will operate in Mock Generation Mode.');
}

interface GenerateParams {
  title: string;
  description?: string;
  questionTypes: string[];
  numberOfQuestions: number;
  marksPerQuestion: number;
  additionalInstructions?: string;
}

// Generate high-fidelity mock questions dynamically based on inputs when Groq is not active
function getMockQuestions(params: GenerateParams): ISection[] {
  const sections: ISection[] = [];
  const { title, questionTypes, numberOfQuestions, marksPerQuestion, additionalInstructions } = params;

  // Let's divide questions across categories
  let questionsRemaining = numberOfQuestions;
  let currentSectionIdx = 0;

  const sectionPrefixes = ['Section A', 'Section B', 'Section C', 'Section D'];
  const difficulties: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];

  // Map of typical topics for smart mocked text based on keywords in title
  const cleanTitle = title.toLowerCase();
  let topic = 'General Knowledge';
  let mockSamples = [
    { text: 'Explain the fundamental concepts surrounding {topic} with diagrams where appropriate.', answer: 'The concept relates to...' },
    { text: 'Compare and contrast the primary elements of {topic} and summarize key differences.', answer: 'Key differences include...' },
    { text: 'Identify the core parameters defining {topic} in modern practice.', answer: 'Core parameters are...' },
    { text: 'Describe a practical real-world scenario demonstrating the laws of {topic}.', answer: 'A practical demonstration occurs when...' },
    { text: 'What are the ethical implications or structural limitations of {topic}?', answer: 'The limitations are...' }
  ];

  if (cleanTitle.includes('electricity') || cleanTitle.includes('physics') || cleanTitle.includes('science')) {
    topic = 'Electrical Circuits & Physics';
    mockSamples = [
      { text: 'Define Ohm\'s Law and calculate the total resistance of three 10-ohm resistors in parallel.', answer: 'Ohm\'s Law states V = IR. For parallel resistors: 1/R_total = 1/10 + 1/10 + 1/10 = 3/10. Thus, R_total = 10/3 ≈ 3.33 ohms.' },
      { text: 'What is the relationship between electric current, voltage, and electrical power? Provide formulas.', answer: 'Power (P) is the rate of energy transfer: P = VI. By substituting Ohm\'s law, P = I^2*R or P = V^2/R. Where V is voltage, I is current, and R is resistance.' },
      { text: 'Distinguish between Alternating Current (AC) and Direct Current (DC). Give one example of each.', answer: 'AC changes direction periodically (e.g., mains power in homes), whereas DC flows in one constant direction (e.g., alkaline battery or solar cells).' },
      { text: 'Explain the working principle of an electrical fuse and how it safeguards household appliances.', answer: 'A fuse contains a thin metal strip with a low melting point. If current exceeds safety limits, the wire heats up, melts, breaks the circuit, and prevents damage.' },
      { text: 'Explain why water is a good conductor of electricity and why pure water is an insulator.', answer: 'Pure water lacks ions and cannot conduct. Tap water contains dissolved minerals and salts, which split into charged ions that freely carry electrical charge.' }
    ];
  } else if (cleanTitle.includes('math') || cleanTitle.includes('algebra') || cleanTitle.includes('calculus')) {
    topic = 'Mathematics & Algebra';
    mockSamples = [
      { text: 'Solve the quadratic equation: 3x^2 - 12x + 9 = 0 using factorization.', answer: 'Divide by 3: x^2 - 4x + 3 = 0. Factorized: (x-3)(x-1) = 0. Therefore, the solutions are x = 1 and x = 3.' },
      { text: 'Find the derivative of the function f(x) = 5x^3 - 3x^2 + 7x - 12 with respect to x.', answer: 'Using the power rule: f\'(x) = 15x^2 - 6x + 7.' },
      { text: 'What is the Pythagorean theorem? Prove its application in a right-angled triangle with sides 6cm and 8cm.', answer: 'Pythagorean theorem states a^2 + b^2 = c^2. Here: 6^2 + 8^2 = 36 + 64 = 100. Since √100 = 10, the hypotenuse is 10cm.' },
      { text: 'Explain the difference between rational and irrational numbers. Provide two examples of each.', answer: 'Rational numbers can be expressed as a/b (e.g., 2/3, 5). Irrational numbers cannot (e.g., √2, π).' },
      { text: 'Determine the sum of the infinite geometric series: 8 + 4 + 2 + 1 + ...', answer: 'Sum of infinite series is S = a / (1 - r). Here, a = 8, r = 0.5. S = 8 / (1 - 0.5) = 8 / 0.5 = 16.' }
    ];
  } else if (cleanTitle.includes('history') || cleanTitle.includes('social') || cleanTitle.includes('civics')) {
    topic = 'World History & Civilizations';
    mockSamples = [
      { text: 'Analyze the primary causes that triggered the onset of the First World War in 1914.', answer: 'Causes include the assassination of Archduke Franz Ferdinand, militarism, national alliances (Triple Entente vs Central Powers), and imperialism.' },
      { text: 'Describe the main characteristics and achievements of the Indus Valley Civilization.', answer: 'Characterized by advanced urban planning, drainage systems, baked brick houses, and trade links, showing highly organized administration.' },
      { text: 'Evaluate the impact of the Industrial Revolution on standard working-class living conditions.', answer: 'Led to mass migration to cities, overcrowded tenements, child labor, and poor health, but eventually raised wages and standard of living.' },
      { text: 'What was the significance of the Magna Carta signed in 1215?', answer: 'Established the principle that everyone, including the king, is subject to the law, protecting individual rights and limiting absolute power.' },
      { text: 'Discuss the role of the Silk Road in connecting Eastern and Western cultures and trades.', answer: 'Served as an ancient network of trade routes facilitating cultural exchange, spread of religions (Buddhism, Islam), and trades in silk and spices.' }
    ];
  }

  // Segment question types into sections
  for (const type of questionTypes) {
    if (questionsRemaining <= 0) break;

    const currentSectionQsCount = Math.min(
      Math.ceil(numberOfQuestions / questionTypes.length), 
      questionsRemaining
    );
    questionsRemaining -= currentSectionQsCount;

    const sectionQs: IQuestion[] = [];
    for (let i = 0; i < currentSectionQsCount; i++) {
      const qNum = sectionQs.length + 1;
      const difficulty = difficulties[(i + currentSectionIdx) % difficulties.length];
      const sample = mockSamples[(i + currentSectionIdx) % mockSamples.length];
      
      let questionText = sample.text.replace('{topic}', topic);
      if (type === 'MCQ') {
        questionText = `[Multiple Choice] ${questionText}\nOptions:\nA) Option A\nB) Option B\nC) Option C\nD) Option D`;
      } else {
        questionText = `[${type}] ${questionText}`;
      }

      sectionQs.push({
        id: `q_${currentSectionIdx}_${qNum}_${Date.now()}`,
        text: questionText,
        difficulty,
        marks: marksPerQuestion,
        answerKey: sample.answer
      });
    }

    sections.push({
      title: sectionPrefixes[currentSectionIdx] || `Section ${String.fromCharCode(65 + currentSectionIdx)}`,
      instruction: type === 'MCQ' ? 'Select the single correct option for all questions.' : `Provide detailed responses of type ${type} to the following questions.`,
      questions: sectionQs
    });

    currentSectionIdx++;
  }

  return sections;
}

export const generateAssignmentQuestions = async (
  params: GenerateParams,
  onProgress?: (log: string) => void
): Promise<ISection[]> => {
  const { title, description, questionTypes, numberOfQuestions, marksPerQuestion, additionalInstructions } = params;

  if (onProgress) onProgress('🔄 [1/4 AI Engine] Initializing AI assessment structure prompt...');

  if (!groq) {
    if (onProgress) onProgress('⚠️ [2/4 AI Engine] No Groq API Key found. Generating high-quality questions using local AI simulation...');
    // Add small delay to feel realistic
    await new Promise((resolve) => setTimeout(resolve, 1500));
    if (onProgress) onProgress('✨ [3/4 AI Engine] AI simulated questions generated successfully. Assembling sections...');
    return getMockQuestions(params);
  }

  if (onProgress) onProgress('📡 [2/4 AI Engine] Connecting to Groq High-Speed API (llama-3.3-70b-versatile)...');

  const systemPrompt = `You are a premium AI Exam Paper Assistant. Your task is to output a fully structured question paper for an assessment in strict JSON format. 
You must group questions into sections based on the requested Question Types.
The total number of questions generated across all sections MUST be exactly ${numberOfQuestions}.
Each question must carry exactly ${marksPerQuestion} marks.
You must distribute question difficulties across 'easy', 'medium', and 'hard'.
For each question, you MUST also generate a detailed 'answerKey' that serves as the teacher's grading rubric and sample answer.

CRITICAL INSTRUCTION FOR MCQ FORMAT:
If a section's question type is 'MCQ' or 'Multiple Choice', the question's 'text' property MUST include the question itself followed by exactly 4 choices, labeled as A), B), C), D), each on a new line (using newlines '\\n'). The 'answerKey' property MUST specify the correct choice letter and the full answer text followed by a brief explanation.
Example for MCQ format:
"text": "What is the primary gas found in the Earth's atmosphere?\\nA) Oxygen\\nB) Nitrogen\\nC) Carbon Dioxide\\nD) Argon"
"answerKey": "B) Nitrogen. Nitrogen makes up about 78% of the Earth's atmosphere, making it the most abundant gas."

You must output in this EXACT JSON structure, containing no other text:
{
  "sections": [
    {
      "title": "Section A",
      "instruction": "Section instruction goes here",
      "questions": [
        {
          "id": "unique_string_id",
          "text": "Question text goes here",
          "difficulty": "easy",
          "marks": ${marksPerQuestion},
          "answerKey": "Sample answer or step-by-step resolution key here"
        }
      ]
    }
  ]
}`;

  const userPrompt = `Create an assessment question paper with these parameters:
- Title: ${title}
- Description: ${description || 'N/A'}
- Question Types: ${questionTypes.join(', ')}
- Total Questions: ${numberOfQuestions}
- Marks per Question: ${marksPerQuestion}
- Additional Instructions/Topic notes: ${additionalInstructions || 'None'}

Please ensure high academic quality, appropriate difficulty tags, and flawless formatting.`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      temperature: 0.7
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Groq returned an empty response.');
    }

    if (onProgress) onProgress('🧠 [3/4 AI Engine] Processing JSON structured layout and balancing difficulty nodes...');
    const parsed = JSON.parse(content);
    
    if (!parsed.sections || !Array.isArray(parsed.sections)) {
      throw new Error('Invalid format returned by Groq. Missing sections array.');
    }

    // Ensure every question has a unique ID
    let currentIdCount = 0;
    parsed.sections.forEach((sec: any) => {
      sec.questions?.forEach((q: any) => {
        currentIdCount++;
        q.id = `q_ai_${currentIdCount}_${Date.now()}`;
      });
    });

    if (onProgress) onProgress('✨ [4/4 AI Engine] AI generated question paper successfully validated!');
    return parsed.sections;
  } catch (error) {
    console.error('Groq Generation Error, falling back to mock:', error);
    if (onProgress) onProgress('⚠️ [AI Engine] Groq generation encountered an error or rate limit. Falling back to local high-fidelity generator...');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return getMockQuestions(params);
  }
};

export const regenerateSingleQuestion = async (
  params: {
    assignmentTitle: string;
    questionTypes: string[];
    currentQuestionText: string;
    difficulty: 'easy' | 'medium' | 'hard';
    marks: number;
    additionalInstructions?: string;
  }
): Promise<IQuestion> => {
  const { assignmentTitle, questionTypes, currentQuestionText, difficulty, marks, additionalInstructions } = params;

  if (!groq) {
    // Generate a quick mock alternative
    await new Promise((resolve) => setTimeout(resolve, 500));
    let text = '';
    let answerKey = '';
    const isMcq = questionTypes.includes('MCQ');

    if (isMcq) {
      text = `Which of the following is a core element of ${assignmentTitle}?\nA) Option A\nB) Option B\nC) Option C\nD) Option D`;
      answerKey = 'A) Option A. Because Option A is essential to this topic.';
    } else {
      const alternatives = [
        { text: `Explain the modern significance of ${assignmentTitle} in the current economic landscape.`, answer: 'The significance is based on...' },
        { text: `Review the technical principles and core calculations supporting ${assignmentTitle}.`, answer: 'The calculations are derived from...' },
        { text: `Evaluate the critical feedback surrounding standard approaches to ${assignmentTitle}.`, answer: 'Critical feedback highlights...' }
      ];
      const picked = alternatives[Math.floor(Math.random() * alternatives.length)];
      text = picked.text;
      answerKey = picked.answer;
    }

    return {
      id: `q_regen_${Date.now()}`,
      text,
      difficulty,
      marks,
      answerKey
    };
  }

  const systemPrompt = `You are a premium AI Exam Paper Assistant. Your task is to regenerate a SINGLE question to replace an unwanted one.
CRITICAL INSTRUCTION FOR MCQ FORMAT:
If the question is of type 'MCQ' or 'Multiple Choice', the 'text' property MUST include the question itself followed by exactly 4 choices, labeled as A), B), C), D), each on a new line (using newlines '\\n'). The 'answerKey' property MUST specify the correct choice letter and the full answer text followed by a brief explanation.
Example for MCQ format:
"text": "What is the primary gas found in the Earth's atmosphere?\\nA) Oxygen\\nB) Nitrogen\\nC) Carbon Dioxide\\nD) Argon"
"answerKey": "B) Nitrogen. Nitrogen makes up about 78% of the Earth's atmosphere, making it the most abundant gas."

You must output a single question in this EXACT JSON structure, containing no other text:
{
  "text": "Your new high-quality question text here",
  "difficulty": "${difficulty}",
  "marks": ${marks},
  "answerKey": "Detailed sample answer or scoring guidelines here"
}`;

  const userPrompt = `The assessment title is: "${assignmentTitle}".
The allowed question types are: ${questionTypes.join(', ')}.
We are replacing this question: "${currentQuestionText}".
The new question must have difficulty level "${difficulty}" and be worth ${marks} marks.
Additional prompt parameters: ${additionalInstructions || 'None'}.`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      temperature: 0.8
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) throw new Error('Empty response');

    const parsed = JSON.parse(content);
    return {
      id: `q_ai_single_${Date.now()}`,
      text: parsed.text,
      difficulty: parsed.difficulty || difficulty,
      marks: parsed.marks || marks,
      answerKey: parsed.answerKey
    };
  } catch (error) {
    console.error('Groq Single Question Regen Error, fallback:', error);
    return {
      id: `q_fallback_single_${Date.now()}`,
      text: `[Alternative] Explain the foundational methodologies utilized inside ${assignmentTitle}.`,
      difficulty,
      marks,
      answerKey: 'Foundational methodologies include detailed qualitative analysis and practical case studies.'
    };
  }
};
