-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "industrySupervisorId" TEXT,
ADD COLUMN     "schoolSupervisorId" TEXT;

-- CreateIndex
CREATE INDEX "Student_industrySupervisorId_idx" ON "Student"("industrySupervisorId");

-- CreateIndex
CREATE INDEX "Student_schoolSupervisorId_idx" ON "Student"("schoolSupervisorId");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_industrySupervisorId_fkey" FOREIGN KEY ("industrySupervisorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_schoolSupervisorId_fkey" FOREIGN KEY ("schoolSupervisorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
