import {Schema, model} from "mongoose"

export default model ("Billing", new Schema({
    userId:{
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    format:{
        type: String,
        enum: ["subscription", "one-time"],
        required: true
    },
    amount:{
        type: Number,
        required: true
    }
}, {timestamps: true}))