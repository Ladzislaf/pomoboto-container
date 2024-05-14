/*
  Warnings:

  - You are about to drop the `PomoUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "PomoUser";

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "focusPeriod" INTEGER NOT NULL DEFAULT 25,
    "breakPeriod" INTEGER NOT NULL DEFAULT 5,
    "dayGoal" INTEGER NOT NULL DEFAULT 120,
    "todayStreak" INTEGER NOT NULL DEFAULT 0,
    "currentDayStreak" INTEGER NOT NULL DEFAULT 0,
    "bestDayStreak" INTEGER NOT NULL DEFAULT 0,
    "includeWeekends" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "completed_days" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "completed_days_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "completed_days_userId_key" ON "completed_days"("userId");

-- AddForeignKey
ALTER TABLE "completed_days" ADD CONSTRAINT "completed_days_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
