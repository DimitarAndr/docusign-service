-- CreateTable
CREATE TABLE "SentEnvelope" (
    "id" SERIAL NOT NULL,
    "envelopeId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "subject" TEXT,
    "message" TEXT,
    "recipientEmail" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "clientUserId" TEXT,
    "status" TEXT NOT NULL,
    "docusignAccountId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastStatus" TEXT,
    "lastStatusCheckAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "rawResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SentEnvelope_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SentEnvelope_envelopeId_key" ON "SentEnvelope"("envelopeId");

-- CreateIndex
CREATE INDEX "SentEnvelope_status_idx" ON "SentEnvelope"("status");

-- CreateIndex
CREATE INDEX "SentEnvelope_envelopeId_docusignAccountId_idx" ON "SentEnvelope"("envelopeId", "docusignAccountId");
