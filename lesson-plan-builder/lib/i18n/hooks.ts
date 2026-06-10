import { useMemo } from "react";
import type { EditorWizardStep } from "@/components/editor/EditorWizard";
import { useI18n } from "@/components/i18n/language-provider";
import { GRADE_KEYS, SEMESTER_KEYS, SUBJECT_KEYS } from "./constants";

export function useSubjectOptions() {
  const { t } = useI18n();
  return useMemo(
    () => SUBJECT_KEYS.map((value) => ({ value, label: t(`subjects.${value}`) })),
    [t]
  );
}

export function useGradeOptions() {
  const { t } = useI18n();
  return useMemo(
    () => GRADE_KEYS.map((value) => ({ value, label: t(`grades.${value}`) })),
    [t]
  );
}

export function useSemesterOptions() {
  const { t } = useI18n();
  return useMemo(
    () => SEMESTER_KEYS.map((value) => ({ value, label: t(`semesters.${value}`) })),
    [t]
  );
}

export function useAcademicYearOptions() {
  const { t, locale } = useI18n();
  return useMemo(() => {
    const baseYear =
      locale === "th" ? new Date().getFullYear() + 543 : new Date().getFullYear();
    return Array.from({ length: 5 }, (_, index) => {
      const year = baseYear - index;
      return {
        value: year.toString(),
        label: t("editor.academicYearLabel", { year }),
      };
    });
  }, [t, locale]);
}

export function useEditorWizardSteps(): EditorWizardStep[] {
  const { t } = useI18n();
  return useMemo(
    () => [
      {
        id: "basic",
        label: t("editor.wizard.basic"),
        shortLabel: t("editor.wizard.basicShort"),
      },
      {
        id: "content",
        label: t("editor.wizard.content"),
        shortLabel: t("editor.wizard.contentShort"),
      },
      {
        id: "research",
        label: t("editor.wizard.research"),
        shortLabel: t("editor.wizard.researchShort"),
      },
      {
        id: "review",
        label: t("editor.wizard.review"),
        shortLabel: t("editor.wizard.reviewShort"),
      },
    ],
    [t]
  );
}

export function translateSubject(t: (key: string) => string, key: string) {
  const label = t(`subjects.${key}`);
  return label === `subjects.${key}` ? key : label;
}

export function translateGrade(t: (key: string) => string, key: string) {
  const label = t(`grades.${key}`);
  return label === `grades.${key}` ? key : label;
}

export function translateStatus(t: (key: string) => string, status: string) {
  const label = t(`status.${status}`);
  return label === `status.${status}` ? t("status.draft") : label;
}
