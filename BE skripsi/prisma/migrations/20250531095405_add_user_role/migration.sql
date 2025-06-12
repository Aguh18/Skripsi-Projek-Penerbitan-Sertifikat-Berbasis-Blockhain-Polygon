-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ISSUER', 'VERIFIER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'ISSUER';
