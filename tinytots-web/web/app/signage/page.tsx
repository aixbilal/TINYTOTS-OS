"use client";

import type { CSSProperties } from "react";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Playfair_Display } from "next/font/google";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  Globe,
  Hammer,
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
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  DEFAULT_CAMPAIGN_THEME,
  DEFAULT_FEATURE_LIST_POSITION,
  DEFAULT_HERO_BADGE_POSITION,
  DEFAULT_ROTATION_SECONDS,
  formatSignageProductBadgeLabel,
  normalizeSignageProductBadge,
  signageProductBadgeVariant,
  type BannerFocalPoint,
  type CampaignFooterSettings,
  type CampaignSocialLink,
  type CampaignTheme,
  type OverlayPosition,
  type SignageProductBadge,
} from "@/lib/signage-campaign";
import { supabase } from "@/lib/supabase";
import styles from "./signage.module.css";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["700", "800"] });

type FeatureItem = { icon: string; title: string; description: string };
type StatItem = { icon: string; number: string; description: string };
type Product = {
  id: number;
  name: string;
  image_url: string | null;
  category: string | null;
  signage_badge?: SignageProductBadge | null;
};
type TrustItem = { id: number; icon: string; heading: string; description: string };
type Testimonial = { name: string; image_url: string | null; rating: number; quote: string };

type Campaign = {
  _id?: number;
  _updated_at?: string;
  collection_label: string;
  heading: string;
  heading_line1_color?: string | null;
  heading_line2_color?: string | null;
  subtitle: string;
  description: string;
  cta_text: string;
  cta_url: string;
  cta_visible: boolean;
  hero_banner_original_url?: string | null;
  hero_banner_preview_url?: string | null;
  hero_banner_focal_point?: BannerFocalPoint;
  hero_badge: string | null;
  hero_badge_position?: OverlayPosition;
  feature_list_position?: OverlayPosition;
  feature_list: FeatureItem[];
  statistics: StatItem[];
  featured_heading: string;
  featured_description: string;
  featured_button_text: string;
  marquee_speed_seconds: number;
  marquee_direction: "left" | "right";
  display_seconds?: number;
  theme: CampaignTheme;
};

type SignageHeader = { logo_text: string; tagline: string };

