import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthFormSkeleton } from "@/components/auth-form-skeleton";
import { VerifyEmailForm } from "./verify-email-form";

export const metadata: Metadata = { title: "Vérifier mon e-mail" };

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<AuthFormSkeleton />}>
      <VerifyEmailForm />
    </Suspense>
  );
}
