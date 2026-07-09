-- CreateEnum
CREATE TYPE "Line" AS ENUM ('MEL_POUR_ANALYS', 'MOULD_RCS', 'CORE_MAKING', 'FINISHING', 'MAINTENANCE', 'DIE_PRESS');

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "line" "Line" NOT NULL,
    "machine" TEXT NOT NULL,
    "problem" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);
