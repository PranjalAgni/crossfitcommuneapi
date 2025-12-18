-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED');

-- CreateEnum
CREATE TYPE "InviteRole" AS ENUM ('member', 'admin');

-- CreateTable
CREATE TABLE "MemberInvite" (
    "email" TEXT NOT NULL,
    "role" "InviteRole" NOT NULL DEFAULT 'member',
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "createdBy" UUID,

    CONSTRAINT "MemberInvite_pkey" PRIMARY KEY ("email")
);

-- CreateIndex
CREATE INDEX "MemberInvite_status_idx" ON "MemberInvite"("status");

-- CreateIndex
CREATE INDEX "MemberInvite_expiresAt_idx" ON "MemberInvite"("expiresAt");
