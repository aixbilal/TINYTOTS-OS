import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);


// Get current conversation state
export async function getState(phoneNumber) {

    const { data, error } = await supabase
        .from("conversation_state")
        .select("*")
        .eq("phone_number", phoneNumber)
        .single();


    if (error && error.code !== "PGRST116") {
        throw error;
    }


    return data || null;
}



// Create or replace conversation state
export async function saveState(phoneNumber, step, answers = {}) {

    const { data, error } = await supabase
        .from("conversation_state")
        .upsert({
            phone_number: phoneNumber,
            step,
            answers,
            updated_at: new Date()
        })
        .select()
        .single();


    if (error) {
        throw error;
    }


    return data;
}



// Update only answers
export async function updateAnswers(phoneNumber, answers) {

    const { data, error } = await supabase
        .from("conversation_state")
        .update({
            answers,
            updated_at: new Date()
        })
        .eq("phone_number", phoneNumber)
        .select()
        .single();


    if (error) {
        throw error;
    }


    return data;
}



// Remove completed conversation
export async function clearState(phoneNumber) {

    const { error } = await supabase
        .from("conversation_state")
        .delete()
        .eq("phone_number", phoneNumber);


    if (error) {
        throw error;
    }


    return true;
}
// Flag or unflag a conversation as needing a human
export async function setNeedsHuman(phoneNumber, value) {

    const existing = await getState(phoneNumber);

    const { data, error } = await supabase
        .from("conversation_state")
        .upsert({
            phone_number: phoneNumber,
            step: existing?.step ?? "idle",
            answers: existing?.answers ?? {},
            needs_human: value,
            updated_at: new Date()
        })
        .select()
        .single();


    if (error) {
        throw error;
    }


    return data;
}