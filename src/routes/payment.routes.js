import { Router } from "express"; 
import { buySubscription, cancelSubscription, getAllPayments, getRazorpayApiKey, verifySubscription } from "../controllers/payment.controller.js";
import { isLoggedIn, authorizedRoles } from '../middlewares/auth.middleware.js'

const paymentRoutes = Router();

paymentRoutes.route('/razorpay-key')
.get(
    isLoggedIn, 
    getRazorpayApiKey
)

paymentRoutes.route('/subscribe')
.post(
    isLoggedIn, 
    buySubscription
)

paymentRoutes.route('/verify')
.post(
    isLoggedIn, 
    verifySubscription
)

paymentRoutes.route('/unsubscribe')
.post(
    isLoggedIn, 
    cancelSubscription
) 

paymentRoutes.route('/')
.get(
    isLoggedIn, 
    authorizedRoles('admin'),
    getAllPayments
)

export default paymentRoutes;