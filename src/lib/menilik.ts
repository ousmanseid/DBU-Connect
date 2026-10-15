export interface KnowledgeChunk {
  id: string;
  documentTitle: string;
  category: 'ACADEMIC' | 'DORMITORY' | 'REGISTRAR' | 'LIBRARY' | 'CONDUCT';
  section: string;
  content: string;
  keywords: string[];
}

export interface MenilikAnswer {
  question: string;
  answer: string;
  isGrounded: boolean;
  citations: Array<{
    documentTitle: string;
    section: string;
    category: string;
  }>;
  suggestedQuestions?: string[];
  disclaimer: string;
}

// Approved official Debre Berhan University policy knowledge collection
export const APPROVED_DBU_KNOWLEDGE: KnowledgeChunk[] = [
  {
    id: 'dbu-acad-001',
    documentTitle: 'Debre Berhan University Senate Legislation - Academic Policy',
    category: 'ACADEMIC',
    section: 'Article 42: Academic Standing and Grading System',
    content:
      'DBU follows a 4.0 Grade Point Average (GPA) scale: A+ and A (4.0), A- (3.75), B+ (3.5), B (3.0), B- (2.75), C+ (2.5), C (2.0), C- (1.5), D (1.0), and F (0.0). A student who scores a semester GPA below 1.75 is placed on academic warning. A student with two consecutive semesters below 1.75 or a cumulative GPA below 2.0 at graduation is subject to academic dismissal unless granted readmission by the Academic Commission.',
    keywords: ['grading', 'gpa', 'grades', 'scale', 'warning', 'dismissal', 'probation', 'score', 'fail', 'passing'],
  },
  {
    id: 'dbu-acad-002',
    documentTitle: 'Debre Berhan University Senate Legislation - Academic Policy',
    category: 'ACADEMIC',
    section: 'Article 38: Course Registration and Add/Drop Periods',
    content:
      'All students must register for courses during the official registration days designated in the university calendar. A student may add or drop courses within the first two weeks of the semester with the approval of their academic advisor and department head. Course withdrawal without penalty is permissible until the end of the 8th week of classes.',
    keywords: ['registration', 'register', 'add', 'drop', 'course', 'withdrawal', 'advisor', 'deadline', 'semester'],
  },
  {
    id: 'dbu-dorm-001',
    documentTitle: 'DBU Student Services Directorate - Housing and Dormitory Regulations',
    category: 'DORMITORY',
    section: 'Section 4: Block Access, Curfew and Room Maintenance',
    content:
      'University dormitories are open for student entry until 10:00 PM (night) on weekdays and 11:00 PM on weekends and public holidays. Students must present their official university ID card upon entry. Cooking appliances with electric coils, electric stoves, and unauthorized heaters are strictly prohibited in student dorm rooms due to electrical fire safety regulations.',
    keywords: ['dorm', 'dormitory', 'housing', 'curfew', 'bed', 'cooking', 'heater', 'stove', 'block', 'room', 'hostel'],
  },
  {
    id: 'dbu-reg-001',
    documentTitle: 'DBU Office of the Registrar - Student Clearance and Records',
    category: 'REGISTRAR',
    section: 'Procedure 7: Graduation Clearance and Official Transcript Request',
    content:
      'Graduating students must complete the official clearance process by returning all library books, dormitory keys, laboratory equipment, and paying any outstanding cafeteria fees. Official academic transcripts and original diplomas are released only after the clearance slip is verified by the Registrar and the student provides cost-sharing repayment documentation or commitment agreement.',
    keywords: ['transcript', 'graduation', 'clearance', 'diploma', 'certificate', 'cost-sharing', 'registrar', 'records'],
  },
  {
    id: 'dbu-lib-001',
    documentTitle: 'DBU Library and Documentation Center - User Guidelines',
    category: 'LIBRARY',
    section: 'Chapter 2: Borrowing Privileges and Digital Resources',
    content:
      'Undergraduate students may borrow up to 3 circulation books simultaneously for a duration of 14 days, renewable once if no hold has been placed by another student. Reference materials, periodicals, and senior project theses must be consulted within library reading rooms only. Remote access to digital databases and IEEE/Springer journals is accessible through the campus institutional proxy.',
    keywords: ['library', 'books', 'borrow', 'borrowing', 'reading', 'room', 'theses', 'thesis', 'digital', 'journal', 'ieee'],
  },
  {
    id: 'dbu-conduct-001',
    documentTitle: 'Debre Berhan University Student Code of Conduct and Disciplinary Procedures',
    category: 'CONDUCT',
    section: 'Article 19: Academic Integrity and Cheating Prohibitions',
    content:
      'Plagiarism, possession of unauthorized materials during examinations, impersonation, or copying from another student constitutes serious academic misconduct. Penalties range from an automatic "F" grade on the assessment to semester suspension or expulsion from the university following a disciplinary hearing by the Faculty Discipline Committee.',
    keywords: ['cheating', 'exam', 'plagiarism', 'conduct', 'discipline', 'misconduct', 'penalty', 'expulsion', 'integrity'],
  },
];

