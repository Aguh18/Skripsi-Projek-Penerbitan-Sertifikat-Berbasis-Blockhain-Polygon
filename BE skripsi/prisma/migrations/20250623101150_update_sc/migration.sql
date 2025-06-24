-- CreateTable
CREATE TABLE "IssuerApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IssuerApplication_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "IssuerApplication" ADD CONSTRAINT "IssuerApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE;
