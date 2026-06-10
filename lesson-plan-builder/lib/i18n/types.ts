export type Locale = "th" | "en";

export const LOCALES: Locale[] = ["th", "en"];

export const LOCALE_LABELS: Record<Locale, string> = {
  th: "ไทย",
  en: "English",
};

export type Messages = {
  app: {
    name: string;
    tagline: string;
    copyright: string;
  };
  nav: {
    dashboard: string;
    lessonPlans: string;
    aiBuilder: string;
    projects: string;
    upload: string;
    settings: string;
    help: string;
    createNew: string;
    createLessonPlan: string;
    mainMenu: string;
    openMenu: string;
    closeMenu: string;
  };
  common: {
    searchPlaceholder: string;
    notifications: string;
    myAccount: string;
    viewAll: string;
    actions: string;
    edit: string;
    preview: string;
    exportPdf: string;
    moreMenu: string;
    minutesAgo: string;
    planCreatedSuccess: string;
  };
  dashboard: {
    title: string;
    description: string;
    createNew: string;
    heroTitle: string;
    heroSubtitle: string;
    heroStats: string;
    quickActions: string;
    recentPlans: string;
    recentPlansDesc: string;
    emptyTitle: string;
    emptyDesc: string;
    stats: {
      total: string;
      totalDesc: string;
      completed: string;
      completedDesc: string;
      draft: string;
      draftDesc: string;
      exported: string;
      exportedDesc: string;
    };
    actions: {
      createNew: string;
      createNewDesc: string;
      import: string;
      importDesc: string;
      allPlans: string;
      allPlansDesc: string;
    };
    table: {
      title: string;
      subject: string;
      grade: string;
      status: string;
      updated: string;
      actions: string;
    };
  };
  status: {
    completed: string;
    published: string;
    draft: string;
    archived: string;
  };
  settings: {
    language: string;
    themeLight: string;
    themeDark: string;
    themeSystem: string;
  };
  subjects: Record<string, string>;
  grades: Record<string, string>;
};
