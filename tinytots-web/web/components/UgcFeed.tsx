"use client";

import { useEffect, useState } from "react";

interface UgcPost {
  id: number;
  image_url: string;
  caption: string | null;
  instagram_handle: string | null;
  link: string | null;
}

function normalizeLink(link: string | null): string | null {
  if (!link) return null;
  const trimmed = link.trim();
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export default function UgcFeed() {
  const [posts, setPosts] = useState<UgcPost[]>([]);

  useEffect(() => {
    fetch("/api/ugc-posts")
      .then((res) => res.json())
      .then((json) => setPosts(json.posts || []))
      .catch(() => setPosts([]));
  }, []);

  if (posts.length === 0) return null;

  return (
    <section className="w-full bg-surface-elevated border-t border-border-default py-stack-lg">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="text-center mb-stack-md">
          <h2 className="font-headline-lg text-text-primary mb-1">Tag Us to Be Featured</h2>
          <p className="font-body-sm text-body-sm text-text-secondary">
            Tag <span className="text-brand-primary font-medium">@TinyTots</span> for a chance to be featured here.
          </p>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
          {posts.map((post) => {
            const content = (
              <div className="relative aspect-square rounded-lg overflow-hidden group">
                <img src={post.image_url} alt={post.caption || ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                {post.instagram_handle && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end p-2 opacity-0 group-hover:opacity-100">
                    <span className="text-white font-label-md text-label-md truncate">{post.instagram_handle}</span>
                  </div>
                )}
              </div>
            );
            const href = normalizeLink(post.link);
            return href ? (
              <a key={post.id} href={href} target="_blank" rel="noreferrer">
                {content}
              </a>
            ) : (
              <div key={post.id}>{content}</div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
