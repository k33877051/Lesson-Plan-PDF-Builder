// Type definitions
export interface AILessonPlanSample {
  id: string;
  title: string;
  department: string;
  subject: string;
  educationGroup: string;
  gradeLevel: string;
  semester: string;
  academicYear: string;
  duration: string;
  teacherName: string;
  schoolName: string;
  learningObjectives: string[];
  keyConcepts: string;
  learningActivities: string[];
  mediaResources: string[];
  assessment: string[];
  notes: string;
  tags: string[];
}

// Filter options interface
export interface FilterOptions {
  department?: string;
  educationGroup?: string;
  gradeLevel?: string;
  subject?: string;
}

// Search and filter functions
export function filterSamples(
  samples: AILessonPlanSample[],
  filters: FilterOptions
): AILessonPlanSample[] {
  return samples.filter((sample) => {
    if (filters.department && sample.department !== filters.department) {
      return false;
    }
    if (filters.educationGroup && sample.educationGroup !== filters.educationGroup) {
      return false;
    }
    if (filters.gradeLevel && sample.gradeLevel !== filters.gradeLevel) {
      return false;
    }
    if (filters.subject && sample.subject !== filters.subject) {
      return false;
    }
    return true;
  });
}

// Search samples using the exported sampleAILessonPlans data
export function searchSamples(query: string): AILessonPlanSample[] {
  if (!query.trim()) {
    return sampleAILessonPlans;
  }

  const normalizedQuery = query.toLowerCase().trim();

  return sampleAILessonPlans.filter((sample) => {
    return (
      sample.title.toLowerCase().includes(normalizedQuery) ||
      sample.subject.toLowerCase().includes(normalizedQuery) ||
      sample.department.toLowerCase().includes(normalizedQuery) ||
      sample.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))
    );
  });
}

