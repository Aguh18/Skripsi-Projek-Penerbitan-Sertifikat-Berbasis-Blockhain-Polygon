-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE;
