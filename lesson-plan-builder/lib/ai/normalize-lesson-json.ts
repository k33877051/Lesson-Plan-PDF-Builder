/** แปลงรายการ string เป็น object สำหรับ activities */
function normalizeActivityItem(item: unknown): Record<string, unknown> {
  if (typeof item === "string") {
    return {
      phase: "ขณะเรียน",
      title: item,
      description: item,
      duration: "",
    };
  }
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    return {
      phase: "ขณะเรียน",
      title: "",
      description: "",
      duration: "",
    };
  }
  const act = item as Record<string, unknown>;
  return {
    phase: act.phase ?? "ขณะเรียน",
    title: act.title ?? "",
    description: act.description ?? "",
    duration: typeof act.duration === "string" ? act.duration : "",
  };
}

/** แปลงรายการ string เป็น object สำหรับ assessment */
function normalizeAssessmentItem(item: unknown): Record<string, unknown> {
  if (typeof item === "string") {
    return { method: item, criteria: item, tool: "" };
  }
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    return { method: "", criteria: "", tool: "" };
  }
  const a = item as Record<string, unknown>;
  return {
    method: a.method ?? "",
    criteria: a.criteria ?? "",
    tool: typeof a.tool === "string" ? a.tool : "",
  };
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item : String(item ?? "")))
      .filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }
  return [];
}

/** ปรับ JSON จาก Ollama ให้มี keys ครบก่อน validate */
export function normalizeLessonPlanAiJson(raw: unknown): unknown {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return raw;
  }

  const obj = raw as Record<string, unknown>;
  const activitiesRaw = obj.activities ?? obj.learningActivities;
  const activities = Array.isArray(activitiesRaw)
    ? activitiesRaw
    : typeof activitiesRaw === "string"
      ? [activitiesRaw]
      : [];
  const assessmentRaw = obj.assessment;
  const assessment = Array.isArray(assessmentRaw)
    ? assessmentRaw
    : typeof assessmentRaw === "string"
      ? [assessmentRaw]
      : [];

  return {
    objectives: toStringArray(obj.objectives),
    keyConcepts: toStringArray(obj.keyConcepts ?? obj.key_concepts),
    activities: activities.map(normalizeActivityItem),
    assessment: assessment.map(normalizeAssessmentItem),
    summary: typeof obj.summary === "string" ? obj.summary : "",
    mediaResources: toStringArray(obj.mediaResources ?? obj.media_resources),
  };
}

/** ปรับ JSON สำหรับ generate-lesson schema */
export function normalizeGenerateLessonJson(raw: unknown): unknown {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return raw;
  }

  const obj = raw as Record<string, unknown>;
  const base = normalizeLessonPlanAiJson({
    ...obj,
    activities: obj.learningActivities ?? obj.activities,
  }) as Record<string, unknown>;

  const learningActivitiesRaw = obj.learningActivities ?? obj.activities;
  const learningActivities = Array.isArray(learningActivitiesRaw)
    ? learningActivitiesRaw
    : typeof learningActivitiesRaw === "string"
      ? [learningActivitiesRaw]
      : [];

  return {
    lessonTitle:
      typeof obj.lessonTitle === "string"
        ? obj.lessonTitle
        : typeof obj.lesson_title === "string"
          ? obj.lesson_title
          : "",
    objectives: base.objectives,
    keyConcepts: base.keyConcepts,
    learningActivities: learningActivities.map((item) => {
      const act = normalizeActivityItem(item);
      const rawAct =
        item && typeof item === "object" && !Array.isArray(item)
          ? (item as Record<string, unknown>)
          : {};
      const duration =
        typeof rawAct.durationMinutes === "number"
          ? rawAct.durationMinutes
          : typeof rawAct.duration_minutes === "number"
            ? rawAct.duration_minutes
            : 0;
      return {
        phase: act.phase,
        title: act.title,
        description: act.description,
        durationMinutes: duration,
      };
    }),
    assessment: base.assessment,
    mediaResources: base.mediaResources,
    notes: typeof obj.notes === "string" ? obj.notes : "",
  };
}
