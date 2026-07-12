import { getState, saveState, clearState } from "../services/conversationState.js";
import { findProducts } from "../services/productSearch.js";
import { handleTrackOrder, handleHandoffRequest } from "./fastLaneHandler.js";

const MENU_TEXT =
`Welcome to TINY TOTS!

1. Shop by Quiz (Gender/Age/Size)
2. I have a Product Code
3. Track my Order
4. Talk to a Human

Reply with 1, 2, 3 or 4.`;

const QUESTIONS = {
    gender:
`Let's find the right fit.

Q1/3 - Who are we shopping for?

1. Boy
2. Girl
3. Unisex

Reply with 1, 2 or 3.`,

    age:
`Q2/3 - Age range?

1. 0-1 yrs
2. 1-3 yrs
3. 3-5 yrs
4. 5-8 yrs
5. 8-14 yrs

Reply with 1, 2, 3, 4 or 5.`,

    size:
`Q3/3 - Size?

1. X-Small
2. Small
3. Medium
4. Large
5. X-Large
6. XX-Large
7. Not sure / show all

Reply with 1-7.`
};

const MAPS = {
    gender: { "1": "boy", "2": "girl", "3": "unisex" },
    age: { "1": "0-1", "2": "1-3", "3": "3-5", "4": "5-8", "5": "8-14" },
    size: { "1": "XS", "2": "S", "3": "M", "4": "L", "5": "XL", "6": "XXL", "7": null } // 7 = show all -> no size filter
};

const NEXT_STEP = {
    gender: "age",
    age: "size",
    size: "search"
};

// Brand-new customer, no active state -> always show the menu first
export async function startQuiz(phone) {
    await saveState(phone, "menu", {});
    return MENU_TEXT;
}

export async function handleQuiz(phone, message) {
    const state = await getState(phone);

    if (!state) {
        return await startQuiz(phone);
    }

    const currentStep = state.step;
    const answer = message.trim();

    // Defensive guard: any step that isn't the menu or a known quiz step
    // (e.g. "idle", left behind by the human-handoff flag) -> reset to menu.
    const knownSteps = new Set(["menu", ...Object.keys(MAPS)]);
    if (!knownSteps.has(currentStep)) {
        return await startQuiz(phone);
    }

    // ---- STATE 0: Entry Menu ----
    if (currentStep === "menu") {
        if (answer === "1") {
            await saveState(phone, "gender", {});
            return QUESTIONS.gender;
        }
        if (answer === "2") {
            await clearState(phone);
            return "Please just type your product code directly (e.g. V-240) to look it up.";
        }
        if (answer === "3") {
            await clearState(phone);
            return await handleTrackOrder(phone);
        }
        if (answer === "4") {
            await clearState(phone);
            return await handleHandoffRequest(phone);
        }
        // invalid -> re-show menu, don't advance
        return `Sorry, I didn't understand.\n\n${MENU_TEXT}`;
    }

    // ---- STATE 1A / 1A-2 / 1A-3: Quiz Questions ----
    const validMap = MAPS[currentStep];
    const hasKey = Object.prototype.hasOwnProperty.call(validMap, answer);

    if (!hasKey) {
        return `Sorry, I didn't understand.\n\nPlease reply with:\n\n${QUESTIONS[currentStep]}`;
    }

    const mappedValue = validMap[answer]; // can be null for "show all" on size
    const updatedAnswers = { ...state.answers, [currentStep]: mappedValue };
    const nextStep = NEXT_STEP[currentStep];

    if (nextStep !== "search") {
        await saveState(phone, nextStep, updatedAnswers);
        return QUESTIONS[nextStep];
    }

    // ---- STATE 1A-4: Results ----
    const results = await findProducts(
        updatedAnswers.gender,
        updatedAnswers.age,
        updatedAnswers.size // may be null -> productSearch skips the size filter
    );

    await clearState(phone);

    if (results.length === 0) {
        return "No items match right now. Type MENU to restart.";
    }

    let reply = `Found ${results.length} matches for you:\n\n`;
    for (const item of results) {
        const colorText = item.color ? ` | ${item.color}` : "";
        reply += `${item.public_code} | ${item.product_name}${colorText} | Rs.${item.price}\n`;
    }
    reply += `\nReply with the code (e.g. ${results[0].public_code}) to view an item.`;

    return reply.trim();
}
