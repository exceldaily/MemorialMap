import { env } from "./env";

export const SITE_NAME = env.siteName;
export const SITE_URL = env.siteUrl;
export const SITE_TAGLINE = "Every life deserves a place to be remembered.";
export const SITE_DESCRIPTION =
  "Choose a place in the world. Create a memorial. Give their story somewhere to live forever.";

/** Shown wherever a digital memorial location is selected or displayed. */
export const LOCATION_DISCLAIMER_SHORT =
  "This is a virtual memorial location within our platform. Selecting this location does not provide ownership, access, affiliation, or any rights to the corresponding physical property.";

export const LOCATION_DISCLAIMER_FULL =
  "Memorial locations are virtual markers within this platform. They do not represent physical burial locations unless independently stated by the memorial creator and do not convey ownership, occupancy, access, affiliation, endorsement, or any legal rights relating to the corresponding physical location.";

export const TRIBUTES: { type: "remembering" | "flower" | "candle" | "thinking"; emoji: string; label: string }[] = [
  { type: "remembering", emoji: "❤️", label: "Remembering You" },
  { type: "flower", emoji: "🌹", label: "Leave a Flower" },
  { type: "candle", emoji: "🕯", label: "Light a Candle" },
  { type: "thinking", emoji: "🕊", label: "Thinking of You" },
];

export const REPORT_REASONS: { value: string; label: string }[] = [
  { value: "spam", label: "Spam" },
  { value: "impersonation", label: "Impersonation" },
  { value: "harassment", label: "Harassment" },
  { value: "inappropriate_content", label: "Inappropriate content" },
  { value: "incorrect_information", label: "Incorrect information" },
  { value: "copyright", label: "Copyright" },
  { value: "privacy", label: "Privacy" },
  { value: "other", label: "Other" },
];

export const RELATIONSHIP_LABELS: Record<string, string> = {
  parent: "Parent",
  child: "Child",
  spouse: "Spouse",
  sibling: "Sibling",
  grandparent: "Grandparent",
  grandchild: "Grandchild",
  other: "Family",
};

export function memorialUrl(slug: string) {
  return `${SITE_URL}/memorial/${slug}`;
}
