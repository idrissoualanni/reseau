import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthFormSkeleton } from "@/components/auth-form-skeleton";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Se connecter" };

export default function SignInPage() {
  return (
    <Suspense fallback={<AuthFormSkeleton />}>
      <SignInForm />
    </Suspense>
  );
}
