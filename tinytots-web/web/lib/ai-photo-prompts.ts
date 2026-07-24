// Builds the instruction text sent to Gemini alongside the raw garment image.
// Each "shotType" is a separate, independent call — not one big multi-image
// request — so calls can run in parallel and never hit the single-image-drop
// issue a combined prompt caused in earlier testing.

export type ShotType =
  | "studio"
  | "lifestyle_front"
  | "lifestyle_action"
  | "detail"
  | "back"
  | "group_hero";

interface PromptContext {
  shotType: ShotType;
  colorName?: string;       // e.g. "Red" — used for multi-variant batches
  isGroupShot?: boolean;    // true only for the one combinator image
}

const BASE_ROLE = `You are an elite e-commerce product photographer and art director
for TINYTOTS children's apparel. Completely remove hangers, tags, background
clutter, and wrinkles from the source image. Maintain 100% exact design fidelity:
same colors, stripe/pattern order, collar/ribbing color, sleeve length, fabric
texture, and logo placement as the source photo. Do not invent or alter the
design in any way.`;

const SHOT_PROMPTS: Record<ShotType, string> = {
  studio: `Generate ONE image: a clean e-commerce studio product shot using an
invisible-mannequin / ghost-mannequin technique. Calm, minimalist beige or
pastel studio backdrop, soft diffused lighting, no hangers, no shadows from
hardware. High resolution, ultra-detailed fabric texture.`,

  lifestyle_front: `Generate ONE image: a photorealistic lifestyle photo of a
diverse child model wearing this exact garment, front-facing, in a bright
minimalist indoor studio or playroom setting. Natural joyful expression,
85mm lens look, soft natural lighting, photorealistic skin texture.`,

  lifestyle_action: `Generate ONE image: a candid lifestyle photo of a child
model wearing this exact garment in an outdoor, sunlit park or garden setting,
mid-play or walking. Shallow depth of field, natural golden-hour lighting.`,

  detail: `Generate ONE image: a macro close-up shot focusing on the fabric
texture, collar/neckline, and any logo or print detail of this garment, worn
by a child model. Crisp focus, shallow depth of field.`,

  back: `Generate ONE image: a photorealistic lifestyle shot of a child model
shown from the back or 3/4 angle, wearing this exact garment, so the back
design/construction is visible. Same calm aesthetic background style as the
other shots.`,

  group_hero: `Generate ONE hero image: multiple child models standing
together side-by-side, each wearing a different colorway of this exact
garment style, arranged naturally in a clean, calm studio or lifestyle
setting. All colorways must be clearly visible and distinct.`,
};

export function buildPrompt(ctx: PromptContext): string {
  const colorLine = ctx.colorName
    ? `\n\nThis specific image must show the "${ctx.colorName}" colorway only.`
    : "";

  return `${BASE_ROLE}\n\n${SHOT_PROMPTS[ctx.shotType]}${colorLine}`;
}