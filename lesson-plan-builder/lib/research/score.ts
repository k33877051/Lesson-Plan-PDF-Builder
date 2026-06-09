// Content Scoring Module
// Evaluates credibility and relevance of sources

import type { ExtractedContent } from './extract';

export interface SourceScore {
  credibilityScore: number; // 0-100
  relevanceScore: number; // 0-100
  educationalScore: number; // 0-100
  totalScore: number; // Combined score
  reasons: string[];
}

// List of credible educational domains
const CREDIBLE_EDUCATIONAL_DOMAINS = [
  '.edu',
  '.ac.th',
  '.ac.uk',
  '.ac.jp',
  '.ac.kr',
  'kru',
  'teacher',
  'school',
  'sch',
  'edu',
  'curriculum',
  'lesson',
  'plan',
  'objective',
  'กระทรวงศึกษาธิการ',
  'สพฐ',
  'สพม',
  'สถาบัน',
  'ครู',
  'โรงเรียน',
];

// Academic and educational sites
const TRUSTED_SITES = [
  'wikipedia.org',
  'britannica.com',
  'khanacademy.org',
  'coursera.org',
  'ed.ted.com',
  'phET.colorado.edu',
  'nctm.org',
  'nsta.org',
  'iste.org',
  'asci.org',
];

// Low credibility indicators
const LOW_CREDIBILITY_INDICATORS = [
  'blogspot',
  'wordpress.com',
  'wixsite',
  'weebly',
  'medium.com',
  'reddit.com',
  'quora.com',
  'pinterest',
  'facebook',
  'clickbait',
  'sensational',
  'amazing',
  'shocking',
  'unbelievable',
];

// Educational keywords for relevance scoring
const EDUCATIONAL_KEYWORDS = [
  'แผนการสอน',
  'lesson plan',
  'objective',
  'objectives',
  'วัตถุประสงค์',
  'กิจกรรม',
  'activity',
  'activities',
  'assessment',
  'evaluation',
  'ประเมิน',
  'evaluate',
  'การเรียนรู้',
  'learning',
  'teaching',
  'การสอน',
  'curriculum',
  'หลักสูตร',
  'syllabus',
  'หน่วยการเรียนรู้',
  'worksheet',
  'แบบฝึกหัด',
  'exercise',
  'quiz',
  'test',
  'exam',
  'เกณฑ์',
  'rubric',
  'standard',
  'มาตรฐาน',
  'indicator',
  'ตัวชี้วัด',
  'student',
  'นักเรียน',
  'teacher',
  'ครู',
  'classroom',
  'ห้องเรียน',
  'instruction',
  'pedagogy',
  'วิธีสอน',
  'method',
  'strategies',
  'techniques',
];

// Calculate credibility score
export function calculateCredibilityScore(
  url: string,
  content: ExtractedContent
): number {
  let score = 50; // Base score
  const reasons: string[] = [];

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    // Check for educational domains
    for (const domain of CREDIBLE_EDUCATIONAL_DOMAINS) {
      if (hostname.includes(domain)) {
        score += 20;
        reasons.push(`Educational domain: ${domain}`);
        break;
      }
    }

    // Check for trusted sites
    for (const site of TRUSTED_SITES) {
      if (hostname.includes(site)) {
        score += 15;
        reasons.push(`Trusted educational site: ${site}`);
        break;
      }
    }

    // Check for low credibility indicators
    for (const indicator of LOW_CREDIBILITY_INDICATORS) {
      if (hostname.includes(indicator)) {
        score -= 15;
        reasons.push(`Low credibility indicator: ${indicator}`);
        break;
      }
    }

    // HTTPS bonus
    if (parsed.protocol === 'https:') {
      score += 5;
    }

    // Content quality indicators
    if (content.wordCount > 500) {
      score += 10;
      reasons.push('Substantial content length');
    }

    if (content.author) {
      score += 5;
      reasons.push('Has author attribution');
    }

    if (content.publishedAt) {
      // Recent content is better
      const age = Date.now() - content.publishedAt.getTime();
      const years = age / (365 * 24 * 60 * 60 * 1000);
      if (years < 5) {
        score += 5;
        reasons.push('Recent publication');
      }
    }

    // Content has proper structure
    if (content.content.includes('?') && content.content.includes('.')) {
      score += 5; // Has questions and complete sentences
    }
  } catch {
    score -= 10;
    reasons.push('Invalid URL format');
  }

  // Cap score
  return Math.min(100, Math.max(0, score));
}

