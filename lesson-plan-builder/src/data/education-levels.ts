// Education Level System
// Organized by education groups with flat list for forms

export type EducationLevel = {
  id: string;
  label: string;
  shortLabel: string;
  group: string;
  groupId: string;
  order: number;
};

export type EducationGroup = {
  id: string;
  name: string;
  nameEn: string;
  levels: EducationLevel[];
};

export const educationLevelGroups: EducationGroup[] = [
  {
    id: "primary",
    name: "ประถมศึกษา",
    nameEn: "Primary Education",
    levels: [
      { id: "p1", label: "ประถมศึกษาปีที่ 1", shortLabel: "ป.1", group: "ประถมศึกษา", groupId: "primary", order: 1 },
      { id: "p2", label: "ประถมศึกษาปีที่ 2", shortLabel: "ป.2", group: "ประถมศึกษา", groupId: "primary", order: 2 },
      { id: "p3", label: "ประถมศึกษาปีที่ 3", shortLabel: "ป.3", group: "ประถมศึกษา", groupId: "primary", order: 3 },
      { id: "p4", label: "ประถมศึกษาปีที่ 4", shortLabel: "ป.4", group: "ประถมศึกษา", groupId: "primary", order: 4 },
      { id: "p5", label: "ประถมศึกษาปีที่ 5", shortLabel: "ป.5", group: "ประถมศึกษา", groupId: "primary", order: 5 },
      { id: "p6", label: "ประถมศึกษาปีที่ 6", shortLabel: "ป.6", group: "ประถมศึกษา", groupId: "primary", order: 6 },
    ],
  },
  {
    id: "secondary",
    name: "มัธยมศึกษา",
    nameEn: "Secondary Education",
    levels: [
      { id: "m1", label: "มัธยมศึกษาปีที่ 1", shortLabel: "ม.1", group: "มัธยมศึกษา", groupId: "secondary", order: 7 },
      { id: "m2", label: "มัธยมศึกษาปีที่ 2", shortLabel: "ม.2", group: "มัธยมศึกษา", groupId: "secondary", order: 8 },
      { id: "m3", label: "มัธยมศึกษาปีที่ 3", shortLabel: "ม.3", group: "มัธยมศึกษา", groupId: "secondary", order: 9 },
      { id: "m4", label: "มัธยมศึกษาปีที่ 4", shortLabel: "ม.4", group: "มัธยมศึกษา", groupId: "secondary", order: 10 },
      { id: "m5", label: "มัธยมศึกษาปีที่ 5", shortLabel: "ม.5", group: "มัธยมศึกษา", groupId: "secondary", order: 11 },
      { id: "m6", label: "มัธยมศึกษาปีที่ 6", shortLabel: "ม.6", group: "มัธยมศึกษา", groupId: "secondary", order: 12 },
    ],
  },
  {
    id: "vocational",
    name: "อาชีวศึกษา",
    nameEn: "Vocational Education",
    levels: [
      { id: "voc1", label: "ปวช. ปีที่ 1", shortLabel: "ปวช.1", group: "อาชีวศึกษา", groupId: "vocational", order: 13 },
      { id: "voc2", label: "ปวช. ปีที่ 2", shortLabel: "ปวช.2", group: "อาชีวศึกษา", groupId: "vocational", order: 14 },
      { id: "voc3", label: "ปวช. ปีที่ 3", shortLabel: "ปวช.3", group: "อาชีวศึกษา", groupId: "vocational", order: 15 },
      { id: "vocs1", label: "ปวส. ปีที่ 1", shortLabel: "ปวส.1", group: "อาชีวศึกษา", groupId: "vocational", order: 16 },
      { id: "vocs2", label: "ปวส. ปีที่ 2", shortLabel: "ปวส.2", group: "อาชีวศึกษา", groupId: "vocational", order: 17 },
    ],
  },
  {
    id: "university",
    name: "อุดมศึกษา",
    nameEn: "Higher Education",
    levels: [
      { id: "uni1", label: "ปริญญาตรี ปีที่ 1", shortLabel: "ปี 1", group: "อุดมศึกษา", groupId: "university", order: 18 },
      { id: "uni2", label: "ปริญญาตรี ปีที่ 2", shortLabel: "ปี 2", group: "อุดมศึกษา", groupId: "university", order: 19 },
      { id: "uni3", label: "ปริญญาตรี ปีที่ 3", shortLabel: "ปี 3", group: "อุดมศึกษา", groupId: "university", order: 20 },
      { id: "uni4", label: "ปริญญาตรี ปีที่ 4", shortLabel: "ปี 4", group: "อุดมศึกษา", groupId: "university", order: 21 },
    ],
  },
];

// Flat list for easy use in forms
export const flatEducationLevels: EducationLevel[] = educationLevelGroups.flatMap(
  (group) => group.levels
);

// Helper functions
export function getLevelsByGroup(groupId: string): EducationLevel[] {
  return flatEducationLevels.filter((level) => level.groupId === groupId);
}

export function getLevelById(levelId: string): EducationLevel | undefined {
  return flatEducationLevels.find((level) => level.id === levelId);
}

export function getGroupById(groupId: string): EducationGroup | undefined {
  return educationLevelGroups.find((group) => group.id === groupId);
}

export function getGroupName(groupId: string): string {
  const group = getGroupById(groupId);
  return group?.name || groupId;
}

export function getLevelLabel(levelId: string): string {
  const level = getLevelById(levelId);
  return level?.label || levelId;
}

export function getLevelShortLabel(levelId: string): string {
  const level = getLevelById(levelId);
  return level?.shortLabel || levelId;
}
