import { NextRequest, NextResponse } from "next/server";
import { verifyMetaAgentAuth } from "@/lib/meta-agent/auth";
import { getMetaAgentSupabaseClient } from "@/lib/meta-agent/supabase";

const SITE_URL = "https://tinytots.pk";

export async function GET(request: NextRequest) {
  // 1. Check Bearer token
  const authError = verifyMetaAgentAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const sku = searchParams.get("sku");
    const category = searchParams.get("category");
    const productId = searchParams.get("product_id");
    const search = searchParams.get("search");
    const color = searchParams.get("color");
    const size = searchParams.get("size");

    const supabase = getMetaAgentSupabaseClient();

    // Build the query: variants joined with their parent product
    let query = supabase
      .from("variants")
      .select(
        `
        id,
        sku,
        color,
        size,
        price,
        web_price,
        stock,
        status,
        product:products (
          id,
          name,
          category,
          is_active,
          status,
          public_code
        )
      `
      )
      .eq("status", "active")
      .limit(20);

    if (sku) {
      query = query.eq("sku", sku);
    }
    if (productId) {
      query = query.eq("product_id", productId);
    }
    if (color) {
      query = query.ilike("color", color);
    }
    if (size) {
      query = query.ilike("size", size);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Inventory API Supabase error:", error.message);
      return NextResponse.json(
        { success: false, error: "Unable to fetch inventory" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    // Filter out variants whose parent product is inactive,
    // and apply category / search filters (done in JS since they
    // apply to the joined product record).
    let results = data.filter((variant: any) => {
      const product = variant.product;
      if (!product || product.is_active === false || product.status !== "active") {
        return false;
      }
      if (category && product.category?.toLowerCase() !== category.toLowerCase()) {
        return false;
      }
      if (search && !product.name?.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      return true;
    });

    if (results.length === 0) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    const formatted = results.map((variant: any) => {
      const product = variant.product;
      const price = variant.web_price ?? variant.price;
      const slug = product.public_code ?? product.id;

      return {
        sku: variant.sku,
        name: product.name,
        color: variant.color,
        size: variant.size,
        price: price,
        stock: variant.stock,
        available: variant.stock > 0,
        product_url: `${SITE_URL}/products/${slug}`,
      };
    });

    return NextResponse.json({
      success: true,
      data: formatted.length === 1 ? formatted[0] : formatted,
    });
  } catch (err) {
    console.error("Inventory API unexpected error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}