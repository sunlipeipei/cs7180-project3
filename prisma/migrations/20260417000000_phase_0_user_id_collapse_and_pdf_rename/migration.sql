-- Migration: phase_0_user_id_collapse_and_pdf_rename
-- Decision D1: Collapse User.id to equal Clerk user ID (drop separate CUID + clerkId column).
-- Also rename Resume.docxPath → pdfPath.

-- Step 1: Backfill User.id with clerkId (no-op if DB is empty, safe if rows exist).
UPDATE "User" SET id = "clerkId" WHERE id <> "clerkId";

-- Step 2: Drop FK constraints on tables that reference User.id.
ALTER TABLE "Profile"        DROP CONSTRAINT "Profile_userId_fkey";
ALTER TABLE "JobDescription" DROP CONSTRAINT "JobDescription_userId_fkey";
ALTER TABLE "Resume"         DROP CONSTRAINT "Resume_userId_fkey";

-- Step 3: Update child userId values to match new User.id (= clerkId).
-- (No-op when rows are already consistent after Step 1 propagation; safe to run.)
UPDATE "Profile"        p SET "userId" = u."clerkId" FROM "User" u WHERE p."userId" = u.id;
UPDATE "JobDescription" j SET "userId" = u."clerkId" FROM "User" u WHERE j."userId" = u.id;
UPDATE "Resume"         r SET "userId" = u."clerkId" FROM "User" u WHERE r."userId" = u.id;

-- Step 4: Drop the clerkId unique index and column.
DROP INDEX "User_clerkId_key";
ALTER TABLE "User" DROP COLUMN "clerkId";

-- Step 5: Drop the DEFAULT (cuid()) on User.id.
-- PostgreSQL stores the default on the column; Prisma sets it via a DEFAULT clause.
-- Removing the default so id must be supplied explicitly.
ALTER TABLE "User" ALTER COLUMN "id" DROP DEFAULT;

-- Step 6: Re-add FK constraints.
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "JobDescription" ADD CONSTRAINT "JobDescription_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Resume" ADD CONSTRAINT "Resume_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 7: Rename Resume.docxPath → pdfPath.
ALTER TABLE "Resume" RENAME COLUMN "docxPath" TO "pdfPath";
