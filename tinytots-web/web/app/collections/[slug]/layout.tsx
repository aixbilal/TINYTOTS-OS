import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";

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

  return {
    title: name,
    description: `Shop ${name} for kids at TinyTots — soft, durable essentials with free delivery and easy 7-day returns.`,
  };
}

export default function CollectionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
