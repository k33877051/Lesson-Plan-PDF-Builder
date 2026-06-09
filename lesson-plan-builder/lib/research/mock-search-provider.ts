// Mock Search Provider
// Returns realistic Thai education sources for development/testing

import {
  BaseSearchProvider,
  SearchQuery,
  SearchResult,
} from './search-provider';

// Mock database of Thai educational sources
const MOCK_SOURCES: Record<string, SearchResult[]> = {
  mathematics: [
    {
      title: 'แผนการสอนคณิตศาสตร์ เรื่องการบวก การลบ ป.1 - สพฐ',
      url: 'https://www.obec.go.th/math_p1_addition_subtraction',
      snippet: 'แผนการสอนคณิตศาสตร์ประถมศึกษาปีที่ 1 เรื่องการบวกและการลบจำนวนไม่เกิน 100 วัตถุประสงค์การเรียนรู้ 1. นักเรียนสามารถบวกจำนวนไม่เกิน 100 ได้ 2. นักเรียนสามารถลบจำนวนไม่เกิน 100 ได้',
      platform: 'obec',
      sourceType: 'government',
      author: 'สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน',
    },
    {
      title: 'หน่วยการเรียนรู้การคูณ การหาร ป.3 - คณิตศาสตร์ไทย',
      url: 'https://www.thaimath.org/multiplication_division_p3',
      snippet: 'หน่วยการเรียนรู้คณิตศาสตร์ ป.3 เรื่องการคูณและการหาร แผนการสอน 4 ชั่วโมง กิจกรรมการเรียนรู้แบบรูปแบบโครงงาน',
      platform: 'thaimath',
      sourceType: 'educational',
      author: 'สมาคมคณิตศาสตร์แห่งประเทศไทย',
    },
    {
      title: 'สื่อการสอนเรขาคณิต ม.1 - YouTube ครูพี่แบงค์',
      url: 'https://www.youtube.com/watch?v=geometry_m1_teaching',
      snippet: 'วิดีโอสอนเรขาคณิตสำหรับนักเรียนมัธยมศึกษาปีที่ 1 รูปทรงเรขาคณิตสองมิติและสามมิติ',
      platform: 'youtube',
      sourceType: 'educational',
      author: 'ครูพี่แบงค์ - คณิตศาสตร์ออนไลน์',
    },
    {
      title: 'บทเรียนออนไลน์ฟังก์ชัน ม.4 - โรงเรียนสาธิต ม.เกษตรศาสตร์',
      url: 'https://www.satit.ku.ac.th/function_m4_lesson',
      snippet: 'บทเรียนออนไลน์เรื่องฟังก์ชัน สำหรับนักเรียนมัธยมศึกษาปีที่ 4 เนื้อหาครบถ้วน มีแบบฝึกหัดประกอบ',
      platform: 'satit',
      sourceType: 'academic',
      author: 'โรงเรียนสาธิต มหาวิทยาลัยเกษตรศาสตร์',
    },
    {
      title: 'แบบฝึกหัดคณิตศาสตร์ PDF ป.6 - สอบเข้าม.1',
      url: 'https://www.mathworksheet.com/p6_entrance_exam',
      snippet: 'แบบฝึกหัดคณิตศาสตร์ป.6 เตรียมสอบเข้ามัธยมศึกษาปีที่ 1 โจทย์พร้อมเฉลยละเอียด',
      platform: 'mathworksheet',
      sourceType: 'educational',
      author: 'ครูสมศรี คณิตศาสตร์',
    },
  ],
  science: [
    {
      title: 'แผนการสอนวิทยาศาสตร์ เรื่องระบบสุริยะ ป.4 - สพฐ',
      url: 'https://www.obec.go.th/science_solar_system_p4',
      snippet: 'แผนการสอนวิทยาศาสตร์ หน่วยการเรียนรู้ที่ 3 เรื่องระบบสุริยะของเรา สำหรับนักเรียนชั้นประถมศึกษาปีที่ 4',
      platform: 'obec',
      sourceType: 'government',
      author: 'กระทรวงศึกษาธิการ',
    },
    {
      title: 'การทดลองวิทยาศาสตร์ เรื่องพืช ม.1 - Open Education',
      url: 'https://www.openedu.go.th/biology_plants_m1',
      snippet: 'การทดลองวิทยาศาสตร์ ชีววิทยา เรื่องการเจริญเติบโตของพืช สำหรับนักเรียนมัธยมศึกษาปีที่ 1',
      platform: 'openedu',
      sourceType: 'government',
      author: 'สำนักงานส่งเสริมการศึกษานอกระบบ',
    },
    {
      title: 'สื่อการสอนวิทยาศาสตร์ เรื่องพลังงาน - สสวท.',
      url: 'https://www.ipst.ac.th/science_energy_resources',
      snippet: 'สื่อการสอนวิทยาศาสตร์ เรื่องพลังงานและการใช้พลังงาน สำนักงานสถิติและส่งเสริมวิทยาศาสตร์และเทคโนโลยี',
      platform: 'ipst',
      sourceType: 'government',
      author: 'สสวท.',
    },
    {
      title: 'คลิปสอนวิทยาศาสตร์ เรื่องสภาพแวดล้อม - YouTube',
      url: 'https://www.youtube.com/watch?v=science_environment_teaching',
      snippet: 'การสอนวิทยาศาสตร์ เรื่องสภาพแวดล้อมและการอนุรักษ์ธรรมชาติ สำหรับนักเรียนประถม',
      platform: 'youtube',
      sourceType: 'educational',
      author: 'ครูน้อยวิทยาศาสตร์',
    },
    {
      title: 'เอกสารประกอบการสอนเคมี ม.5 - โรงเรียนเตรียมอุดม',
      url: 'https://www.triamudom.ac.th/chemistry_m5_organic',
      snippet: 'เอกสารประกอบการสอนเคมีอินทรีย์ ม.5 โรงเรียนเตรียมอุดมศึกษา หลักสูตรแกนกลาง',
      platform: 'triamudom',
      sourceType: 'academic',
      author: 'กลุ่มสาระเคมี โรงเรียนเตรียมอุดม',
    },
  ],
  thai: [
    {
      title: 'แผนการสอนภาษาไทย การอ่าน การเขียน ป.2 - สพฐ',
      url: 'https://www.obec.go.th/thai_reading_writing_p2',
      snippet: 'แผนการสอนภาษาไทย ทักษะการอ่านและการเขียน ชั้นประถมศึกษาปีที่ 2 หน่วยที่ 1-5',
      platform: 'obec',
      sourceType: 'government',
      author: 'สพฐ.',
    },
    {
      title: 'วรรณคดีไทย ม.6 - โรงเรียนสาธิต ม.ศิลปากร',
      url: 'https://www.satit.su.ac.th/thai_literature_m6',
      snippet: 'เอกสารประกอบการสอนวรรณคดีไทย ม.6 ลิลิตพระลอ คาวี โคลง',
      platform: 'satit_su',
      sourceType: 'academic',
      author: 'โรงเรียนสาธิต มหาวิทยาลัยศิลปากร',
    },
    {
      title: 'ใบงานภาษาไทย การเขียนสะกดคำ ป.3',
      url: 'https://www.thaiworksheet.com/spelling_p3',
      snippet: 'ใบงานฝึกทักษะการเขียน การสะกดคำ ภาษาไทย ป.3 พร้อมเฉลย',
      platform: 'thaiworksheet',
      sourceType: 'educational',
      author: 'ครูไทยดี',
    },
    {
      title: 'สื่อการสอนวรรณกรรมพื้นบ้าน - กรมส่งเสริมวัฒนธรรม',
      url: 'https://www.culture.go.th/folk_literature_teaching',
      snippet: 'สื่อการสอนวรรณกรรมพื้นบ้าน นิทานพื้นบ้าน วรรณกรรมปรัมปรา สำหรับนักเรียน',
      platform: 'culture',
      sourceType: 'government',
      author: 'กรมส่งเสริมวัฒนธรรม',
    },
  ],
  english: [
    {
      title: 'Lesson Plans for Teaching English Grammar - ม.1-3',
      url: 'https://www.entrustedu.go.th/grammar_lessons_m13',
      snippet: 'แผนการสอนภาษาอังกฤษ หลักไวยากรณ์ Tenses, Parts of Speech สำหรับมัธยมต้น',
      platform: 'entrustedu',
      sourceType: 'government',
      author: 'สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน',
    },
    {
      title: 'English Conversation Activities for Primary School',
      url: 'https://www.britishcouncil.or.th/conversation_p16',
      snippet: 'กิจกรรมการสนทนาภาษาอังกฤษสำหรับนักเรียนประถมศึกษา จาก British Council Thailand',
      platform: 'britishcouncil',
      sourceType: 'educational',
      author: 'British Council Thailand',
    },
    {
      title: 'แบบฝึกหัด Reading Comprehension ม.6 สอบเข้ามหาวิทยาลัย',
      url: 'https://www.engexam.com/reading_comprehension_m6',
      snippet: 'แบบฝึกหัดทักษะการอ่านภาษาอังกฤษ ม.6 เตรียมสอบ TCAS',
      platform: 'engexam',
      sourceType: 'educational',
      author: 'ครูอังกฤษดี',
    },
    {
      title: 'Phonics Teaching Materials for Grade 1-3',
      url: 'https://www.phonicsthailand.com/phonics_g13',
      snippet: 'สื่อการสอน Phonics สำหรับนักเรียนชั้นประถมศึกษาปีที่ 1-3 การออกเสียง การอ่านคำ',
      platform: 'phonicsthailand',
      sourceType: 'educational',
      author: 'Phonics Thailand',
    },
  ],
  social: [
    {
      title: 'แผนการสอนสังคมศึกษา เรื่องหน้าที่พลเมือง ม.3',
      url: 'https://www.obec.go.th/social_citizenship_m3',
      snippet: 'แผนการสอนสังคมศึกษา ศาสนา และวัฒนธรรม เรื่องหน้าที่พลเมืองไทย ม.3',
      platform: 'obec',
      sourceType: 'government',
      author: 'สพฐ.',
    },
    {
      title: 'ประวัติศาสตร์ไทย สมัยรัตนโกสินทร์ ม.4 - สสวท.',
      url: 'https://www.ipst.ac.th/history_rattanakosin_m4',
      snippet: 'เอกสารประกอบการสอนประวัติศาสตร์ไทย สมัยรัตนโกสินทร์ ม.4',
      platform: 'ipst',
      sourceType: 'government',
      author: 'สสวท.',
    },
    {
      title: 'ภูมิศาสตร์ไทย ภาคต่างๆ - กรมแผนที่ทหาร',
      url: 'https://www.rtmd.go.th/geography_thailand',
      snippet: 'เอกสารภูมิศาสตร์ไทย แผนที่ประเทศไทย ภาคต่างๆ สำหรับการศึกษา',
      platform: 'rtmd',
      sourceType: 'government',
      author: 'กรมแผนที่ทหาร',
    },
    {
      title: 'สื่อการสอนศาสนาและวัฒนธรรม - มหาวิทยาลัยมหิดล',
      url: 'https://www.mu.ac.th/religion_culture_teaching',
      snippet: 'สื่อการสอนเรื่องศาสนาและวัฒนธรรมไทย สำหรับนักเรียน',
      platform: 'mu',
      sourceType: 'academic',
      author: 'มหาวิทยาลัยมหิดล',
    },
  ],
};

