/*
  Warnings:

  - The primary key for the `Certificate` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `category` on the `Certificate` table. All the data in the column will be lost.
  - You are about to drop the column `certificateNumber` on the `Certificate` table. All the data in the column will be lost.
  - You are about to drop the column `hash` on the `Certificate` table. All the data in the column will be lost.
  - You are about to drop the column `qrCodeUrl` on the `Certificate` table. All the data in the column will be lost.
  - You are about to drop the column `signaturePath` on the `Certificate` table. All the data in the column will be lost.
  - The primary key for the `Template` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "Certificate" DROP CONSTRAINT "Certificate_templateId_fkey";

-- DropIndex
DROP INDEX "Certificate_certificateNumber_key";

-- AlterTable
ALTER TABLE "Certificate" DROP CONSTRAINT "Certificate_pkey",
DROP COLUMN "category",
DROP COLUMN "certificateNumber",
DROP COLUMN "hash",
DROP COLUMN "qrCodeUrl",
DROP COLUMN "signaturePath",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "templateId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Certificate_id_seq";

-- AlterTable
ALTER TABLE "Template" DROP CONSTRAINT "Template_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Template_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Template_id_seq";

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