// Calculate relevance score based on search terms
export function calculateRelevanceScore(
  content: ExtractedContent,
  topic: string,
  subject: string,
  gradeLevel: string
): number {
  let score = 0;
  const text = `${content.title} ${content.content}`.toLowerCase();
  const contentWords = text.split(/\s+/);

  // Topic relevance
  const topicKeywords = topic.toLowerCase().split(/\s+/);
  let topicMatches = 0;
  for (const keyword of topicKeywords) {
    if (keyword.length > 2) {
      const matches = contentWords.filter((w) => w.includes(keyword)).length;
      topicMatches += matches;
    }
  }
  score += Math.min(30, topicMatches * 2);

  // Subject relevance
  const subjectKeywords = subject.toLowerCase().split(/\s+/);
  let subjectMatches = 0;
  for (const keyword of subjectKeywords) {
    if (keyword.length > 2) {
      const matches = contentWords.filter((w) => w.includes(keyword)).length;
      subjectMatches += matches;
    }
  }
  score += Math.min(20, subjectMatches * 2);

  // Grade level relevance
  const gradeKeywords = [
    gradeLevel.toLowerCase(),
    gradeLevel.replace(/[.-]/g, ' ').toLowerCase(),
  ];
  for (const gk of gradeKeywords) {
    if (text.includes(gk)) {
      score += 10;
      break;
    }
  }

  // Educational keywords
  let eduKeywordCount = 0;
  for (const keyword of EDUCATIONAL_KEYWORDS) {
    if (text.includes(keyword.toLowerCase())) {
      eduKeywordCount++;
    }
  }
  score += Math.min(20, eduKeywordCount * 2);

  // Title relevance bonus
  const title = content.title.toLowerCase();
  for (const tk of topicKeywords) {
    if (title.includes(tk)) {
      score += 10;
      break;
    }
  }

  // Content length factor (longer is generally more comprehensive)
  if (content.wordCount > 1000) {
    score += 5;
  }

  // Cap score
  return Math.min(100, Math.max(0, score));
}

// Calculate educational value score
export function calculateEducationalScore(content: ExtractedContent): number {
  let score = 0;
  const text = content.content.toLowerCase();

  // Check for lesson plan structure indicators
  const structureIndicators = [
    { pattern: /วัตถุประสงค์|objective/i, weight: 15 },
    { pattern: /กิจกรรม|activity/i, weight: 10 },
    { pattern: /ประเมิน|assess|evaluate/i, weight: 10 },
    { pattern: /ผลการเรียนรู้|learning outcome/i, weight: 10 },
    { pattern: /เวลา|duration|period/i, weight: 5 },
    { pattern: /สื่อ|media|material/i, weight: 5 },
    { pattern: /ขั้นตอน|procedure|step/i, weight: 5 },
  ];

  for (const indicator of structureIndicators) {
    if (indicator.pattern.test(text)) {
      score += indicator.weight;
    }
  }

  // Check for example/practice content
  if (/ตัวอย่าง|example/i.test(text)) score += 5;
  if (/ฝึก|practice|exercise/i.test(text)) score += 5;

  // Has proper formatting (bullet points, numbering)
  if (/^\s*[\d\-\*•]\s+/m.test(text)) {
    score += 5;
  }

  // Adequate reading time for a lesson
  if (content.readingTime >= 3 && content.readingTime <= 15) {
    score += 10;
  }

  return Math.min(100, score);
}

// Calculate complete score
export function calculateSourceScore(
  url: string,
  content: ExtractedContent,
  topic: string,
  subject: string,
  gradeLevel: string
): SourceScore {
  const credibilityScore = calculateCredibilityScore(url, content);
  const relevanceScore = calculateRelevanceScore(content, topic, subject, gradeLevel);
  const educationalScore = calculateEducationalScore(content);

  // Weighted total
  const totalScore = Math.round(
    credibilityScore * 0.3 + relevanceScore * 0.4 + educationalScore * 0.3
  );

  const reasons: string[] = [];
  if (credibilityScore > 70) reasons.push('Highly credible source');
  if (relevanceScore > 70) reasons.push('Highly relevant to topic');
  if (educationalScore > 70) reasons.push('Excellent educational content');

  return {
    credibilityScore,
    relevanceScore,
    educationalScore,
    totalScore,
    reasons,
  };
}

// Filter sources by minimum score
export function filterQualitySources(
  sources: Array<{ url: string; score: SourceScore; content: ExtractedContent }>,
  minTotalScore: number = 40,
  minCredibility: number = 20
): Array<{ url: string; score: SourceScore; content: ExtractedContent }> {
  return sources.filter(
    (s) => s.score.totalScore >= minTotalScore && s.score.credibilityScore >= minCredibility
  );
}

// Sort sources by total score
export function sortSourcesByQuality(
  sources: Array<{ url: string; score: SourceScore; content: ExtractedContent }>
): Array<{ url: string; score: SourceScore; content: ExtractedContent }> {
  return [...sources].sort((a, b) => b.score.totalScore - a.score.totalScore);
}
