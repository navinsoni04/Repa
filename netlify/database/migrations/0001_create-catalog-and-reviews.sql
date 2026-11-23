CREATE TABLE "catalog" (
	"id" integer PRIMARY KEY,
	"data" jsonb NOT NULL,
	"revision" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"text" text NOT NULL,
	"stars" integer NOT NULL,
	"approved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
