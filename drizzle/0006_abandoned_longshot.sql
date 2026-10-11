CREATE TYPE "public"."membership_role" AS ENUM('member', 'space_admin');--> statement-breakpoint
CREATE TYPE "public"."membership_verification" AS ENUM('unverified', 'verified');--> statement-breakpoint
CREATE TYPE "public"."space_access_action" AS ENUM('join', 'request', 'approve', 'reject', 'revoke', 'invite');--> statement-breakpoint
CREATE TYPE "public"."space_access_kind" AS ENUM('open', 'invite_code', 'invite_link', 'manual_approval');--> statement-breakpoint
CREATE TYPE "public"."space_type" AS ENUM('university', 'department', 'theme');--> statement-breakpoint
CREATE TYPE "public"."space_visibility" AS ENUM('public', 'private');--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"space_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"role" "membership_role" DEFAULT 'member' NOT NULL,
	"verification_level" "membership_verification" DEFAULT 'unverified' NOT NULL,
	"verified_via" "space_access_kind",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_admins" (
	"profile_id" uuid PRIMARY KEY NOT NULL,
	"granted_by" uuid,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "space_access_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"space_id" uuid NOT NULL,
	"profile_id" uuid,
	"method" "space_access_kind",
	"action" "space_access_action" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "space_access_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"space_id" uuid NOT NULL,
	"method" "space_access_kind" NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" "space_type" NOT NULL,
	"visibility" "space_visibility" DEFAULT 'public' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by" uuid,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "spaces_slug_check" CHECK ("spaces"."slug" ~ '^[a-z0-9-]{3,40}$'),
	CONSTRAINT "spaces_name_check" CHECK (char_length("spaces"."name") between 3 and 80),
	CONSTRAINT "spaces_description_check" CHECK ("spaces"."description" is null or char_length("spaces"."description") <= 1000)
);
--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_admins" ADD CONSTRAINT "platform_admins_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_admins" ADD CONSTRAINT "platform_admins_granted_by_profiles_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "space_access_log" ADD CONSTRAINT "space_access_log_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "space_access_log" ADD CONSTRAINT "space_access_log_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "space_access_methods" ADD CONSTRAINT "space_access_methods_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spaces" ADD CONSTRAINT "spaces_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "memberships_space_profile_uq" ON "memberships" USING btree ("space_id","profile_id");--> statement-breakpoint
CREATE INDEX "memberships_space_role_idx" ON "memberships" USING btree ("space_id","role");--> statement-breakpoint
CREATE INDEX "memberships_profile_idx" ON "memberships" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "space_access_log_space_idx" ON "space_access_log" USING btree ("space_id","created_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "space_access_log_created_idx" ON "space_access_log" USING btree ("created_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "space_access_methods_space_method_uq" ON "space_access_methods" USING btree ("space_id","method");--> statement-breakpoint
CREATE INDEX "space_access_methods_space_idx" ON "space_access_methods" USING btree ("space_id");--> statement-breakpoint
CREATE UNIQUE INDEX "spaces_slug_uq" ON "spaces" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "spaces_visibility_idx" ON "spaces" USING btree ("visibility","created_at" DESC NULLS LAST,"id" DESC NULLS LAST);