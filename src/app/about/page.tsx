import type { Metadata } from "next";
import Link from "next/link";
import { StaticPage, Section } from "@/components/static/StaticPage";
import { LOCATION_DISCLAIMER_FULL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "How it works",
  description: `How ${SITE_NAME} works: choose a place on the world map, create a memorial, share their story and visit anytime.`,
};

const FAQ: { q: string; a: string }[] = [
  {
    q: "Does a memorial location mean the person is buried there?",
    a: "No. A memorial location is a virtual marker on our map — a place that was meaningful to them or to you. If you want to record where someone was laid to rest, there is a separate, optional “Actual resting place” field on the memorial that is written in your own words and is never tied to the map coordinates.",
  },
  {
    q: "Can I choose a famous place, a beach, a stadium or a park?",
    a: "Yes. Meaningful places are exactly what the map is for. Choosing a location does not give you, or imply, any ownership, access, affiliation or endorsement relating to the physical place. In rare cases we may block an area for legal, safety or moderation reasons.",
  },
  {
    q: "What if the spot I want is already taken?",
    a: "Memorial locations keep a small respectful spacing from each other. If a spot is reserved, we suggest nearby available spots. Members of a family group can reserve locations close together.",
  },
  {
    q: "Who can see a memorial?",
    a: "You choose. Public memorials appear on the map and in search. Unlisted memorials are only reachable by link. Private memorials are only visible to you and the people you invite to help manage them.",
  },
  {
    q: "Who can add memories or tributes?",
    a: "Anyone can leave a tribute. Signed-in visitors can share a written memory, with an optional photo. Memories are held for the memorial owner to approve before they are shown.",
  },
  {
    q: "Can I create a memorial for someone who is still living?",
    a: "Yes. Living tributes are a lovely way to celebrate someone. The memorial simply shows their birth year and grows over time.",
  },
  {
    q: "Is it free?",
    a: "Creating a memorial is free. Plans with extras such as unlimited photos, video and family areas are described on the plans page, and no payment is required today.",
  },
  {
    q: "What happens if something is reported?",
    a: "Every memorial has a Report link. Reports are reviewed by our team, who can hide content, suspend a memorial or contact the owner. See the Terms for how moderation works.",
  },
];

export default function AboutPage() {
  return (
    <StaticPage eyebrow="About" title="A place on the world for every story" intro="We believe every person deserves a permanent place where their story can be remembered — not a plot of land, but a point on the world that meant something.">
      <Section id="idea" title="The idea">
        <p>
          {SITE_NAME} is a digital memorial platform built around an interactive world map. Instead of a page that lives nowhere in particular, every memorial has a virtual location: a
          beach they loved, the street they grew up on, the city they called home, the mountain they always talked about.
        </p>
        <p>Visitors can zoom anywhere in the world, find a memorial, and step into a life story — photos, memories from family and friends, a timeline, and tributes left over time.</p>
      </Section>

      <Section id="how" title="How it works">
        <ol className="list-decimal space-y-4 pl-5">
          <li>
            <strong className="text-ivory-100">Choose a place.</strong> Search for a place or drop a pin anywhere on the map. We check that the spot is available and suggest nearby spots if it
            is not. This becomes their memorial location.
          </li>
          <li>
            <strong className="text-ivory-100">Create their memorial.</strong> Add their name and dates, a portrait and cover photo, an epitaph, and their story. Prompts such as “What were they
            known for?” and “What made them laugh?” help when words are hard to find.
          </li>
          <li>
            <strong className="text-ivory-100">Share their story.</strong> Share the link or a QR code with family and friends. They can leave tributes and share memories of their own, which you
            approve before they appear.
          </li>
          <li>
            <strong className="text-ivory-100">Visit anytime.</strong> Their place on the map is always there. Save the memorials you hold close so you can return on the days that matter.
          </li>
        </ol>
        <p>
          <Link href="/create">Create a memorial</Link> or <Link href="/map">explore the map</Link>.
        </p>
      </Section>

      <Section id="locations" title="About memorial locations">
        <p>{LOCATION_DISCLAIMER_FULL}</p>
        <p>
          Locations keep a respectful spacing from one another. Family groups can reserve locations near each other so a family can rest together on the map, with a shared landing page
          and gallery.
        </p>
      </Section>

      <Section id="care" title="Built with care">
        <ul>
          <li>Works for people of any faith or none. We avoid religious imagery by default and let you shape the memorial as you wish.</li>
          <li>Memories are moderated by the people who care for the memorial, and every page can be reported to our team.</li>
          <li>Public memorials are indexable so loved ones can be found; unlisted and private memorials are not.</li>
          <li>Designed for phones first, so a memorial can be visited from anywhere — including from a QR code on a card or keepsake.</li>
        </ul>
      </Section>

      <Section id="faq" title="Questions people ask">
        <dl className="space-y-6">
          {FAQ.map((f) => (
            <div key={f.q}>
              <dt className="font-display text-xl text-ivory-100">{f.q}</dt>
              <dd className="mt-1.5 text-ivory-300">{f.a}</dd>
            </div>
          ))}
        </dl>
        <p>
          Something else on your mind? <Link href="/contact">Get in touch</Link>.
        </p>
      </Section>
    </StaticPage>
  );
}
