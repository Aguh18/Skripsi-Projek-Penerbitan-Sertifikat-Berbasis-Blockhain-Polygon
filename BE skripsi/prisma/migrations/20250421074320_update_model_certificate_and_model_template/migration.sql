-- CreateTable
CREATE TABLE "Template" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "filePath" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" SERIAL NOT NULL,
    "certificateNumber" VARCHAR(50) NOT NULL,
    "templateId" INTEGER NOT NULL,
    "recipientName" VARCHAR(100) NOT NULL,
    "certificateTitle" VARCHAR(200) NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "description" TEXT,
    "issuerName" VARCHAR(100) NOT NULL,
    "signaturePath" VARCHAR(255),
    "category" VARCHAR(50),
    "targetAddress" VARCHAR(42) NOT NULL,
    "issuerAddress" VARCHAR(42) NOT NULL,
    "hash" VARCHAR(64),
    "qrCodeUrl" VARCHAR(255),
    "filePath" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Template_name_key" ON "Template"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_certificateNumber_key" ON "Certificate"("certificateNumber");

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
