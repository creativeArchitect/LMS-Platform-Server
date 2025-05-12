import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import crypto from 'crypto';


const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        minLength: [3, "Name must be atleast 3 character"],
        maxLength: [15, "Name must be atleast 3 character"]
    },
    lastName: {
        type: String,
        lowercase: true,
        trim: true,
        minLength: [3, "Name must be atleast 3 character"],
        maxLength: [15, "Name must be atleast 3 character"]
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        unique: true,
        validate(val){
            if(!validator.isEmail(val)){
                throw new Error("Enter a valid email address.");
            }
        }
    },
    password: {
        type: String,
        required: true,
        validate(val){
            if(!validator.isStrongPassword(val)){
                throw new Error("Password must be 8–12 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.");
            }
        },
        select: false,
    },
    avatar: {
        public_id: {
            type: String,
        },
        secure_URL: {
            type: String,
        }
    },
    forgotPasswordToken: {
        type: String,
    },
    forgotPasswordExpiry: {
        type: Date,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    }
}, { timestamps: true }
)

userSchema.pre('save', async function(next){
    if(!this.isModified('password')){
        next();
    }
    this.password = await bcrypt.hash(this.password, 10);
})

userSchema.methods.getJWT = async function(){
    const user = this;
    const token = await jwt.sign({ _id: user._id, email: user.email, subscription: user.subscription, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRY
    });

    return token;
}

userSchema.methods.comparePassword = async function(plainTextPassword){
    const user = this;

    const isValidPassword = await bcrypt.compare(plainTextPassword, user.password);

    return isValidPassword;
}

userSchema.methods.generatePasswordResetToken = async function(){
    const resetToken = crypto.randomBytes(20).toString('hex');

    this.forgotPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    this.forgotPasswordExpiry = Date.now() + 15*60*1000;

    return resetToken;
}

const User = mongoose.model('User', userSchema);
export default User;

















