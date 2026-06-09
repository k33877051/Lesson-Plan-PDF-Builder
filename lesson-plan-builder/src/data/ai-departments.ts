// AI Departments Data
// Departments and programs related to AI and technology education

export type AIDepartment = {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  color: string;
  icon?: string;
};

export const aiDepartments: AIDepartment[] = [
  {
    id: "it",
    name: "เทคโนโลยีสารสนเทศ",
    nameEn: "Information Technology",
    description: "เรียนรู้การพัฒนาระบบสารสนเทศ การจัดการเครือข่าย และการประยุกต์ใช้ AI ในงาน IT",
    color: "bg-blue-500",
  },
  {
    id: "business-computer",
    name: "คอมพิวเตอร์ธุรกิจ",
    nameEn: "Business Computer",
    description: "ผสมผสานเทคโนโลยีคอมพิวเตอร์กับการบริหารธุรกิจ เน้นการใช้ AI เพิ่มประสิทธิภาพองค์กร",
    color: "bg-indigo-500",
  },
  {
    id: "computer-science",
    name: "วิทยาการคอมพิวเตอร์",
    nameEn: "Computer Science",
    description: "ศึกษาหลักการพื้นฐานของการคำนวณ อัลกอริทึม และระบบปัญญาประดิษฐ์",
    color: "bg-purple-500",
  },
  {
    id: "computer-engineering",
    name: "วิศวกรรมคอมพิวเตอร์",
    nameEn: "Computer Engineering",
    description: "ออกแบบและพัฒนาฮาร์ดแวร์และซอฟต์แวร์ รวมถึงระบบ AI และ IoT",
    color: "bg-cyan-500",
  },
  {
    id: "digital-tech",
    name: "เทคโนโลยีดิจิทัล",
    nameEn: "Digital Technology",
    description: "ศึกษาเทคโนโลยีดิจิทัลสมัยใหม่ การพัฒนาแพลตฟอร์มดิจิทัลและการประยุกต์ใช้ AI",
    color: "bg-teal-500",
  },
  {
    id: "digital-business",
    name: "ธุรกิจดิจิทัล",
    nameEn: "Digital Business",
    description: "เรียนรู้การประกอบธุรกิจในยุคดิจิทัล การใช้ AI และ Big Data ในการตัดสินใจทางธุรกิจ",
    color: "bg-emerald-500",
  },
  {
    id: "robotics",
    name: "หุ่นยนต์และระบบอัตโนมัติ",
    nameEn: "Robotics and Automation",
    description: "ออกแบบและสร้างหุ่นยนต์ ระบบอัตโนมัติ ใช้ AI ควบคุมและตัดสินใจ",
    color: "bg-orange-500",
  },
  {
    id: "digital-marketing",
    name: "การตลาดดิจิทัล",
    nameEn: "Digital Marketing",
    description: "วางกลยุทธ์การตลาดยุคดิจิทัล ใช้ AI วิเคราะห์พฤติกรรมผู้บริโภคและสร้างคอนเทนต์",
    color: "bg-pink-500",
  },
  {
    id: "business-admin",
    name: "การจัดการธุรกิจ",
    nameEn: "Business Administration",
    description: "บริหารธุรกิจด้วยเทคโนโลยี ประยุกต์ใช้ AI ในการบริหารจัดการและการตัดสินใจ",
    color: "bg-rose-500",
  },
  {
    id: "education-innovation",
    name: "การศึกษาและนวัตกรรมการเรียนรู้",
    nameEn: "Education and Learning Innovation",
    description: "พัฒนาการศึกษาด้วยเทคโนโลยี ใช้ AI สร้างบุคลากรและสื่อการเรียนรู้ยุคใหม่",
    color: "bg-violet-500",
  },
];

// Helper functions
export function getDepartmentById(id: string): AIDepartment | undefined {
  return aiDepartments.find((dept) => dept.id === id);
}

export function getDepartmentName(id: string): string {
  const dept = getDepartmentById(id);
  return dept?.name || id;
}

export function getDepartmentsByKeyword(keyword: string): AIDepartment[] {
  const lowerKeyword = keyword.toLowerCase();
  return aiDepartments.filter(
    (dept) =>
      dept.name.toLowerCase().includes(lowerKeyword) ||
      dept.nameEn.toLowerCase().includes(lowerKeyword) ||
      dept.description.toLowerCase().includes(lowerKeyword)
  );
}

// Group departments by category
export const departmentCategories = {
  technology: ["it", "computer-science", "computer-engineering", "digital-tech", "robotics"],
  business: ["business-computer", "digital-business", "business-admin", "digital-marketing"],
  education: ["education-innovation"],
};

export function getDepartmentsByCategory(category: keyof typeof departmentCategories): AIDepartment[] {
  const ids = departmentCategories[category];
  return aiDepartments.filter((dept) => ids.includes(dept.id));
}
