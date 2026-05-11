import {Schema, model} from "mongoose";

export default model ("LLMCall", new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    prompt: {
        type: String,
        required: true
    },
    response: {
        type: String
    },
}, { timestamps: true }))