-- CreateTable
CREATE TABLE "moc_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "description" TEXT,
    "initiatorId" TEXT NOT NULL,
    "deptHeadId" TEXT,
    "safetyLeadId" TEXT,
    "siteId" TEXT,
    "unitId" TEXT,
    "processArea" TEXT,
    "rawMaterial" TEXT,
    "facilityLayoutChange" BOOLEAN NOT NULL DEFAULT false,
    "sifOrSisChange" BOOLEAN NOT NULL DEFAULT false,
    "bypassedSafeguard" BOOLEAN NOT NULL DEFAULT false,
    "temporaryDurationDays" INTEGER,
    "effectiveDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "moc_requests_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "moc_requests_deptHeadId_fkey" FOREIGN KEY ("deptHeadId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "moc_requests_safetyLeadId_fkey" FOREIGN KEY ("safetyLeadId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "approval_steps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mocRequestId" TEXT NOT NULL,
    "stepName" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "assignedToId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "comments" TEXT,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "approval_steps_mocRequestId_fkey" FOREIGN KEY ("mocRequestId") REFERENCES "moc_requests" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "approval_steps_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cost_matrices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mocRequestId" TEXT NOT NULL,
    "costCategory" TEXT NOT NULL,
    "estimatedCost" REAL NOT NULL,
    "actualCost" REAL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "approvedById" TEXT,
    "approvalStatus" TEXT NOT NULL DEFAULT 'Pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "cost_matrices_mocRequestId_fkey" FOREIGN KEY ("mocRequestId") REFERENCES "moc_requests" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "cost_matrices_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "moc_requests_requestNumber_key" ON "moc_requests"("requestNumber");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
