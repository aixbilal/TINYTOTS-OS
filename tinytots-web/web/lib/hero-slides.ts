export type HeroSlide = {
  image_url: string;
  image_url_mobile: string;
  headline: string;
  subtitle: string;
  button_text: string;
  button_link: string;
  button_text_secondary: string;
  button_link_secondary: string;
};

function cleanText(value: unknown): string {
  if (value == null) return "";
  const text = String(value).trim();
  // Guard against accidental String(null) / JSON-null leakage into stored URLs.
  return text === "null" || text === "undefined" ? "" : text;
}

function mapSlide(s: Record<string, unknown>): HeroSlide {
  return {
    image_url: cleanText(s.image_url),
    image_url_mobile: cleanText(s.image_url_mobile),
    headline: cleanText(s.headline),
    subtitle: cleanText(s.subtitle),
    button_text: cleanText(s.button_text),
    button_link: cleanText(s.button_link),
    button_text_secondary: cleanText(s.button_text_secondary),
    button_link_secondary: cleanText(s.button_link_secondary),
  };
}

/** Normalize DB/admin payload into a clean slide list; fall back to legacy single-hero fields. */
export function resolveHeroSlides(content: {
  hero_slides?: unknown;
  hero_image_url?: string | null;
  hero_image_url_mobile?: string | null;
  hero_headline?: string | null;
  hero_subtext?: string | null;
  hero_button_text?: string | null;
  hero_button_link?: string | null;
}): HeroSlide[] {
  if (Array.isArray(content.hero_slides) && content.hero_slides.length > 0) {
    return content.hero_slides
      .filter((s): s is Record<string, unknown> => !!s && typeof s === "object")
      .map((s, i) => {
        const slide = mapSlide(s);
        // Seed mobile from legacy column when slide 1 has no mobile crop yet.
        if (i === 0 && !slide.image_url_mobile && content.hero_image_url_mobile) {
          slide.image_url_mobile = String(content.hero_image_url_mobile).trim();
        }
        return slide;
      })
      .filter((s) => s.image_url || s.image_url_mobile || s.headline);
  }

  return [
    {
      image_url: String(content.hero_image_url ?? "").trim(),
      image_url_mobile: String(content.hero_image_url_mobile ?? "").trim(),
      headline: String(content.hero_headline ?? "").trim(),
      subtitle: String(content.hero_subtext ?? "").trim(),
      button_text: String(content.hero_button_text ?? "").trim(),
      button_link: String(content.hero_button_link ?? "").trim(),
      button_text_secondary: "",
      button_link_secondary: "",
    },
  ].filter((s) => s.image_url || s.image_url_mobile || s.headline);
}

export function sanitizeHeroSlides(input: unknown): HeroSlide[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((s): s is Record<string, unknown> => !!s && typeof s === "object")
    .map(mapSlide);
}
