-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_resourceType_idx" ON "AuditLog"("resourceType");

-- CreateIndex
CREATE INDEX "PdfSource_projectId_idx" ON "PdfSource"("projectId");

-- CreateIndex
CREATE INDEX "PdfSource_extractionStatus_idx" ON "PdfSource"("extractionStatus");

-- CreateIndex
CREATE INDEX "ResearchSource_researchJobId_idx" ON "ResearchSource"("researchJobId");

-- CreateIndex
CREATE INDEX "ResearchSource_createdAt_idx" ON "ResearchSource"("createdAt");
