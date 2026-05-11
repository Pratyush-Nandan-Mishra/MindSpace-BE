import {model, Schema} from "mongoose";

export default model("ChatMemory", new Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    longTerm: [
        {
            type: String 
        }
    ],
}, { timestamps: true }));
