// Source Scoring Module
// Calculates credibility and relevance scores for sources

export interface SourceScore {
  credibilityScore: number; // 0-100
  relevanceScore: number; // 0-100
  educationalScore: number; // 0-100
  totalScore: number; // Weighted combination
  reasons: string[];
}

// Trusted educational domains and sites
const TRUSTED_DOMAINS: Record<string, number> = {
  // Thai government educational sites
  'obec.go.th': 90,
  'moe.go.th': 90,
  'vec.go.th': 85,
  'opic.go.th': 85,
  'edu.ru.ac.th': 80,
  'satit.ku.ac.th': 80,
  'satit.su.ac.th': 80,
  'triamudom.ac.th': 80,
  'ipst.ac.th': 90,
  'openedu.go.th': 85,
  'entrustedu.go.th': 85,
  'edurepo.go.th': 85,
  
  // Academic institutions
  'ku.ac.th': 80,
  'mu.ac.th': 80,
  'cu.ac.th': 80,
  'tu.ac.th': 80,
  'au.edu': 80,
  'kmitl.ac.th': 80,
  'chula.ac.th': 85,
  'mahidol.ac.th': 85,
  'cmu.ac.th': 80,
  
  // International educational
  'britishcouncil.org': 85,
  'britishcouncil.or.th': 85,
  'khanacademy.org': 90,
  'coursera.org': 75,
  'edx.org': 80,
  
  // Educational platforms
  'thaimath.org': 75,
  'phonicsthailand.com': 70,
  
  // Video platforms (mixed credibility)
  'youtube.com': 50,
  'youtu.be': 50,
  
  // Social (lower base credibility)
  'tiktok.com': 30,
  'facebook.com': 25,
  'instagram.com': 25,
};

// Educational keywords by subject
const SUBJECT_KEYWORDS: Record<string, string[]> = {
  mathematics: [
    'คณิตศาสตร์', 'mathematics', 'math', 'การคำนวณ', 'เลข', 'ตัวเลข',
    'บวก', 'ลบ', 'คูณ', 'หาร', 'สมการ', 'เรขาคณิต', 'พีชคณิต',
    'สถิติ', 'ความน่าจะเป็น', 'แคลคูลัส', 'ฟังก์ชัน'
  ],
  science: [
    'วิทยาศาสตร์', 'science', 'ฟิสิกส์', 'เคมี', 'ชีววิทยา',
    'โลกศาสตร์', 'ดาราศาสตร์', 'ระบบสุริยะ', 'พืช', 'สัตว์',
    'การทดลอง', 'สภาพแวดล้อม', 'พลังงาน', 'แรง', 'สาร'
  ],
  thai: [
    'ภาษาไทย', 'thai language', 'อ่าน', 'เขียน', 'สะกดคำ',
    'วรรณคดี', 'นิทาน', 'กลอน', 'ฉันท์', 'โคลง', 'ลิลิต',
    'คำประพันธ์', 'วรรณศิลป์', 'ไวยากรณ์'
  ],
  english: [
    'ภาษาอังกฤษ', 'english', 'grammar', 'vocabulary', 'conversation',
    'reading', 'writing', 'listening', 'speaking', 'tenses',
    'parts of speech', 'sentence structure', 'phonics'
  ],
  social: [
    'สังคมศึกษา', 'social studies', 'ประวัติศาสตร์', 'history',
    'ภูมิศาสตร์', 'geography', 'หน้าที่พลเมือง', 'civics',
    'เศรษฐศาสตร์', 'ศาสนา', 'วัฒนธรรม', 'การเมือง'
  ],
};

