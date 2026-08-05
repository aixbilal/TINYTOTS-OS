import { fetchWithCache } from "@/lib/client-cache";

// ============= PRODUCTS =============
export async function getProducts() {
  return fetchWithCache<any[]>("products", "/api/products", { ttl: 1800000 }); // 30 min
}

export async function getProductById(id: string) {
  return fetchWithCache<any>(`product_${id}`, `/api/products/${id}`, {
    ttl: 1800000,
  });
}

// ============= CATEGORIES =============
export async function getCategories() {
  return fetchWithCache<any[]>("categories", "/api/categories", {
    ttl: 3600000,
  }); // 1 hour
}

// ============= BLOG =============
export async function getBlogPosts() {
  return fetchWithCache<any[]>("blogs", "/api/blog", { ttl: 3600000 }); // 1 hour
}

export async function getBlogPost(slug: string) {
  return fetchWithCache<any>(`blog_${slug}`, `/api/blog/${slug}`, {
    ttl: 3600000,
  });
}

// ============= POLICY PAGES =============
export async function getPolicyPage(
  slug: "shipping" | "returns" | "privacy" | "terms"
) {
  return fetchWithCache<any>(`policy_${slug}`, `/api/policies/${slug}`, {
    ttl: 7200000,
  }); // 2 hours
}

// ============= ABOUT PAGE =============
export async function getAboutPage() {
  return fetchWithCache<any>("about", "/api/pages/about", { ttl: 3600000 });
}