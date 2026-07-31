import { supabaseAdmin } from "@/lib/supabase-admin";

const BUCKET = "product-images";

function storagePathFromPublicUrl(url: string) {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const index = url.indexOf(marker);
  return index === -1 ? null : decodeURIComponent(url.slice(index + marker.length));
}

export async function removeUnreferencedCampaignAssets(urls: Array<string | null>) {
  const candidates = [...new Set(urls.filter((url): url is string => Boolean(url)))];
  if (!candidates.length) return;

  const { data: campaigns } = await supabaseAdmin
    .from("campaigns")
    .select("hero_banner_original_url, hero_banner_preview_url, footer_settings");
  const referenced = new Set<string>();
  for (const campaign of campaigns || []) {
    if (campaign.hero_banner_original_url) referenced.add(campaign.hero_banner_original_url);
    if (campaign.hero_banner_preview_url) referenced.add(campaign.hero_banner_preview_url);
    const footer = campaign.footer_settings as Record<string, unknown> | null;
    if (footer?.qr_code_image_url) referenced.add(String(footer.qr_code_image_url));
  }

  const paths = candidates
    .filter((url) => !referenced.has(url))
    .map(storagePathFromPublicUrl)
    .filter((path): path is string => Boolean(path));
  if (paths.length) await supabaseAdmin.storage.from(BUCKET).remove(paths);
}