// Additional generic sources that match any query
const GENERIC_SOURCES: SearchResult[] = [
  {
    title: 'คลังสารสนเทศการศึกษาไทย - Education Repository',
    url: 'https://www.edurepo.go.th/teaching_resources',
    snippet: 'คลังข้อมูลสื่อการสอน แผนการสอน ใบงาน สำหรับครูไทย ครอบคลุมทุกระดับชั้น',
    platform: 'edurepo',
    sourceType: 'government',
    author: 'สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน',
  },
  {
    title: 'เว็บไซต์ครูไทยดอทคอม - สื่อการสอนครบวงจร',
    url: 'https://www.kru-thai.com/teaching_materials',
    snippet: 'รวมแผนการสอน ใบงาน ข้อสอบ สื่อการสอนสำหรับครูไทยทุกระดับ',
    platform: 'kru-thai',
    sourceType: 'educational',
    author: 'ครูไทยดอทคอม',
  },
  {
    title: 'YouTube ช่องครูประถม - สื่อการสอนฟรี',
    url: 'https://www.youtube.com/c/primaryteacherthailand',
    snippet: 'ช่อง YouTube รวมวิดีโอสอนหนังสือ กิจกรรมการเรียนการสอนระดับประถม',
    platform: 'youtube',
    sourceType: 'educational',
    author: 'ครูประถมไทยแลนด์',
  },
  {
    title: 'มุมครูไทย - แบ่งปันสื่อการสอน',
    url: 'https://www.mumkru.com/lesson_plans',
    snippet: 'เว็บไซต์แบ่งปันแผนการสอน ใบงาน สื่อประกอบการสอน จากครูทั่วประเทศ',
    platform: 'mumkru',
    sourceType: 'educational',
    author: 'มุมครูไทย',
  },
];

