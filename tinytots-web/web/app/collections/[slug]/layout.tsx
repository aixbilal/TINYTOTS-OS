import type { Metadata } from "next";
import { supabaseAnon as supabase } from "@/lib/supabase-anon";
import { absoluteUrl } from "@/lib/site-url";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { data: category } = await supabase
    .from("categories")
    .select("name")
    .eq("slug", slug)
    .maybeSingle();

  const name = category?.name || slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const title = name;
  const description = `Shop ${name} for kids at TinyTots — soft, durable essentials with free delivery and easy 7-day returns.`;
  const url = absoluteUrl(`/collections/${slug}`);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: `${title} | TinyTots`,
      description,
      url,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | TinyTots`,
      description,
    },
  };
}

export default function CollectionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
