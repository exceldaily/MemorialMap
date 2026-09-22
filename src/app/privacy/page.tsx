import type { Metadata } from "next";
import Link from "next/link";
import { StaticPage, Section } from "@/components/static/StaticPage";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy Policy", description: `How ${SITE_NAME} collects, uses and protects personal information.` };

export default function PrivacyPage() {
  return (
    <StaticPage eyebrow="Legal" title="Privacy Policy" intro="Memorials are personal. This policy explains what we collect, why, and the choices you have. Last updated September 2026.">
      <Section id="collect" title="What we collect">
        <ul>
          <li>
            <strong className="text-ivory-100">Account details</strong> — your email address, a display name, and optionally a profile photo and short bio.
          </li>
          <li>
            <strong className="text-ivory-100">Memorial content</strong> — the names, dates, stories, photos, videos, timelines and memorial locations you add, plus memories and tributes
            contributed by visitors.
          </li>
          <li>
            <strong className="text-ivory-100">Usage information</strong> — page views on memorials (counted, not tracked per person), an anonymous visitor key stored in your browser so
            tributes are not counted twice, and technical logs needed to run and secure the service.
          </li>
          <li>
            <strong className="text-ivory-100">Reports</strong> — when you report content we keep the report, the reason and, if you are not signed in, an optional email address so we can
            follow up.
          </li>
        </ul>
      </Section>

      <Section id="use" title="How we use it">
        <ul>
          <li>To provide the service: display memorials according to their privacy settings, show your name beside your contributions, and let you manage what you create.</li>
          <li>To keep the service safe: moderate content, review reports, prevent abuse and enforce our Terms.</li>
          <li>To communicate with you about your account, security and important changes.</li>
          <li>We do not sell personal information and we do not show third-party advertising.</li>
        </ul>
      </Section>

      <Section id="visibility" title="Who can see what">
        <p>
          Public memorials are visible to anyone, appear on the map and in search, and may be indexed by search engines. Unlisted memorials are reachable only by link and are not
          indexed. Private memorials are visible only to the people who manage them. Your display name and profile photo appear alongside the memories you share and the memorials you
          manage.
        </p>
        <p>
          Memorial locations are virtual markers and are shown to whoever can see the memorial. Please think carefully before choosing a location that reveals a private address.
        </p>
      </Section>

      <Section id="processors" title="Where data is stored">
        <p>
          Content and account data are stored with our hosting and database providers, and maps are rendered using a mapping provider that may receive your approximate location and
          the map areas you view in order to serve map tiles. These providers act on our instructions and are bound by their own privacy commitments.
        </p>
      </Section>

      <Section id="retention" title="Retention and deletion">
        <p>
          We keep memorial content for as long as the memorial exists. You can edit or delete memorials you own, remove your memories, and update your profile at any time. If you close
          your account, memorials you own can be transferred or removed. We keep moderation and security logs for a limited period as required to operate the service.
        </p>
      </Section>

      <Section id="rights" title="Your rights">
        <p>
          Depending on where you live, you may have the right to access, correct, export or delete your personal information, or to object to certain processing. You can manage most
          of this from your <Link href="/account">account</Link>; for anything else, <Link href="/contact">contact us</Link> and we will help.
        </p>
      </Section>

      <Section id="cookies" title="Cookies">
        <p>
          We use strictly necessary cookies to keep you signed in, and browser storage for small conveniences such as the anonymous visitor key used for tributes. We do not use
          advertising or cross-site tracking cookies.
        </p>
      </Section>

      <Section id="children" title="Children">
        <p>
          The service is not directed at children under 16. Memorials may remember people of any age, but accounts must be created by adults or by people over the age of digital consent
          where they live.
        </p>
      </Section>

      <Section id="contact" title="Contact">
        <p>
          Privacy questions and requests can be sent through our <Link href="/contact">contact page</Link>.
        </p>
      </Section>
    </StaticPage>
  );
}
