/*
  Warnings:

  - Added the required column `ipfsCid` to the `Certificate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `Certificate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Certificate" ADD COLUMN     "ipfsCid" VARCHAR(255) NOT NULL,
ADD COLUMN     "status" VARCHAR(20) NOT NULL;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_issuerAddress_fkey" FOREIGN KEY ("issuerAddress") REFERENCES "User"("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_targetAddress_fkey" FOREIGN KEY ("targetAddress") REFERENCES "User"("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE;
