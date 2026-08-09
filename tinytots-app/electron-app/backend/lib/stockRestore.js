import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

export const OWNER_PHONE = "923085016378";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function restoreStockForSale(saleId) {
  const { data: items, error: itemsError } = await supabase
    .from("sale_items")
    .select("variant_id, quantity")
    .eq("sale_id", saleId);

  if (itemsError) {
    console.error("restoreStockForSale fetch error:", itemsError);
    return;
  }

  for (const item of items) {
    const { data: variantRow, error: variantFetchError } = await supabase
      .from("variants")
      .select("stock")
      .eq("id", item.variant_id)
      .single();

    if (variantFetchError) {
      console.error("restoreStockForSale variant fetch error:", variantFetchError);
      continue;
    }

    const restoredStock = variantRow.stock + item.quantity;

    const { error: stockUpdateError } = await supabase
      .from("variants")
      .update({ stock: restoredStock })
      .eq("id", item.variant_id);

    if (stockUpdateError) {
      console.error("restoreStockForSale stock update error:", stockUpdateError);
    }
  }
}