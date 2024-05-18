-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "focusPeriod" INTEGER NOT NULL DEFAULT 25,
    "breakPeriod" INTEGER NOT NULL DEFAULT 5,
    "dayGoal" INTEGER NOT NULL DEFAULT 120,
    "todayStreak" INTEGER NOT NULL DEFAULT 0,
    "currentDayStreak" INTEGER NOT NULL DEFAULT 0,
    "bestDayStreak" INTEGER NOT NULL DEFAULT 0,
    "includeWeekends" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompletedDays" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "day" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompletedDays_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CompletedDays" ADD CONSTRAINT "CompletedDays_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
