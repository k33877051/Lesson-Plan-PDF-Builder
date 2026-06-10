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
    export: string;
    exportPdf: string;
    moreMenu: string;
    minutesAgo: string;
    planCreatedSuccess: string;
    save: string;
    saving: string;
    saved: string;
    delete: string;
    deleting: string;
    all: string;
    allSubjects: string;
    statusLabel: string;
    createdLabel: string;
    openPage: string;
    subject: string;
    loadError: string;
    saveError: string;
    saveSuccess: string;
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
  lessonPlans: {
    title: string;
    description: string;
    createNew: string;
    deleteConfirm: string;
    deleteSuccess: string;
    deleteError: string;
    filters: {
      status: string;
      subject: string;
    };
  };
  help: {
    title: string;
    description: string;
    sections: {
      create: { title: string; description: string };
      upload: { title: string; description: string };
      ai: { title: string; description: string };
      export: { title: string; description: string };
    };
  };
  editor: {
    createTitle: string;
    editTitle: string;
    unsavedChanges: string;
    savedState: string;
    wizardStep: string;
    tabs: {
      basic: string;
      content: string;
      research: string;
      review: string;
    };
    wizard: {
      basic: string;
      basicShort: string;
      content: string;
      contentShort: string;
      research: string;
      researchShort: string;
      review: string;
      reviewShort: string;
    };
    generalInfo: { title: string; description: string };
    subjectInfo: { title: string; description: string };
    fields: {
      teacherName: string;
      schoolName: string;
      academicYear: string;
      semester: string;
      subject: string;
      grade: string;
      lessonTitle: string;
      researchTopic: string;
      researchTopicHint: string;
    };
    placeholders: {
      teacherName: string;
      schoolName: string;
      academicYear: string;
      semester: string;
      subject: string;
      grade: string;
      lessonTitle: string;
      researchTopic: string;
    };
    sections: {
      objectives: { title: string; description: string; placeholder: string };
      keyConcepts: { title: string; description: string; placeholder: string };
      activities: { title: string; description: string; placeholder: string };
      media: { title: string; description: string; placeholder: string };
      assessment: { title: string; description: string; placeholder: string };
      notes: { title: string; description: string; placeholder: string };
    };
    useResearch: string;
    review: {
      title: string;
      description: string;
      unitName: string;
      subjectGrade: string;
      teacherSchool: string;
      savePlan: string;
    };
    academicYearLabel: string;
  };
  settings: {
    title: string;
    description: string;
    loading: string;
    loadError: string;
    saveError: string;
    saveSuccess: string;
    saveButton: string;
    tabs: {
      profile: string;
      appearance: string;
      notifications: string;
      pdf: string;
      aiProviders: string;
      aiFunctions: string;
      registry: string;
      github: string;
    };
    profile: {
      title: string;
      description: string;
      name: string;
      position: string;
      email: string;
      phone: string;
      school: string;
      namePlaceholder: string;
      positionPlaceholder: string;
      schoolPlaceholder: string;
    };
    appearance: {
      title: string;
      description: string;
      theme: string;
      language: string;
      fontSize: string;
      fontSmall: string;
      fontMedium: string;
      fontLarge: string;
    };
    notifications: {
      title: string;
      description: string;
      emailAlerts: string;
      emailAlertsDesc: string;
      exportComplete: string;
      exportCompleteDesc: string;
      newFeatures: string;
      newFeaturesDesc: string;
      weeklyReport: string;
      weeklyReportDesc: string;
    };
    pdf: {
      title: string;
      description: string;
      defaultFont: string;
      pageSize: string;
      showHeader: string;
      showHeaderDesc: string;
      showFooter: string;
      showFooterDesc: string;
    };
    language: string;
    themeLight: string;
    themeDark: string;
    themeSystem: string;
  };
  status: {
    completed: string;
    published: string;
    draft: string;
    archived: string;
  };
  subjects: Record<string, string>;
  grades: Record<string, string>;
  semesters: Record<string, string>;
};
