CREATE TABLE "auth_otp_audit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"type" text NOT NULL,
	"outcome" text NOT NULL,
	"error_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_otp_audit_email_check" CHECK (char_length("auth_otp_audit"."email") between 3 and 254),
	CONSTRAINT "auth_otp_audit_type_check" CHECK ("auth_otp_audit"."type" in ('email-verification','forgot-password')),
	CONSTRAINT "auth_otp_audit_outcome_check" CHECK ("auth_otp_audit"."outcome" in ('sent','failed'))
);
--> statement-breakpoint
CREATE INDEX "auth_otp_audit_created_idx" ON "auth_otp_audit" USING btree ("created_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "auth_otp_audit_email_idx" ON "auth_otp_audit" USING btree ("email");
