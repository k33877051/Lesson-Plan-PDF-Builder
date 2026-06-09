-- CreateTable
CREATE TABLE "AppSetting" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "school" TEXT,
    "position" TEXT,
    "theme" TEXT NOT NULL DEFAULT 'system',
    "fontSize" TEXT NOT NULL DEFAULT 'medium',
    "language" TEXT NOT NULL DEFAULT 'th',
    "emailAlerts" BOOLEAN NOT NULL DEFAULT true,
    "exportComplete" BOOLEAN NOT NULL DEFAULT true,
    "newFeatures" BOOLEAN NOT NULL DEFAULT false,
    "weeklyReport" BOOLEAN NOT NULL DEFAULT true,
    "defaultFont" TEXT NOT NULL DEFAULT 'sarabun',
    "defaultHeader" BOOLEAN NOT NULL DEFAULT true,
    "defaultFooter" BOOLEAN NOT NULL DEFAULT true,
    "pageSize" TEXT NOT NULL DEFAULT 'a4',
    "margin" TEXT NOT NULL DEFAULT 'normal',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("id")
);
