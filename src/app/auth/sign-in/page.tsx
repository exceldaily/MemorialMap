import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignInForm } from "@/components/auth/AuthForms";

export const metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next = "/dashboard", error } = await searchParams;
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to visit, create and care for memorials."
      footer={
        <>
          New here?{" "}
          <Link href={`/auth/sign-up?next=${encodeURIComponent(next)}`} className="text-gold-400 hover:text-gold-300">
            Create an account
          </Link>
        </>
      }
    >
      <SignInForm next={next} initialError={error} />
    </AuthShell>
  );
}
