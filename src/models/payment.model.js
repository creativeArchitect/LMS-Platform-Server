import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    razorpay_payment_id: {
        type: String,
        required: true,
        trim: true,
    },
    razorpay_subscription_id: {
        type: String,
        required: true,
        trim: true, 
    },
    razorpay_signature: {
        type: String,
        required: true,
        trim: true,
    }
}, { timestamps: true }
)

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
