-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "roleTitle" TEXT NOT NULL,
    "access" TEXT NOT NULL DEFAULT 'CONTRIBUTOR',
    "avatarHue" INTEGER NOT NULL DEFAULT 250,
    "initials" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sector" TEXT NOT NULL DEFAULT '',
    "contact" TEXT NOT NULL DEFAULT '',
    "portal" TEXT NOT NULL DEFAULT '',
    "loginRef" TEXT NOT NULL DEFAULT '',
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "StatusConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "hue" INTEGER NOT NULL,
    "order" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ref" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "portal" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL DEFAULT 'BID',
    "classification" TEXT NOT NULL DEFAULT '',
    "procurement" TEXT NOT NULL DEFAULT '',
    "statusId" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "ownerId" TEXT,
    "reviewerId" TEXT,
    "rfpReceived" DATETIME,
    "siteVisit" DATETIME,
    "questionDeadline" DATETIME,
    "bidDue" DATETIME,
    "submission" DATETIME,
    "followUp" DATETIME,
    "bondRequired" BOOLEAN NOT NULL DEFAULT false,
    "bondPct" REAL NOT NULL DEFAULT 0,
    "bondValidity" DATETIME,
    "result" TEXT NOT NULL DEFAULT 'NONE',
    "estValue" REAL NOT NULL DEFAULT 0,
    "notes" TEXT NOT NULL DEFAULT '',
    "checklist" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Opportunity_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Opportunity_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "StatusConfig" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Opportunity_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Opportunity_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "oppId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL DEFAULT '',
    "kind" TEXT NOT NULL DEFAULT 'file',
    "meta" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "Document_oppId_fkey" FOREIGN KEY ("oppId") REFERENCES "Opportunity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FollowUp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "oppId" TEXT NOT NULL,
    "n" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "dueAt" DATETIME,
    "done" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "FollowUp_oppId_fkey" FOREIGN KEY ("oppId") REFERENCES "Opportunity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "oppId" TEXT NOT NULL,
    "userId" TEXT,
    "verb" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityLog_oppId_fkey" FOREIGN KEY ("oppId") REFERENCES "Opportunity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SavedView" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "config" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "StatusConfig_label_key" ON "StatusConfig"("label");

-- CreateIndex
CREATE UNIQUE INDEX "Opportunity_ref_key" ON "Opportunity"("ref");
