"use client";

import type { CSSProperties } from "react";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Playfair_Display } from "next/font/google";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Camera,
  Globe,
  Heart,
  Leaf,
  Link as LinkIcon,
  Music2,
  Pin,
  RefreshCw,
  ShieldCheck,
  Shirt,
  Sparkles,
  Truck,
  ThumbsUp,
  Users,
  Wind,
  type LucideIcon,
} from "lucide-react";
import {
  DEFAULT_CAMPAIGN_THEME,
  type BannerFocalPoint,
  type CampaignFooterSettings,
  type CampaignSocialLink,
  type CampaignTheme,
} from "@/lib/signage-campaign";
import { supabase } from "@/lib/supabase";
import styles from "./signage.module.css";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["700", "800"] });

type FeatureItem = { icon: string; title: string; description: string };
type StatItem = { icon: string; number: string; description: string };
type Product = { id: number; name: string; image_url: string | null; category: string | null };
type TrustItem = { id: number; icon: string; heading: string; description: string };
type Testimonial = { name: string; image_url: string | null; rating: number; quote: string };

type Campaign = {
  _id?: number;
  _updated_at?: string;
  collection_label: string;
  heading: string;
  subtitle: string;
  description: string;
  cta_text: string;
  cta_url: string;
  cta_visible: boolean;
  hero_banner_original_url?: string | null;
  hero_banner_preview_url?: string | null;
  hero_banner_focal_point?: BannerFocalPoint;
  hero_badge: string | null;
  feature_list: FeatureItem[];
  statistics: StatItem[];
  featured_heading: string;
  featured_description: string;
  featured_button_text: string;
  marquee_speed_seconds: number;
  marquee_direction: "left" | "right";
  theme: CampaignTheme;
};

type CampaignPayload = {
  campaign: Campaign | null;
  featured_products: Product[];
  trust_items: TrustItem[];
  testimonials: Testimonial[];
  social_links: CampaignSocialLink[];
  footer_settings: CampaignFooterSettings | null;
};

const ICON_COMPONENTS: Record<string, LucideIcon> = {
  eco: Leaf,
  spa: Sparkles,
  verified_user: ShieldCheck,
  verified: BadgeCheck,
  shield_check: ShieldCheck,
  local_shipping: Truck,
  sync_alt: RefreshCw,
  group: Users,
  checkroom: Shirt,
  air: Wind,
  favorite: Heart,
};

function SignageIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_COMPONENTS[name] || Sparkles;
  return <Icon className={`${styles.icon} ${className || ""}`} aria-hidden="true" strokeWidth={1.8} />;
}

function themeVariables(theme: CampaignTheme): CSSProperties {
  return {
    "--campaign-primary": theme.primary,
    "--campaign-secondary": theme.secondary,
    "--campaign-accent": theme.accent,
    "--campaign-button": theme.button,
    "--campaign-button-text": theme.buttonText,
    "--campaign-badge": theme.badge,
    "--campaign-badge-text": theme.badgeText,
    "--campaign-background": theme.background,
    "--campaign-surface": theme.surface,
    "--campaign-card": theme.card,
    "--campaign-text": theme.text,
    "--campaign-muted-text": theme.mutedText,
    "--campaign-border": theme.border,
    "--campaign-icon": theme.icon,
    "--campaign-footer": theme.footer,
    "--campaign-footer-text": theme.footerText,
  } as CSSProperties;
}

function Header() {
  return (
    <header className={styles.header}>
      <span className={`${playfair.className} ${styles.logo}`}>TinyTots</span>
      <span className={styles.brandLine}>Premium Kids Wear</span>
    </header>
  );
}

