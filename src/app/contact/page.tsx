import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Flag, HelpCircle } from "lucide-react";
import { StaticPage, Section } from "@/components/static/StaticPage";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = { title: "Contact", description: `How to reach the ${SITE_NAME} team.` };

const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? `hello@${new URL(SITE_URL).hostname.replace(/^www\./, "")}`;

export default function ContactPage() {
  const subject = encodeURIComponent(`${SITE_NAME} — a question`);
  return (
    <StaticPage eyebrow="Contact" title="We are here to help" intro="Whether you need help with a memorial, want to report a concern, or simply have a question, we read every message.">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { Icon: Mail, title: "Email us", body: "For help with your account or a memorial.", href: `mailto:${CONTACT_EMAIL}?subject=${subject}`, label: CONTACT_EMAIL },
          { Icon: Flag, title: "Report a concern", body: "Use the Report link on any memorial so we can act quickly.", href: "/search", label: "Find the memorial" },
          { Icon: HelpCircle, title: "Common questions", body: "Most answers are in our guide to how the platform works.", href: "/about#faq", label: "Read the FAQ" },
        ].map(({ Icon, title, body, href, label }) => (
          <div key={title} className="card flex flex-col p-5">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gold-400/40 bg-gold-400/10 text-gold-300" aria-hidden>
              <Icon size={18} />
            </span>
            <h2 className="mt-4 text-2xl text-ivory-50">{title}</h2>
            <p className="mt-1 flex-1 text-sm text-ivory-400">{body}</p>
            <Link href={href} className="mt-4 break-all text-sm text-gold-300 underline-offset-4 hover:underline">
              {label}
            </Link>
          </div>
        ))}
      </div>
      <div className="mt-12">
        <Section id="what-to-include" title="What to include">
          <p>To help us respond quickly, please include the link to the memorial you are writing about, the email address on your account, and a short description of what you need.</p>
          <p>
            For requests to remove a memorial that remembers a member of your family, tell us your relationship to the person and we will contact the memorial owner on your behalf.
            Legal and privacy requests are handled as described in our <Link href="/privacy">Privacy Policy</Link>.
          </p>
          <p>We aim to reply within a few working days.</p>
        </Section>
      </div>
    </StaticPage>
  );
}
