-- CreateEnum
CREATE TYPE "ExtractionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PdfSource" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileType" TEXT NOT NULL,
    "pageCount" INTEGER,
    "extractedText" TEXT,
    "extractionStatus" "ExtractionStatus" NOT NULL DEFAULT 'PENDING',
    "extractionError" TEXT,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PdfSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonPlan" (
    "id" TEXT NOT NULL,
    "teacherName" TEXT,
    "schoolName" TEXT,
    "subjectName" TEXT NOT NULL,
    "gradeLevel" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "lessonTitle" TEXT NOT NULL,
    "objectives" TEXT NOT NULL,
    "objectivesJson" JSONB,
    "keyConcepts" TEXT NOT NULL,
    "keyConceptsJson" JSONB,
    "learningActivities" TEXT NOT NULL,
    "learningActivitiesJson" JSONB,
    "mediaResources" TEXT NOT NULL,
    "mediaResourcesJson" JSONB,
    "assessment" TEXT NOT NULL,
    "assessmentJson" JSONB,
    "notes" TEXT,
    "notesJson" JSONB,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LessonPlan_projectId_idx" ON "LessonPlan"("projectId");

-- CreateIndex
CREATE INDEX "LessonPlan_status_idx" ON "LessonPlan"("status");

-- AddForeignKey
ALTER TABLE "PdfSource" ADD CONSTRAINT "PdfSource_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonPlan" ADD CONSTRAINT "LessonPlan_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