function Artwork({ campaign }: { campaign: Campaign }) {
  const focal = campaign.hero_banner_focal_point || { x: 50, y: 50 };
  const bannerUrl = campaign.hero_banner_preview_url;

  return (
    <div className={styles.bannerColumn}>
      <div className={styles.banner}>
        {bannerUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bannerUrl}
            alt=""
            className={styles.bannerImage}
            style={{ objectPosition: `${focal.x}% ${focal.y}%` }}
          />
        )}

        {campaign.hero_badge && <div className={styles.badge}>{campaign.hero_badge}</div>}
        {campaign.feature_list.length > 0 && (
          <div className={styles.features}>
            {campaign.feature_list.map((feature, index) => (
              <div className={styles.feature} key={`${feature.title}-${index}`}>
                <SignageIcon name={feature.icon} className={styles.featureIcon} />
                <span>{feature.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Hero({ campaign }: { campaign: Campaign }) {
  return (
    <section className={styles.hero}>
      <div className={styles.heroCopy}>
        <span className={styles.eyebrow}>{campaign.collection_label}</span>
        <h1 className={`${playfair.className} ${styles.heroHeading}`}>
          {campaign.heading.split("\n").map((line, index) => (
            <span key={`${line}-${index}`}>{line}</span>
          ))}
        </h1>
        <div className={styles.divider} />
        <span className={styles.subtitle}>{campaign.subtitle}</span>
        <p className={styles.description}>{campaign.description}</p>
        {campaign.cta_visible && (
          <a href={campaign.cta_url} className={styles.cta}>
            {campaign.cta_text}
            <ArrowRight className={styles.icon} aria-hidden="true" />
          </a>
        )}
      </div>

      <Artwork campaign={campaign} />

      <div className={styles.stats}>
        {campaign.statistics.map((stat, index) => (
          <div className={styles.stat} key={`${stat.number}-${index}`}>
            <SignageIcon name={stat.icon} className={styles.statIcon} />
            <span className={styles.statNumber}>{stat.number}</span>
            <span className={styles.statDescription}>{stat.description}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeaturedCollection({ campaign, products }: { campaign: Campaign; products: Product[] }) {
  const animationClass = campaign.marquee_direction === "right" ? styles.marqueeRight : styles.marqueeLeft;
  const productCards = (duplicate: boolean) =>
    products.map((product) => (
      <div className={styles.productCard} key={`${duplicate ? "copy" : "original"}-${product.id}`}>
        {product.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image_url} alt={duplicate ? "" : product.name} draggable={false} />
        )}
        <Heart className={`${styles.icon} ${styles.favorite}`} aria-hidden="true" strokeWidth={1.8} />
      </div>
    ));

  return (
    <section className={styles.featured}>
      <div className={styles.featuredCopy}>
        <div className={styles.featuredRule} />
        <h2 className={styles.sectionHeading}>{campaign.featured_heading}</h2>
        <p className={styles.featuredDescription}>{campaign.featured_description}</p>
        <Link href="/products" className={styles.featuredLink}>
          {campaign.featured_button_text} →
        </Link>
      </div>
      <div className={styles.marquee} aria-label="Featured products">
        <div
          className={`${styles.marqueeTrack} ${animationClass}`}
          style={{
            animationDuration: `${campaign.marquee_speed_seconds || 45}s`,
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
          }}
        >
          <div className={styles.marqueeGroup}>{productCards(false)}</div>
          <div className={styles.marqueeGroup} aria-hidden="true">
            {productCards(true)}
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustStrip({ items }: { items: TrustItem[] }) {
  return (
    <section className={styles.trust}>
      {items.map((item) => (
        <div className={styles.trustItem} key={item.id}>
          <SignageIcon name={item.icon} className={styles.trustIcon} />
          <div>
            <p className={styles.trustHeading}>{item.heading}</p>
            <p className={styles.trustDescription}>{item.description}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
  const pairs: Testimonial[][] = [];
  for (let index = 0; index < testimonials.length; index += 2) {
    pairs.push(testimonials.slice(index, index + 2));
  }
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (pairs.length <= 1) return;
    const timer = setInterval(() => setActiveIndex((current) => (current + 1) % pairs.length), 7000);
    return () => clearInterval(timer);
  }, [pairs.length]);

  const move = (delta: number) => {
    if (pairs.length > 0) {
      setActiveIndex((current) => (current + delta + pairs.length) % pairs.length);
    }
  };
  const visibleIndex = Math.min(activeIndex, Math.max(0, pairs.length - 1));

  if (pairs.length === 0) return <section className={styles.testimonials} aria-hidden="true" />;

  return (
    <section className={styles.testimonials}>
      <div className={styles.testimonialTitleRow}>
        <span className={styles.testimonialTitleLine} aria-hidden="true" />
        <h2 className={styles.testimonialTitle}>Loved by Parents</h2>
        <span className={styles.testimonialTitleLine} aria-hidden="true" />
      </div>
      <div className={styles.testimonialRow}>
        <button className={styles.arrow} onClick={() => move(-1)} aria-label="Previous testimonials">
          <ArrowLeft className={styles.icon} aria-hidden="true" />
        </button>
        <div className={styles.testimonialCards}>
          {(pairs[visibleIndex] || []).map((testimonial, index) => (
            <article className={styles.testimonialCard} key={`${testimonial.name}-${index}`}>
              <div className={styles.avatar}>
                {testimonial.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={testimonial.image_url} alt="" />
                ) : (
                  <span className={styles.avatarFallback}>{testimonial.name.charAt(0)}</span>
                )}
              </div>
              <div>
                <div className={styles.stars}>
                  {"★".repeat(testimonial.rating)}
                  {"☆".repeat(5 - testimonial.rating)}
                </div>
                <p className={styles.customerName}>{testimonial.name}</p>
                <p className={styles.quote}>{testimonial.quote}</p>
              </div>
            </article>
          ))}
        </div>
        <button className={styles.arrow} onClick={() => move(1)} aria-label="Next testimonials">
          <ArrowRight className={styles.icon} aria-hidden="true" />
        </button>
      </div>
      <div className={styles.dots}>
        {pairs.map((_, index) => (
          <span
            className={`${styles.dot} ${index === visibleIndex ? styles.activeDot : ""}`}
            key={index}
          />
        ))}
      </div>
    </section>
  );
}

function Footer({
  socialLinks,
  footerSettings,
}: {
  socialLinks: CampaignSocialLink[];
  footerSettings: CampaignFooterSettings | null;
}) {
  const websiteUrl = footerSettings?.website_url || "";
  const scanLabel = footerSettings?.scan_label || "";

  const showQr = Boolean(footerSettings?.qr_visible && footerSettings.qr_code_image_url);

  return (
    <footer className={`${styles.footer} ${showQr ? styles.footerWithQr : ""}`}>
      <div className={styles.footerGroup}>
        {websiteUrl && (
          <>
            <Globe className={styles.icon} aria-hidden="true" />
            <span>{websiteUrl}</span>
          </>
        )}
      </div>
      <div className={styles.social}>
        <strong>FOLLOW US</strong>
        {socialLinks.map((link) => (
          <a className={styles.socialLink} href={link.url} title={link.account_name} key={link.platform}>
            {link.platform === "instagram" ? (
              <Camera className={styles.icon} aria-hidden="true" />
            ) : link.platform === "facebook" ? (
              <ThumbsUp className={styles.icon} aria-hidden="true" />
            ) : link.platform === "pinterest" ? (
              <Pin className={styles.icon} aria-hidden="true" />
            ) : link.platform === "tiktok" ? (
              <Music2 className={styles.icon} aria-hidden="true" />
            ) : (
              <LinkIcon className={styles.icon} aria-hidden="true" />
            )}
          </a>
        ))}
      </div>
      {showQr ? (
        <div className={styles.footerQrGroup}>
          <strong className={styles.scanLabel}>{scanLabel}</strong>
          <div className={styles.qr}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={footerSettings!.qr_code_image_url!} alt="QR code" />
          </div>
        </div>
      ) : (
        <div className={styles.footerGroup} />
      )}
    </footer>
  );
}

function payloadImageUrls(payload: CampaignPayload) {
  const campaign = payload.campaign;
  return [
    campaign?.hero_banner_preview_url,
    ...payload.featured_products.map((product) => product.image_url),
    ...payload.testimonials.map((testimonial) => testimonial.image_url),
    payload.footer_settings?.qr_code_image_url,
  ].filter((url): url is string => Boolean(url));
}

async function preloadPayloadImages(payload: CampaignPayload) {
  await Promise.all(
    payloadImageUrls(payload).map(
      (url) =>
        new Promise<void>((resolve) => {
          let settled = false;
          const finish = () => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            resolve();
          };
          const image = new Image();
          const timeout = window.setTimeout(finish, 3000);
          image.onload = finish;
          image.onerror = finish;
          image.src = url;
        })
    )
  );
}

function SignagePageContent() {
  const previewId = useSearchParams().get("preview");
  const [display, setDisplay] = useState<CampaignPayload | null>(null);
  const [fading, setFading] = useState(false);
  const displayRef = useRef<CampaignPayload | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadSequenceRef = useRef(0);

  useEffect(() => {
    displayRef.current = display;
  }, [display]);

  const load = useCallback(async () => {
    const sequence = ++loadSequenceRef.current;
    try {
      const url = previewId
        ? `/api/campaign/active?preview=${encodeURIComponent(previewId)}`
        : "/api/campaign/active";
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as CampaignPayload;
      await preloadPayloadImages(payload);
      if (sequence !== loadSequenceRef.current) return;

      const current = displayRef.current;
      const campaignChanged =
        current?.campaign?._id !== payload.campaign?._id ||
        current?.campaign?._updated_at !== payload.campaign?._updated_at;

      if (!current || !campaignChanged) {
        setDisplay(payload);
        return;
      }

      setFading(true);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = setTimeout(() => {
        setDisplay(payload);
        setFading(false);
      }, 320);
    } catch {
      // Preserve the last complete frame through transient network errors.
    }
  }, [previewId]);

  useEffect(() => {
    queueMicrotask(() => void load());
    const channel = supabase
      .channel(`signage-revision-${previewId || "live"}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "signage_revision", filter: "id=eq.1" },
        () => void load()
      )
      .subscribe();

    return () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      void supabase.removeChannel(channel);
    };
  }, [load, previewId]);

  const campaign = display?.campaign;
  const theme = campaign?.theme || DEFAULT_CAMPAIGN_THEME;

  return (
    <main className={styles.stage} style={themeVariables(theme)}>
      {previewId && <div className={styles.previewBadge}>PREVIEW MODE — NOT LIVE</div>}
      {campaign && display && (
        <div className={`${styles.canvas} ${styles.fade}`} style={{ opacity: fading ? 0 : 1 }}>
          <Header />
          <Hero campaign={{ ...campaign, theme }} />
          <FeaturedCollection campaign={campaign} products={display.featured_products} />
          <TrustStrip items={display.trust_items} />
          <Testimonials testimonials={display.testimonials} />
          <Footer socialLinks={display.social_links} footerSettings={display.footer_settings} />
        </div>
      )}
    </main>
  );
}

export default function SignagePage() {
  return (
    <Suspense fallback={null}>
      <SignagePageContent />
    </Suspense>
  );
}
