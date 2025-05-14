import { razorpay } from '../../server.js';
import crypto from 'crypto';
import Payment from '../models/payment.model.js'
import User from '../models/User.js';
import moment from 'moment';

export const getRazorpayApiKey = async (req, res, next) => {
    res.status(200).json({
        success: true,
        message: "Razorpay API key",
        key: process.env.RAZORPAY_API_ID
    })
}

export const buySubscription = async (req, res, next) => {
    try{
        const { id } = req.user;
        const user = await User.findById(id);
        if(!user){
            return next(new Error("Unauthorized user, please login", 400));
        }

        if(user.role === 'admin'){
            return next(new Error("Admin cannot subscribe the course", 400));
        }

        const subscription = await razorpay.subscriptions.create({
            plan_id: process.env.RAZORPAY_PLAN_ID,
            customer_notify: 1
        })

        user.subscription.id = subscription.id;
        user.subscription.status = subscription.status;

        await user.save();

        res.status(200).json({
            success: true,
            message: "Subscribed successfully",
            subscription_id: subscription.id 
        })
         
    }catch(err){
        return next(new AppError(err.message, 500)); 
    }
}

export const verifySubscription = async (req, res, next) => {
    try{
        const { id } = req.user;
        const { razorpay_payment_id, razorpay_signature, razorpay_subscription_id } = req.body;
        const user = await User.findById(id);
        if(!user){
            return next(new Error("Unauthorized user, please login", 400));
        }

        if(user.role === 'admin'){
            return next(new Error("Admin cannot subscribe the course", 400));
        }

        const  subscriptionId = req.user.subscription.id;

        //  generate the cryptographic HMAC hash
        const generatedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET)
        .update(`${razorpay_payment_id}|${subscriptionId}`)
        .digest('hex');

        if(generatedSignature !== razorpay_signature){
            return next(new Error("Payment verified, please try again", 500));
        }

        //  making a record of payment
        await Payment.create({
            razorpay_payment_id,
            razorpay_signature,
            razorpay_subscription_id,
        })

        user.subscription.status = 'active';

        await user.save();

        res.status(200).json({
            success: true,
            message: "Payment verified successfully",
        })

    }catch(err){
        return next(new AppError(err.message, 500));
    }
}

export const cancelSubscription = async (req, res, next) => {
    try{
        const { id } = req.user;
        const user = await User.findById(id);
        if(!user){
            return next(new Error("Unauthorized user, please login", 400));
        }

        if(user.role === 'admin'){
            return next(new Error("Admin cannot subscribe the course", 400));
        }

        const subscriptionId = user.subscription.id;

        const subscription = await razorpay.subscriptions.cancel(subscriptionId);

        user.subscription.status = subscription.status;

        await user.save();

        res.status(200).json({
            success: true,
            message: "Payment is cancel successfully",
        })

    }catch(err){
        return next(new AppError(err.message, 500)); 
    }
}

export const getAllPayments = async (req, res, next) => {
    try{

        const now = moment();
        const startOfMonth = now().startOf('month').toDate();
        const endOfMonth = now.clone().endOf('month').toDate();
        const coursePrice = 4999;

        const totalUsers = await User.countDocuments({ role: 'user' });
        const usersThisMonth = await User.find({
            createdAt: { $gte: startOfMonth, $lte: endOfMonth },
            role: 'user'
        })

        const subscribedUsersThisMonth = usersThisMonth.filter(user => 
            user.subscription && user.subscription.status === 'active'
          );
          
          const unsubscribedUsersThisMonth = usersThisMonth.filter(user => 
            !user.subscription || user.subscription.status !== 'active'
          );

        // payments
        const totalPayments = await Payment.find();
        const totalRevenue = totalPayments.length * coursePrice;

        const allSubscriptions = await razorpay.subscriptions.all({ count: 100 });
        const monthlySubscriptions = allSubscriptions.items.filter(sub => {
            const createdAt = new Date(sub.created_at * 1000);
            return createdAt >= startOfMonth && createdAt <= endOfMonth;
        })

        res.status(200).json({
            success: true,
            message: "Admin dashboard payment insights",
            data: {
                usersThisMonth: usersThisMonth.length,
                
                subscribedUsersThisMonth: subscribedUsersThisMonth.length,
                
                unsubscribedUsersThisMonth: unsubscribedUsersThisMonth.length,
                
                totalPayments: totalPayments.length,
                
                totalRevenue: `₹${totalRevenue}`,
                
                monthlySubscriptions: monthlySubscriptions.length,
            }
        });

    }catch(err){
        return next(new AppError(err.message, 500)); 
    }
}


