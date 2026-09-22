import type { Metadata } from "next";
import Link from "next/link";
import { StaticPage, Section } from "@/components/static/StaticPage";
import { LOCATION_DISCLAIMER_FULL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: "Terms of Service", description: `The terms that govern the use of ${SITE_NAME}.` };

const LAST_UPDATED = "September 2026";

export default function TermsPage() {
  return (
    <StaticPage eyebrow="Legal" title="Terms of Service" intro={`These terms govern your use of ${SITE_NAME}. By creating an account, creating a memorial or contributing to one, you agree to them. Last updated ${LAST_UPDATED}.`}>
      <Section id="service" title="1. The service">
        <p>
          {SITE_NAME} (“we”, “us”) provides a digital memorial platform: web pages that remember a person, placed as virtual markers on an interactive world map, with photos, stories,
          memories and tributes contributed by members. The service is provided as described on the site and may change over time as we add or refine features.
        </p>
      </Section>

      <Section id="locations" title="2. Memorial locations">
        <p>{LOCATION_DISCLAIMER_FULL}</p>
        <p>
          Selecting a memorial location reserves a virtual point within this platform only. It does not create, transfer or imply any interest in, or association with, any real
          property, land, building, business, organisation or person connected with that place. You must not present a memorial location as anything other than a virtual marker. Any
          information about where a person was laid to rest is provided solely by the memorial creator in the optional “Actual resting place” field and is not verified by us.
        </p>
        <p>
          We may refuse, move, or withdraw memorial locations, and may block geographic areas from new locations, where we consider it necessary for legal, safety, privacy or moderation
          reasons. Locations keep a minimum spacing from each other, which we may adjust.
        </p>
      </Section>

      <Section id="accounts" title="3. Accounts">
        <p>
          You need an account to create a memorial, share memories or save memorials. You are responsible for keeping your sign-in details secure and for activity under your account.
          You must be at least 16 years old, or the age of digital consent where you live, to create an account.
        </p>
      </Section>

      <Section id="acceptable-use" title="4. Acceptable use">
        <p>You agree not to use the service to:</p>
        <ul>
          <li>create a memorial for a person without a genuine connection to them, or impersonate any person or organisation;</li>
          <li>post content that is unlawful, defamatory, harassing, hateful, sexually explicit, or that intrudes on the privacy of others;</li>
          <li>post spam, advertising or misleading information;</li>
          <li>upload content you do not have the right to share, including photographs and text owned by others;</li>
          <li>attempt to interfere with the service, its security, or other members’ accounts, or to scrape data at scale;</li>
          <li>suggest that a memorial location conveys ownership of, access to, or affiliation with any physical place.</li>
        </ul>
      </Section>

      <Section id="content" title="5. Your content">
        <p>
          You keep ownership of everything you upload. You grant us a worldwide, non-exclusive, royalty-free licence to host, store, reproduce, adapt (for example resizing images) and
          display your content for the purpose of operating and promoting the service, according to the privacy settings you choose. You are responsible for having the rights and
          permissions needed to share the content, including consent from people shown in photographs where required.
        </p>
        <p>
          Memories shared by visitors are contributed to the memorial and can be approved, hidden or removed by the people who manage that memorial. Tributes are anonymous counts and
          cannot be withdrawn individually.
        </p>
      </Section>

      <Section id="moderation" title="6. Moderation and reporting">
        <p>
          Every memorial can be reported. We review reports and may hide content, suspend or remove memorials, block users, or block geographic areas where we reasonably believe these
          terms have been breached or where required by law. We will usually give the memorial owner a reason. We are not obliged to pre-screen content and may act on our own
          initiative. Administrative actions are logged.
        </p>
      </Section>

      <Section id="permanence" title="7. Permanence">
        <p>
          We aim to keep memorials available for as long as we operate the service, and we will make reasonable efforts to give notice before any change that would affect access to
          memorials. However, we cannot guarantee availability or permanence beyond the terms of the service, and we may suspend or discontinue features, plans or the service itself.
          You are encouraged to keep your own copies of the content you upload.
        </p>
      </Section>

      <Section id="plans" title="8. Plans and payments">
        <p>
          The service is currently free. We may introduce paid plans with additional features in future. No payment is required today and no card details are collected. When paid
          plans launch, their pricing and terms will be shown before you subscribe.
        </p>
      </Section>

      <Section id="liability" title="9. Disclaimers and liability">
        <p>
          The service is provided “as is” without warranties of any kind, to the extent permitted by law. We do not verify the accuracy of content posted by members. To the fullest
          extent permitted by law, we are not liable for any indirect, incidental or consequential loss arising from your use of the service, and our total liability to you is limited
          to the amount you have paid us in the twelve months before the claim.
        </p>
      </Section>

      <Section id="changes" title="10. Changes and termination">
        <p>
          We may update these terms. If a change is material we will let you know through the service. You may close your account at any time; we may suspend or close accounts that
          breach these terms. Sections that by their nature should survive termination will do so.
        </p>
      </Section>

      <Section id="contact" title="11. Contact">
        <p>
          Questions about these terms can be sent through our <Link href="/contact">contact page</Link>. See also our <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </Section>
    </StaticPage>
  );
}