type CampaignPayload = {
  campaign: Campaign | null;
  featured_products: Product[];
  trust_items: TrustItem[];
  testimonials: Testimonial[];
  social_links: CampaignSocialLink[];
  footer_settings: CampaignFooterSettings | null;
  slides?: CampaignPayload[];
  rotation_seconds?: number;
  header?: SignageHeader;
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
  construction: Hammer,
  bolt: Zap,
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

function Header({ header }: { header?: SignageHeader | null }) {
  return (
    <header className={styles.header}>
      <span className={`${playfair.className} ${styles.logo}`}>
        {header?.logo_text || "TinyTots"}
      </span>
      <span className={styles.brandLine}>{header?.tagline || "Premium Kids Wear"}</span>
    </header>
  );
}

function Hero({ campaign }: { campaign: Campaign }) {
  const line1Color = campaign.heading_line1_color || undefined;
  const line2Color = campaign.heading_line2_color || undefined;
  const focal = campaign.hero_banner_focal_point || { x: 50, y: 50 };
  const bannerUrl = campaign.hero_banner_preview_url;
  const badgePos = campaign.hero_badge_position || DEFAULT_HERO_BADGE_POSITION;
  const featurePos = campaign.feature_list_position || DEFAULT_FEATURE_LIST_POSITION;

  return (
    <section className={styles.hero}>
      <div className={styles.heroBanner} aria-hidden="true">
        {bannerUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bannerUrl}
            alt=""
            className={styles.bannerImage}
            style={{ objectPosition: `${focal.x}% ${focal.y}%` }}
          />
        )}
        {campaign.hero_badge && (
          <div
            className={styles.badge}
            style={{ left: `${badgePos.x}%`, top: `${badgePos.y}%` }}
          >
            {campaign.hero_badge}
          </div>
        )}
        {campaign.feature_list.length > 0 && (
          <div
            className={styles.features}
            style={{ left: `${featurePos.x}%`, top: `${featurePos.y}%` }}
          >
            {campaign.feature_list.map((feature, index) => (
              <div className={styles.feature} key={`${feature.title}-${index}`}>
                <SignageIcon name={feature.icon} className={styles.featureIcon} />
                <span>{feature.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.heroCopy}>
        <span className={styles.eyebrow}>{campaign.collection_label}</span>
        <h1 className={`${playfair.className} ${styles.heroHeading}`}>
          {campaign.heading.split("\n").map((line, index) => (
            <span
              key={`${line}-${index}`}
              style={
                index === 0 && line1Color
                  ? { color: line1Color }
                  : index === 1 && line2Color
                    ? { color: line2Color }
                    : undefined
              }
            >
              {line}
            </span>
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

      <div className={styles.heroSpacer} aria-hidden="true" />

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
    products.map((product) => {
      const badge = normalizeSignageProductBadge(product.signage_badge);
      const variant = badge ? signageProductBadgeVariant(badge) : null;
      const badgeClass =
        variant === "new"
          ? styles.productBadgeNew
          : variant === "best_seller"
            ? styles.productBadgeBestSeller
            : variant === "limited"
              ? styles.productBadgeLimited
              : variant
                ? styles.productBadgeBestSeller
                : "";

      return (
        <div className={styles.productCard} key={`${duplicate ? "copy" : "original"}-${product.id}`}>
          {badge && (
            <span className={`${styles.productBadge} ${badgeClass}`}>
              {formatSignageProductBadgeLabel(badge)}
            </span>
          )}
          {product.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image_url} alt={duplicate ? "" : product.name} draggable={false} />
          )}
          <Heart className={`${styles.icon} ${styles.favorite}`} aria-hidden="true" strokeWidth={1.8} />
        </div>
      );
    });

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
  if (testimonials.length === 0) {
    return <section className={styles.testimonials} aria-hidden="true" />;
  }

  const cards = (duplicate: boolean) =>
    testimonials.map((testimonial, index) => (
      <article
        className={styles.testimonialCard}
        key={`${duplicate ? "copy" : "original"}-${testimonial.name}-${index}`}
      >
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
    ));

  return (
    <section className={styles.testimonials}>
      <div className={styles.testimonialTitleRow}>
        <span className={styles.testimonialTitleLine} aria-hidden="true" />
        <h2 className={styles.testimonialTitle}>Loved by Parents</h2>
        <span className={styles.testimonialTitleLine} aria-hidden="true" />
      </div>
      <div className={styles.testimonialMarquee} aria-label="Parent testimonials">
        <div
          className={`${styles.marqueeTrack} ${styles.marqueeLeft}`}
          style={{
            animationDuration: `${Math.max(30, testimonials.length * 12)}s`,
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
          }}
        >
          <div className={styles.testimonialMarqueeGroup}>{cards(false)}</div>
          <div className={styles.testimonialMarqueeGroup} aria-hidden="true">
            {cards(true)}
          </div>
        </div>
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
  const [slides, setSlides] = useState<CampaignPayload[]>([]);
  const [slideIndex, setSlideIndex] = useState(0);
  const [rotationSeconds, setRotationSeconds] = useState(DEFAULT_ROTATION_SECONDS);
  const [header, setHeader] = useState<SignageHeader>({
    logo_text: "TinyTots",
    tagline: "Premium Kids Wear",
  });
  const [fading, setFading] = useState(false);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rotateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadSequenceRef = useRef(0);

  const load = useCallback(async () => {
    const sequence = ++loadSequenceRef.current;
    try {
      const url = previewId
        ? `/api/campaign/active?preview=${encodeURIComponent(previewId)}`
        : "/api/campaign/active";
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as CampaignPayload;
      const nextSlides =
        Array.isArray(payload.slides) && payload.slides.length > 0
          ? payload.slides
          : payload.campaign
            ? [payload]
            : [];

      await Promise.all(nextSlides.map((slide) => preloadPayloadImages(slide)));
      if (sequence !== loadSequenceRef.current) return;

      setRotationSeconds(
        Number.isFinite(payload.rotation_seconds)
          ? Math.min(60, Math.max(10, Number(payload.rotation_seconds)))
          : DEFAULT_ROTATION_SECONDS
      );
      if (payload.header) {
        setHeader({
          logo_text: payload.header.logo_text || "TinyTots",
          tagline: payload.header.tagline || "Premium Kids Wear",
        });
      }
      setSlides(nextSlides);
      setSlideIndex((current) => (nextSlides.length === 0 ? 0 : current % nextSlides.length));
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

    // Re-fetch periodically so calendar/time windows take effect without a DB bump.
    const pollMs = previewId ? 0 : 60_000;
    const poll =
      pollMs > 0 ? window.setInterval(() => void load(), pollMs) : null;

    return () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      if (rotateTimerRef.current) clearTimeout(rotateTimerRef.current);
      if (poll) window.clearInterval(poll);
      void supabase.removeChannel(channel);
    };
  }, [load, previewId]);

  // Per-campaign duration: each active slide uses its own display_seconds.
  useEffect(() => {
    if (rotateTimerRef.current) {
      clearTimeout(rotateTimerRef.current);
      rotateTimerRef.current = null;
    }
    if (previewId || slides.length <= 1) return;

    const currentSeconds = slides[slideIndex]?.campaign?.display_seconds;
    const holdMs =
      (Number.isFinite(currentSeconds)
        ? Math.min(60, Math.max(10, Number(currentSeconds)))
        : rotationSeconds) * 1000;

    rotateTimerRef.current = setTimeout(() => {
      setFading(true);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = setTimeout(() => {
        setSlideIndex((current) => (current + 1) % slides.length);
        setFading(false);
      }, 320);
    }, holdMs);

    return () => {
      if (rotateTimerRef.current) clearTimeout(rotateTimerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, [slideIndex, slides, rotationSeconds, previewId]);

  const display = slides[slideIndex] || null;
  const campaign = display?.campaign;
  const theme = campaign?.theme || DEFAULT_CAMPAIGN_THEME;

  return (
    <main className={styles.stage} style={themeVariables(theme)}>
      {previewId && <div className={styles.previewBadge}>PREVIEW MODE — NOT LIVE</div>}
      {campaign && display && (
        <div className={`${styles.canvas} ${styles.fade}`} style={{ opacity: fading ? 0 : 1 }}>
          <Header header={header} />
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
