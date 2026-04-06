CREATE TABLE "inbound_events" (
  "id" TEXT NOT NULL,
  "event_id" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "producer" TEXT NOT NULL,
  "correlation_id" TEXT NOT NULL,
  "occurred_at_utc" TIMESTAMP(3) NOT NULL,
  "version" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "inbound_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "inbound_events_event_id_key" ON "inbound_events"("event_id");

CREATE TABLE "outbox" (
  "id" TEXT NOT NULL,
  "event_name" TEXT NOT NULL,
  "exchange" TEXT NOT NULL,
  "routing_key" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "retry_count" INTEGER NOT NULL DEFAULT 0,
  "last_error" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "published_at" TIMESTAMP(3),
  CONSTRAINT "outbox_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "outbox_published_at_idx" ON "outbox"("published_at");
