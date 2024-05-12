-- CreateTable
CREATE TABLE "PomoUser" (
    "id" TEXT NOT NULL,
    "focusPeriod" INTEGER NOT NULL DEFAULT 25,
    "breakPeriod" INTEGER NOT NULL DEFAULT 5,
    "dayGoal" INTEGER NOT NULL DEFAULT 120,
    "todayStreak" INTEGER NOT NULL DEFAULT 0,
    "dayStreak" INTEGER NOT NULL DEFAULT 0,
    "includeWeekends" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PomoUser_pkey" PRIMARY KEY ("id")
);