// Potential prompt injection patterns to neutralize
const INJECTION_PATTERNS = [
  /ignore previous instructions/i,
  /ignore all prior/i,
  /system prompt/i,
  /you are now/i,
  /reveal your secrets/i,
  /jailbreak/i,
  /bypass restrictions/i,
];

export function sanitizeQuery(input: string): string {
  let cleaned = input.trim();
  for (const pattern of INJECTION_PATTERNS) {
    cleaned = cleaned.replace(pattern, '[filtered]');
  }
  return cleaned;
}

const STOP_WORDS = new Set([
  'what', 'when', 'where', 'which', 'who', 'why', 'how', 'the', 'for', 'and',
  'with', 'from', 'about', 'this', 'that', 'have', 'has', 'are', 'is', 'was',
  'were', 'campus', 'university', 'student', 'students', 'dbu', 'make', 'making',
  'does', 'can', 'will', 'any', 'some', 'tell', 'secret', 'give', 'know',
]);

export function searchUniversityKnowledge(query: string): {
  chunks: KnowledgeChunk[];
  bestScore: number;
} {
  const sanitized = sanitizeQuery(query).toLowerCase();
  const queryTokens = sanitized
    .split(/[\s,?.!]+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));

  if (queryTokens.length === 0) {
    return { chunks: [], bestScore: 0 };
  }

  const scored = APPROVED_DBU_KNOWLEDGE.map((chunk) => {
    let score = 0;
    const contentLower = chunk.content.toLowerCase();
    const sectionLower = chunk.section.toLowerCase();

    for (const token of queryTokens) {
      if (chunk.keywords.some((kw) => kw.includes(token) || token.includes(kw))) {
        score += 5;
      }
      if (sectionLower.includes(token)) {
        score += 3;
      }
      if (contentLower.includes(token)) {
        score += 1;
      }
    }

    return { chunk, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const topMatches = scored.filter((s) => s.score >= 5);
  const bestScore = scored[0]?.score || 0;

  return {
    chunks: topMatches.map((m) => m.chunk).slice(0, 2),
    bestScore,
  };
}

export async function askMenilikAI(question: string): Promise<MenilikAnswer> {
  const sanitized = sanitizeQuery(question);
  const { chunks, bestScore } = searchUniversityKnowledge(sanitized);

  const disclaimer =
    'Menilik AI answers are grounded in official Debre Berhan University legislation and documentation. Always verify important academic decisions with your department head or registrar.';

  // If score is too low, truthfully communicate that no approved source contains the answer
  if (chunks.length === 0 || bestScore < 3) {
    return {
      question: sanitized,
      answer:
        'I could not find official policy information regarding this question in approved Debre Berhan University documents. To ensure accuracy, please consult your department office, the Registrar, or the student services desk.',
      isGrounded: false,
      citations: [],
      suggestedQuestions: [
        'What is the minimum GPA requirement to avoid academic warning?',
        'How many courses can I add or drop during the add/drop period?',
        'What are the curfew hours for the campus dormitories?',
        'How can I request my official graduation transcript and clearance?',
      ],
      disclaimer,
    };
  }

  // Synthesize answer strictly from retrieved chunks
  const primaryChunk = chunks[0];
  const secondaryChunk = chunks[1];

  let answerText = `According to official DBU policy (${primaryChunk.documentTitle}, ${primaryChunk.section}):\n\n${primaryChunk.content}`;

  if (secondaryChunk) {
    answerText += `\n\nAdditionally, ${secondaryChunk.section} provides:\n${secondaryChunk.content}`;
  }

  return {
    question: sanitized,
    answer: answerText,
    isGrounded: true,
    citations: chunks.map((c) => ({
      documentTitle: c.documentTitle,
      section: c.section,
      category: c.category,
    })),
    disclaimer,
  };
}
