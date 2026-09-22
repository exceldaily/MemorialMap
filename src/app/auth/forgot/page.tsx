import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotForm } from "@/components/auth/AuthForms";

export const metadata = { title: "Reset password" };

export default function ForgotPage() {
  return (
    <AuthShell title="Reset your password" subtitle="We'll email you a link to choose a new one." footer={<Link href="/auth/sign-in" className="text-gold-400 hover:text-gold-300">Back to sign in</Link>}>
      <ForgotForm />
    </AuthShell>
  );
}
