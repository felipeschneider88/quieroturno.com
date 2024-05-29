-- AlterTable
ALTER TABLE "users" ADD COLUMN     "brandColor" TEXT NOT NULL DEFAULT E'#3C73C5';
UPDATE "users" SET "brandColor" = '#3C73C5';
