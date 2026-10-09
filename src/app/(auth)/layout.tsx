export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh items-center justify-center px-4 py-10 sm:py-16">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