// Sample data
export const sampleAILessonPlans: AILessonPlanSample[] = [
  {
    id: "ai-basic-voc-1",
    title: "รู้จักปัญญาประดิษฐ์และการใช้งานในชีวิตประจำวัน",
    department: "เทคโนโลยีสารสนเทศ",
    subject: "พื้นฐานปัญญาประดิษฐ์",
    educationGroup: "อาชีวศึกษา",
    gradeLevel: "ปวช. ปีที่ 1",
    semester: "1",
    academicYear: "2569",
    duration: "3 ชั่วโมง",
    teacherName: "อาจารย์ผู้สอน",
    schoolName: "วิทยาลัยตัวอย่าง",
    learningObjectives: ["อธิบายความหมายของ AI ได้", "ยกตัวอย่าง AI รอบตัวได้", "วิเคราะห์ข้อดีข้อจำกัดของ AI ได้"],
    keyConcepts: "AI คือเทคโนโลยีที่ช่วยให้คอมพิวเตอร์เรียนรู้ วิเคราะห์ และช่วยตัดสินใจได้",
    learningActivities: ["ยกตัวอย่าง AI รอบตัว", "อภิปรายการใช้งาน AI", "ทำใบงานวิเคราะห์", "นำเสนอผล"],
    mediaResources: ["สไลด์ AI เบื้องต้น", "วิดีโอ AI", "ใบงาน"],
    assessment: ["ใบงาน", "การนำเสนอ", "การมีส่วนร่วม"],
    notes: "เหมาะสำหรับผู้เรียนเริ่มต้น",
    tags: ["AI", "Beginner", "ปวช"]
  },
  {
    id: "genai-work-voc-2",
    title: "การใช้ Generative AI เพื่อการเรียนและการทำงาน",
    department: "คอมพิวเตอร์ธุรกิจ",
    subject: "Generative AI เพื่อการเรียนและการทำงาน",
    educationGroup: "อาชีวศึกษา",
    gradeLevel: "ปวช. ปีที่ 2",
    semester: "1",
    academicYear: "2569",
    duration: "4 ชั่วโมง",
    teacherName: "อาจารย์ผู้สอน",
    schoolName: "วิทยาลัยตัวอย่าง",
    learningObjectives: ["ใช้ AI สรุปข้อมูลได้", "สร้างเอกสารด้วย AI ได้", "ตรวจสอบข้อมูลจาก AI ได้"],
    keyConcepts: "Generative AI ช่วยสร้างข้อความ รูปภาพ แผนงาน และไอเดีย แต่ต้องตรวจสอบก่อนใช้งาน",
    learningActivities: ["ทดลองสร้างสรุป", "สร้างตารางแผนงาน", "เปรียบเทียบ Prompt", "อภิปรายความน่าเชื่อถือ"],
    mediaResources: ["AI Tool", "ใบงาน Prompt", "ตัวอย่างผลลัพธ์"],
    assessment: ["ชิ้นงาน AI", "การวิเคราะห์ผลลัพธ์", "แบบสะท้อนคิด"],
    notes: "ควรเน้นจริยธรรมและการอ้างอิงข้อมูล",
    tags: ["Generative AI", "Productivity", "ปวช"]
  },
  {
    id: "prompt-engineering-hvoc-1",
    title: "การเขียน Prompt เพื่อสั่งงาน AI อย่างมีประสิทธิภาพ",
    department: "เทคโนโลยีดิจิทัล",
    subject: "Prompt Engineering เบื้องต้น",
    educationGroup: "อาชีวศึกษา",
    gradeLevel: "ปวส. ปีที่ 1",
    semester: "1",
    academicYear: "2569",
    duration: "4 ชั่วโมง",
    teacherName: "อาจารย์ผู้สอน",
    schoolName: "วิทยาลัยตัวอย่าง",
    learningObjectives: ["อธิบายองค์ประกอบ Prompt ได้", "เขียน Prompt เพื่อสร้างงานได้", "ปรับปรุง Prompt ให้ตรงเป้าหมายได้"],
    keyConcepts: "Prompt ที่ดีควรมีบทบาท เป้าหมาย บริบท รูปแบบผลลัพธ์ และข้อจำกัด",
    learningActivities: ["เปรียบเทียบ Prompt", "เขียน Prompt ตามสถานการณ์", "ทดลองปรับ Prompt", "นำเสนอเทคนิค"],
    mediaResources: ["Prompt Template", "AI Tool", "ใบงาน"],
    assessment: ["Prompt Portfolio", "ผลลัพธ์จาก AI", "การอธิบายเหตุผล"],
    notes: "เหมาะกับงานเอกสาร ธุรกิจ และการเรียน",
    tags: ["Prompt", "AI Skill", "ปวส"]
  },
  {
    id: "ml-basic-bachelor-2",
    title: "Machine Learning เบื้องต้นด้วยข้อมูลอย่างง่าย",
    department: "วิทยาการคอมพิวเตอร์",
    subject: "Machine Learning เบื้องต้น",
    educationGroup: "อุดมศึกษา",
    gradeLevel: "ปริญญาตรี ปีที่ 2",
    semester: "1",
    academicYear: "2569",
    duration: "6 ชั่วโมง",
    teacherName: "อาจารย์ผู้สอน",
    schoolName: "มหาวิทยาลัยตัวอย่าง",
    learningObjectives: ["อธิบายแนวคิด Machine Learning ได้", "แยกประเภท Supervised และ Unsupervised Learning ได้", "ทดลองสร้างโมเดลง่ายได้"],
    keyConcepts: "Machine Learning คือการทำให้คอมพิวเตอร์เรียนรู้รูปแบบจากข้อมูลเพื่อทำนายหรือจำแนกผลลัพธ์",
    learningActivities: ["อธิบาย AI/ML/DL", "ใช้ Dataset ตัวอย่าง", "ทดลอง No-code ML หรือ Notebook", "สรุปผลการทดลอง"],
    mediaResources: ["Dataset", "Google Colab", "สไลด์ ML"],
    assessment: ["แบบฝึกหัด", "รายงานทดลอง", "นำเสนอโมเดล"],
    notes: "เหมาะสำหรับผู้เรียนที่มีพื้นฐานคอมพิวเตอร์",
    tags: ["Machine Learning", "Data", "ปริญญาตรี"]
  },
  {
    id: "ai-business-hvoc-2",
    title: "การประยุกต์ใช้ AI ในงานธุรกิจดิจิทัล",
    department: "ธุรกิจดิจิทัล",
    subject: "AI สำหรับธุรกิจดิจิทัล",
    educationGroup: "อาชีวศึกษา",
    gradeLevel: "ปวส. ปีที่ 2",
    semester: "2",
    academicYear: "2569",
    duration: "4 ชั่วโมง",
    teacherName: "อาจารย์ผู้สอน",
    schoolName: "วิทยาลัยตัวอย่าง",
    learningObjectives: ["อธิบายการใช้ AI ในธุรกิจได้", "ออกแบบ Use Case AI ได้", "นำเสนอไอเดีย AI Business ได้"],
    keyConcepts: "AI ช่วยธุรกิจด้านการตลาด การขาย บริการลูกค้า วิเคราะห์ข้อมูล และสร้างคอนเทนต์",
    learningActivities: ["ศึกษากรณี AI Chatbot", "เลือกธุรกิจตัวอย่าง", "ออกแบบ AI Use Case", "นำเสนอ Business Canvas"],
    mediaResources: ["Case Study", "AI Business Canvas", "สไลด์"],
    assessment: ["Use Case", "การนำเสนอ", "ความเป็นไปได้ของไอเดีย"],
    notes: "เหมาะสำหรับต่อยอดเป็นโครงงานปลายภาค",
    tags: ["Business AI", "Digital Business", "ปวส"]
  },
  {
    id: "ai-ethics-highschool-5",
    title: "จริยธรรม AI และการเป็นพลเมืองดิจิทัล",
    department: "การศึกษาและนวัตกรรมการเรียนรู้",
    subject: "AI Ethics and Digital Citizenship",
    educationGroup: "มัธยมศึกษา",
    gradeLevel: "มัธยมศึกษาปีที่ 5",
    semester: "1",
    academicYear: "2569",
    duration: "3 ชั่วโมง",
    teacherName: "ครูผู้สอน",
    schoolName: "โรงเรียนตัวอย่าง",
    learningObjectives: ["อธิบายจริยธรรมในการใช้ AI ได้", "ระบุความเสี่ยงจากข้อมูลเท็จได้", "ใช้ AI อย่างรับผิดชอบได้"],
    keyConcepts: "การใช้ AI ต้องคำนึงถึงความถูกต้อง ความเป็นส่วนตัว ลิขสิทธิ์ และผลกระทบต่อสังคม",
    learningActivities: ["วิเคราะห์ข่าว AI", "อภิปราย Deepfake", "ทำ Checklist การใช้ AI", "สรุปแนวปฏิบัติ"],
    mediaResources: ["ข่าวตัวอย่าง", "ใบงานจริยธรรม AI", "วิดีโอ Deepfake"],
    assessment: ["ใบงาน", "การอภิปราย", "แบบสะท้อนคิด"],
    notes: "เหมาะกับทุกสาขา เพราะเป็นทักษะจำเป็น",
    tags: ["AI Ethics", "Digital Citizen", "มัธยม"]
  },
  {
    id: "chatbot-dev-hvoc-2",
    title: "การพัฒนา AI Chatbot สำหรับบริการลูกค้า",
    department: "คอมพิวเตอร์ธุรกิจ",
    subject: "AI Chatbot Development",
    educationGroup: "อาชีวศึกษา",
    gradeLevel: "ปวส. ปีที่ 2",
    semester: "2",
    academicYear: "2569",
    duration: "6 ชั่วโมง",
    teacherName: "อาจารย์ผู้สอน",
    schoolName: "วิทยาลัยตัวอย่าง",
    learningObjectives: ["อธิบายโครงสร้าง Chatbot ได้", "ออกแบบบทสนทนาได้", "สร้างต้นแบบ Chatbot ได้"],
    keyConcepts: "Chatbot ใช้ตรรกะ บทสนทนา และ AI เพื่อช่วยตอบคำถามหรือให้บริการลูกค้า",
    learningActivities: ["วิเคราะห์ Chatbot ตัวอย่าง", "ออกแบบ Flow คำถาม-คำตอบ", "สร้าง Bot ต้นแบบ", "ทดสอบกับเพื่อน"],
    mediaResources: ["Chatbot Platform", "Conversation Flow Template", "แบบทดสอบผู้ใช้"],
    assessment: ["ต้นแบบ Chatbot", "Flow การสนทนา", "ผลทดสอบการใช้งาน"],
    notes: "เริ่มจาก No-code ก่อน แล้วค่อยต่อยอด API",
    tags: ["Chatbot", "Customer Service", "ปวส"]
  },
  {
    id: "data-literacy-voc-3",
    title: "ความเข้าใจข้อมูลสำหรับการใช้งาน AI",
    department: "เทคโนโลยีสารสนเทศ",
    subject: "Data Literacy for AI",
    educationGroup: "อาชีวศึกษา",
    gradeLevel: "ปวช. ปีที่ 3",
    semester: "2",
    academicYear: "2569",
    duration: "4 ชั่วโมง",
    teacherName: "อาจารย์ผู้สอน",
    schoolName: "วิทยาลัยตัวอย่าง",
    learningObjectives: ["อธิบายความสำคัญของข้อมูลต่อ AI ได้", "แยกประเภทข้อมูลพื้นฐานได้", "ตรวจสอบคุณภาพข้อมูลเบื้องต้นได้"],
    keyConcepts: "AI ที่ดีต้องอาศัยข้อมูลที่ถูกต้อง ครบถ้วน และเหมาะสมกับเป้าหมาย",
    learningActivities: ["ดูตัวอย่างข้อมูลดี/ไม่ดี", "จัดประเภทข้อมูล", "ทำ Data Cleaning เบื้องต้น", "สรุปผลกระทบของข้อมูลต่อ AI"],
    mediaResources: ["ตารางข้อมูลตัวอย่าง", "Spreadsheet", "ใบงาน Data Quality"],
    assessment: ["ใบงาน", "แบบฝึกหัดจัดประเภทข้อมูล", "การสรุปผล"],
    notes: "เป็นพื้นฐานสำคัญก่อนเรียน Machine Learning",
    tags: ["Data", "AI Foundation", "ปวช"]
  },
  {
    id: "computer-vision-bachelor-3",
    title: "Computer Vision เบื้องต้นและการรู้จำภาพ",
    department: "วิศวกรรมคอมพิวเตอร์",
    subject: "Computer Vision เบื้องต้น",
    educationGroup: "อุดมศึกษา",
    gradeLevel: "ปริญญาตรี ปีที่ 3",
    semester: "1",
    academicYear: "2569",
    duration: "6 ชั่วโมง",
    teacherName: "อาจารย์ผู้สอน",
    schoolName: "มหาวิทยาลัยตัวอย่าง",
    learningObjectives: ["อธิบายแนวคิด Computer Vision ได้", "ทดลองจำแนกรูปภาพด้วยโมเดลสำเร็จรูปได้", "วิเคราะห์ข้อจำกัดของการรู้จำภาพได้"],
    keyConcepts: "Computer Vision คือการทำให้คอมพิวเตอร์เข้าใจ วิเคราะห์ และจำแนกข้อมูลจากภาพหรือวิดีโอ",
    learningActivities: ["อธิบาย Pixel และ Feature", "ทดลอง Image Classification", "ทดสอบภาพหลายเงื่อนไข", "อภิปราย Accuracy และ Bias"],
    mediaResources: ["ชุดภาพตัวอย่าง", "Notebook", "โมเดลสำเร็จรูป"],
    assessment: ["ผลการทดลอง", "รายงานข้อจำกัด", "การนำเสนอ"],
    notes: "ควรมีพื้นฐาน Python เบื้องต้น",
    tags: ["Computer Vision", "Image AI", "ปริญญาตรี"]
  },
  {
    id: "nlp-bachelor-3",
    title: "Natural Language Processing เบื้องต้น",
    department: "วิทยาการคอมพิวเตอร์",
    subject: "Natural Language Processing เบื้องต้น",
    educationGroup: "อุดมศึกษา",
    gradeLevel: "ปริญญาตรี ปีที่ 3",
    semester: "2",
    academicYear: "2569",
    duration: "6 ชั่วโมง",
    teacherName: "อาจารย์ผู้สอน",
    schoolName: "มหาวิทยาลัยตัวอย่าง",
    learningObjectives: ["อธิบายแนวคิด NLP ได้", "ทดลองวิเคราะห์ข้อความอย่างง่ายได้", "ยกตัวอย่างการใช้ NLP ในชีวิตจริงได้"],
    keyConcepts: "NLP คือเทคโนโลยีที่ช่วยให้คอมพิวเตอร์เข้าใจ ประมวลผล และสร้างภาษามนุษย์",
    learningActivities: ["ยกตัวอย่างแปลภาษา/สรุปข้อความ", "ทดลอง Tokenization", "วิเคราะห์ Sentiment", "อภิปรายข้อจำกัดภาษาไทย"],
    mediaResources: ["ชุดข้อความตัวอย่าง", "Notebook", "AI Text Tool"],
    assessment: ["แบบฝึกหัด NLP", "ผลทดลอง", "การอภิปราย"],
    notes: "เชื่อมโยงกับ Generative AI และ Chatbot ได้ดี",
    tags: ["NLP", "Text AI", "ปริญญาตรี"]
  },
  {
    id: "ai-for-education-teacher",
    title: "AI เพื่อการออกแบบการเรียนรู้และสื่อการสอน",
    department: "การศึกษาและนวัตกรรมการเรียนรู้",
    subject: "AI for Education",
    educationGroup: "อุดมศึกษา",
    gradeLevel: "ปริญญาตรี ปีที่ 4",
    semester: "1",
    academicYear: "2569",
    duration: "4 ชั่วโมง",
    teacherName: "อาจารย์ผู้สอน",
    schoolName: "มหาวิทยาลัยตัวอย่าง",
    learningObjectives: ["ใช้ AI ช่วยออกแบบกิจกรรมการเรียนรู้ได้", "สร้างสื่อการสอนด้วย AI ได้", "ประเมินความเหมาะสมของสื่อจาก AI ได้"],
    keyConcepts: "AI ช่วยครูออกแบบบทเรียน สร้างสื่อ แบบทดสอบ และปรับการเรียนรู้ให้เหมาะกับผู้เรียน",
    learningActivities: ["วิเคราะห์แผนการสอนตัวอย่าง", "ใช้ AI สร้างกิจกรรม", "สร้างใบงานหรือ Quiz", "ประเมินคุณภาพสื่อ"],
    mediaResources: ["AI Tool", "Template แผนการสอน", "Rubric ประเมินสื่อ"],
    assessment: ["แผนการสอนที่สร้างด้วย AI", "สื่อการสอน", "Reflection"],
    notes: "เหมาะกับสายครุศาสตร์/ศึกษาศาสตร์หรือครูผู้สอน",
    tags: ["AI Education", "Teacher", "Learning Design"]
  },
  {
    id: "ai-project-workshop-hvoc-2",
    title: "โครงงาน AI เพื่อแก้ปัญหาในสถานศึกษา",
    department: "หุ่นยนต์และระบบอัตโนมัติ",
    subject: "AI Project Workshop",
    educationGroup: "อาชีวศึกษา",
    gradeLevel: "ปวส. ปีที่ 2",
    semester: "2",
    academicYear: "2569",
    duration: "12 ชั่วโมง",
    teacherName: "อาจารย์ผู้สอน",
    schoolName: "วิทยาลัยตัวอย่าง",
    learningObjectives: ["ระบุปัญหาที่สามารถใช้ AI ช่วยแก้ได้", "ออกแบบต้นแบบโครงงาน AI ได้", "นำเสนอผลงาน AI Project ได้"],
    keyConcepts: "การทำโครงงาน AI ควรเริ่มจากปัญหาจริง ข้อมูลที่มี วิธีแก้ และการประเมินผลลัพธ์",
    learningActivities: ["ค้นหาปัญหาในสถานศึกษา", "ออกแบบ Project Proposal", "สร้าง Prototype", "ทดสอบและปรับปรุง", "นำเสนอผลงาน"],
    mediaResources: ["Project Canvas", "AI/No-code Tool", "แบบประเมินโครงงาน"],
    assessment: ["ข้อเสนอโครงงาน", "Prototype", "การนำเสนอ", "รายงานสรุป"],
    notes: "เหมาะสำหรับใช้เป็นโครงงานปลายภาค",
    tags: ["AI Project", "Workshop", "Prototype"]
  }
];
