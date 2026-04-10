/*
  Warnings:

  - You are about to drop the `Enterprise` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `sourceConfig` to the `ReportTemplate` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "ReportTemplate_type_key";

-- AlterTable
ALTER TABLE "ReportTemplate" ADD COLUMN     "sourceConfig" JSONB NOT NULL;

-- DropTable
DROP TABLE "Enterprise";

-- CreateTable
CREATE TABLE "MedicalCertificate" (
    "id" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL,
    "enterprise" TEXT NOT NULL,
    "doctorName" TEXT NOT NULL,
    "specialization" TEXT NOT NULL,
    "workerName" TEXT NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "MedicalCertificate_pkey" PRIMARY KEY ("id")
);