export class MockSearchProvider extends BaseSearchProvider {
  name = 'mock';

  async search(query: SearchQuery): Promise<SearchResult[]> {
    // Simulate network delay
    await this.delay(500 + Math.random() * 1000);

    const { subject, topic, gradeLevel, platform } = query;

    // Get subject-specific sources
    const subjectKey = subject.toLowerCase();
    const subjectSources = MOCK_SOURCES[subjectKey] || [];

    // Filter and rank sources based on query relevance
    const rankedSources = this.rankSources(
      [...subjectSources, ...GENERIC_SOURCES],
      topic,
      gradeLevel
    );

    // Add some variation based on the specific query
    const querySpecificResults = this.generateQuerySpecificResults(
      query,
      rankedSources.length
    );

    // Combine and shuffle slightly for variety
    const combined = [...rankedSources.slice(0, 4), ...querySpecificResults];
    return this.shuffleArray(combined).slice(0, 6);
  }

  private rankSources(
    sources: SearchResult[],
    topic: string,
    gradeLevel: string
  ): SearchResult[] {
    return sources
      .map((source) => ({
        source,
        score: this.calculateRelevanceScore(source, topic, gradeLevel),
      }))
      .sort((a, b) => b.score - a.score)
      .map((item) => item.source);
  }

  private calculateRelevanceScore(
    source: SearchResult,
    topic: string,
    gradeLevel: string
  ): number {
    let score = 50; // Base score

    const sourceText = `${source.title} ${source.snippet}`.toLowerCase();
    const topicLower = topic.toLowerCase();
    const gradeLower = gradeLevel.toLowerCase();

    // Topic relevance
    if (sourceText.includes(topicLower)) score += 20;
    if (sourceText.includes(topicLower.split(' ')[0])) score += 10;

    // Grade level relevance
    if (sourceText.includes(gradeLower)) score += 15;
    if (gradeLower.includes('ป.') && sourceText.includes('ประถม')) score += 10;
    if (gradeLower.includes('ม.') && sourceText.includes('มัธยม')) score += 10;

    // Source type bonus
    if (source.sourceType === 'government') score += 15;
    if (source.sourceType === 'academic') score += 10;
    if (source.sourceType === 'educational') score += 5;

    // Platform bonus
    if (source.platform === 'obec' || source.platform === 'ipst') score += 10;

    return Math.min(100, score);
  }

  private generateQuerySpecificResults(
    query: SearchQuery,
    offset: number
  ): SearchResult[] {
    // Generate some additional results specific to the exact query
    const { topic, subject, gradeLevel } = query;

    return [
      {
        title: `แผนการสอน${subject} เรื่อง${topic} ${gradeLevel} - ครูทั่วไป`,
        url: `https://www.example.com/${subject}_${topic}_${gradeLevel}`,
        snippet: `แผนการสอนที่ครูทั่วไปแบ่งปัน เรื่อง${topic} สำหรับ${gradeLevel} พร้อมสื่อประกอบ`,
        platform: 'teacherblog',
        sourceType: 'blog',
        author: 'ครูใจดี',
      },
      {
        title: `คลิปสอน${topic} ${gradeLevel} - TikTok Education`,
        url: `https://www.tiktok.com/@teacherthai/${topic}_${gradeLevel}`,
        snippet: `วิดีโอสั้นสอนเนื้อหา${topic} สำหรับนักเรียน${gradeLevel} สนุก เข้าใจง่าย`,
        platform: 'tiktok',
        sourceType: 'social',
        author: '@teacherthai',
      },
    ];
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  isAvailable(): boolean {
    // Always available for development
    return true;
  }
}
