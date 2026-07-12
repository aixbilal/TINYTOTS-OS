import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Find in-stock products matching gender, age_bracket, and size
export async function findProducts(gender, ageBracket, size) {

    let query = supabase
    .from("products")
    .select(`
        id,
        name,
        gender,
        age_bracket,
        variants!inner (
            id,
            size,
            price,
            stock,
            public_code,
            color
        )
    `)
        .eq("gender", gender)
        .eq("age_bracket", ageBracket)
        .gt("variants.stock", 0);

    // Only filter by size if the customer actually picked one
    if (size) {
        query = query.eq("variants.size", size);
    }

    const { data, error } = await query;

    if (error) {
        throw error;
    }

    const results = [];
    for (const product of data) {
        for (const variant of product.variants) {
            results.push({
                product_name: product.name,
                public_code: variant.public_code,
                price: variant.price,
                stock: variant.stock,
                color: variant.color
            });
        }
    }

    return results;
}