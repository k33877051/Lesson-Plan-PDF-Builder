-- CreateTable
CREATE TABLE "AiProvider" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "baseUrl" TEXT,
    "apiKeyEnc" TEXT,
    "model" TEXT NOT NULL,
    "settings" JSONB,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiFunction" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "settings" JSONB,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiFunction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiFunctionProvider" (
    "id" TEXT NOT NULL,
    "functionId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AiFunctionProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemObjectRegistry" (
    "id" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "objectName" TEXT NOT NULL,
    "objectType" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemObjectRegistry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiProvider_key_key" ON "AiProvider"("key");

-- CreateIndex
CREATE INDEX "AiProvider_isEnabled_idx" ON "AiProvider"("isEnabled");

-- CreateIndex
CREATE INDEX "AiProvider_isDefault_idx" ON "AiProvider"("isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "AiFunction_key_key" ON "AiFunction"("key");

-- CreateIndex
CREATE INDEX "AiFunction_category_idx" ON "AiFunction"("category");

-- CreateIndex
CREATE INDEX "AiFunction_isEnabled_idx" ON "AiFunction"("isEnabled");

-- CreateIndex
CREATE INDEX "AiFunctionProvider_functionId_idx" ON "AiFunctionProvider"("functionId");

-- CreateIndex
CREATE INDEX "AiFunctionProvider_providerId_idx" ON "AiFunctionProvider"("providerId");

-- CreateIndex
CREATE INDEX "AiFunctionProvider_isEnabled_idx" ON "AiFunctionProvider"("isEnabled");

-- CreateIndex
CREATE UNIQUE INDEX "AiFunctionProvider_functionId_providerId_key" ON "AiFunctionProvider"("functionId", "providerId");

-- CreateIndex
CREATE UNIQUE INDEX "SystemObjectRegistry_objectKey_key" ON "SystemObjectRegistry"("objectKey");

-- CreateIndex
CREATE INDEX "SystemObjectRegistry_objectType_idx" ON "SystemObjectRegistry"("objectType");

-- CreateIndex
CREATE INDEX "SystemObjectRegistry_module_idx" ON "SystemObjectRegistry"("module");

-- CreateIndex
CREATE INDEX "SystemObjectRegistry_isActive_idx" ON "SystemObjectRegistry"("isActive");

-- CreateIndex
CREATE INDEX "SystemObjectRegistry_objectType_module_idx" ON "SystemObjectRegistry"("objectType", "module");

-- AddForeignKey
ALTER TABLE "AiFunctionProvider" ADD CONSTRAINT "AiFunctionProvider_functionId_fkey" FOREIGN KEY ("functionId") REFERENCES "AiFunction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiFunctionProvider" ADD CONSTRAINT "AiFunctionProvider_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "AiProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