// Educational structure keywords
const EDUCATIONAL_KEYWORDS = [
  'แผนการสอน', 'lesson plan',
  'หน่วยการเรียนรู้', 'learning unit',
  'ใบงาน', 'worksheet',
  'วัตถุประสงค์', 'objectives',
  'กิจกรรม', 'activities',
  'สื่อการสอน', 'teaching media',
  'การประเมิน', 'assessment',
  'การเรียนรู้', 'learning',
  'การสอน', 'teaching',
  'นักเรียน', 'students',
  'ครู', 'teacher',
  'ห้องเรียน', 'classroom',
  'หลักสูตร', 'curriculum',
  'ตัวชี้วัด', 'indicators',
  'มาตรฐาน', 'standards',
];

// Calculate credibility score
export function calculateCredibility(
  url: string,
  author?: string,
  sourceType?: string
): SourceScore['credibilityScore'] {
  let score = 50; // Base score
  const reasons: string[] = [];

  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase().replace(/^www\./, '');

    // Check trusted domains
    for (const [trustedDomain, baseScore] of Object.entries(TRUSTED_DOMAINS)) {
      if (domain.includes(trustedDomain)) {
        score = Math.max(score, baseScore);
        reasons.push(`Trusted domain: ${trustedDomain}`);
        break;
      }
    }

    // Check for educational TLD
    if (domain.endsWith('.ac.th') || domain.endsWith('.edu') || domain.endsWith('.ac.uk')) {
      score += 15;
      reasons.push('Academic domain (.ac/.edu)');
    }

    // Government sites
    if (domain.endsWith('.go.th') || domain.endsWith('.gov')) {
      score += 20;
      reasons.push('Government domain');
    }

    // HTTPS bonus
    if (urlObj.protocol === 'https:') {
      score += 5;
    }

    // Source type adjustments
    if (sourceType === 'government') {
      score += 15;
      reasons.push('Government source');
    } else if (sourceType === 'academic') {
      score += 10;
      reasons.push('Academic source');
    } else if (sourceType === 'educational') {
      score += 5;
      reasons.push('Educational source');
    } else if (sourceType === 'social' || sourceType === 'blog') {
      score -= 15;
      reasons.push('Social media/blog source');
    }

    // Author bonus
    if (author) {
      if (author.includes('ครู') || author.includes('teacher') || author.includes('อาจารย์')) {
        score += 5;
        reasons.push('Identified educator author');
      }
      if (author.includes('กระทรวง') || author.includes('สำนัก')) {
        score += 10;
        reasons.push('Official organization');
      }
    }

  } catch {
    // Invalid URL format
    score -= 20;
    reasons.push('Invalid URL format');
  }

  return Math.min(100, Math.max(0, score));
}

// Calculate relevance score
export function calculateRelevance(
  title: string,
  snippet: string,
  topic: string,
  subject: string,
  gradeLevel: string
): SourceScore['relevanceScore'] {
  let score = 30; // Base score
  const content = `${title} ${snippet}`.toLowerCase();

  // Topic relevance (highest weight)
  const topicLower = topic.toLowerCase();
  const topicKeywords = topicLower.split(/\s+/);
  
  for (const keyword of topicKeywords) {
    if (keyword.length > 2) {
      if (content.includes(keyword)) {
        score += 15;
      }
    }
  }

  // Exact topic match in title
  if (title.toLowerCase().includes(topicLower)) {
    score += 25;
  }

  // Subject relevance
  const subjectKeywords = SUBJECT_KEYWORDS[subject.toLowerCase()] || [];
  for (const keyword of subjectKeywords) {
    if (content.includes(keyword.toLowerCase())) {
      score += 5;
    }
  }

  // Grade level relevance
  const gradeKeywords = [
    gradeLevel.toLowerCase(),
    gradeLevel.replace(/\./g, ''),
    gradeLevel.replace(/\s+/g, ''),
  ];
  
  // Map grade levels to general terms
  if (gradeLevel.includes('ป.')) {
    gradeKeywords.push('ประถม', 'ประถมศึกษา', 'elementary');
  }
  if (gradeLevel.includes('ม.')) {
    gradeKeywords.push('มัธยม', 'มัธยมศึกษา', 'secondary');
  }

  for (const gradeKeyword of gradeKeywords) {
    if (content.includes(gradeKeyword)) {
      score += 15;
      break;
    }
  }

  // Educational structure keywords
  for (const eduKeyword of EDUCATIONAL_KEYWORDS) {
    if (content.includes(eduKeyword.toLowerCase())) {
      score += 3;
    }
  }

  return Math.min(100, score);
}

