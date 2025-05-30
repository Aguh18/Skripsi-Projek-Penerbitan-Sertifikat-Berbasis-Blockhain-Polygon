/*
  Warnings:

  - Added the required column `userId` to the `Template` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Template" ADD COLUMN     "userId" VARCHAR(255) NOT NULL;
