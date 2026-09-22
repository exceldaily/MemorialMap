import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignUpForm } from "@/components/auth/AuthForms";

export const metadata = { title: "Create an account" };

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/dashboard" } = await searchParams;
  return (
    <AuthShell
      title="Create your account"
      subtitle="A free account lets you create memorials, leave memories and save the people you love."
      footer={
        <>
          Already have an account?{" "}
          <Link href={`/auth/sign-in?next=${encodeURIComponent(next)}`} className="text-gold-400 hover:text-gold-300">
            Sign in
          </Link>
        </>
      }
    >
      <SignUpForm next={next} />
    </AuthShell>
  );
}