// Calculate educational value score
export function calculateEducationalValue(
  snippet: string
): SourceScore['educationalScore'] {
  let score = 40; // Base score
  const content = snippet.toLowerCase();

  // Educational content indicators
  const indicators = [
    { pattern: /แผนการสอน|lesson\s*plan/i, weight: 20 },
    { pattern: /วัตถุประสงค์|objective/i, weight: 15 },
    { pattern: /กิจกรรม|activity|activities/i, weight: 15 },
    { pattern: /สื่อการสอน|teaching\s*media/i, weight: 10 },
    { pattern: /ใบงาน|worksheet|worksheet/i, weight: 10 },
    { pattern: /การประเมิน|assessment|evaluation/i, weight: 10 },
    { pattern: /การเรียนรู้|learning/i, weight: 5 },
    { pattern: /การสอน|teaching/i, weight: 5 },
    { pattern: /นักเรียน|student/i, weight: 5 },
  ];

  for (const indicator of indicators) {
    if (indicator.pattern.test(content)) {
      score += indicator.weight;
    }
  }

  // Content length factor (longer snippets often more comprehensive)
  if (snippet.length > 100) score += 5;
  if (snippet.length > 200) score += 5;

  return Math.min(100, score);
}

// Calculate complete score
export function calculateSourceScore(
  url: string,
  title: string,
  snippet: string,
  topic: string,
  subject: string,
  gradeLevel: string,
  author?: string,
  sourceType?: string
): SourceScore {
  const credibilityScore = calculateCredibility(url, author, sourceType);
  const relevanceScore = calculateRelevance(title, snippet, topic, subject, gradeLevel);
  const educationalScore = calculateEducationalValue(snippet);

  // Weighted total score
  const totalScore = Math.round(
    credibilityScore * 0.35 +
    relevanceScore * 0.40 +
    educationalScore * 0.25
  );

  const reasons: string[] = [];
  if (credibilityScore >= 70) reasons.push('High credibility source');
  if (relevanceScore >= 70) reasons.push('Highly relevant to query');
  if (educationalScore >= 70) reasons.push('Strong educational content');

  return {
    credibilityScore,
    relevanceScore,
    educationalScore,
    totalScore,
    reasons,
  };
}

// Rank and filter sources
export function rankSources<T extends { url: string; title: string; snippet: string; author?: string; sourceType?: string }>(
  sources: T[],
  topic: string,
  subject: string,
  gradeLevel: string,
  minScore: number = 40
): Array<T & { scores: SourceScore }> {
  const scored = sources.map((source) => ({
    ...source,
    scores: calculateSourceScore(
      source.url,
      source.title,
      source.snippet,
      topic,
      subject,
      gradeLevel,
      source.author,
      source.sourceType
    ),
  }));

  // Filter and sort by total score
  return scored
    .filter((item) => item.scores.totalScore >= minScore)
    .sort((a, b) => b.scores.totalScore - a.scores.totalScore);
}

// Get quality label
export function getQualityLabel(score: number): string {
  if (score >= 80) return 'excellent';
  if (score >= 65) return 'good';
  if (score >= 50) return 'acceptable';
  if (score >= 35) return 'fair';
  return 'poor';
}

// Get Thai quality label
export function getThaiQualityLabel(score: number): string {
  if (score >= 80) return 'ดีเยี่ยม';
  if (score >= 65) return 'ดี';
  if (score >= 50) return 'พอใช้';
  if (score >= 35) return 'พอใช้ได้';
  return 'ควรพิจารณา';
}
