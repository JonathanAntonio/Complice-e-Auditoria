-- CreateEnum
CREATE TYPE "NotificationFrequency" AS ENUM ('immediate', 'hourly_digest', 'daily_digest');

-- CreateTable
CREATE TABLE "notification_preferences" (
    "recipient" TEXT NOT NULL,
    "channels" TEXT[],
    "frequency" "NotificationFrequency" NOT NULL DEFAULT 'immediate',
    "grouping" BOOLEAN NOT NULL DEFAULT false,
    "mute_low_medium" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("recipient")
);
