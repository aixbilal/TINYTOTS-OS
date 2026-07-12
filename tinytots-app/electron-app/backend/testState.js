import {
    saveState,
    getState,
    clearState
} from "./services/conversationState.js";


const phone = "923000000000";


await saveState(
    phone,
    "gender",
    {}
);


const state = await getState(phone);

console.log(state);


await clearState(phone);

console.log("deleted");