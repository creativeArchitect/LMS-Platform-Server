import AppError from '../utils/error.util.js';
import User from '../models/User.js';
import sendEmail from '../utils/sendEmail.util.js';
import cloudinary from 'cloudinary';
import fs from 'fs/promises';
import crypto from 'crypto';

const cookieOptions = {
    maxAge: 3*24*60*60*1000,
    httpOnly: true,
    secure: true,
} 

export const register = async (req, res, next)=>{
    try{
        const { firstName, lastName, email, password, avatar } = req.body;

        if(!firstName || !lastName || !email || !password ){
            return next(new AppError("All fields are required", 400));
        }

        const userExists = await User.findOne({ email: email });

        if(userExists){
            return next(new AppError("Email is already exists", 400));
        }

        const user = await User.create({
            firstName, lastName, email, password, 
            avatar: {
                public_id: email,
                secure_URL: ' https://res.cloudinary.com/du9jzqlpt/image/upload/v1674647316/avatar_drzgxv.jpg'
            }
        })

        if(!user){
            return next(new AppError("user registration is failed, please try again", 400))
        }

        // console.log("File Details: " + JSON.stringify(req.file));
        if(req.file){
            try{
                const result = await cloudinary.v2.uploader.upload(req.file.path, { 
                    folder: 'lms-platform', width: 250, height: 250, gravity: 'faces',
                    crop: 'fill'
                });

                if(result){
                    user.avatar.public_id = result.public_id;
                    user.avatar.secure_URL = result.secure_url;

                    // remove the file from local storage

                    fs.rm('uploads/' + req.file.filename)
                }

            }catch(err){
                return next(new AppError(err || "file is not uploaded, please try again later", 500));
            }
        }

        await user.save();

        user.password = undefined;

        const token = await user.getJWT();

        res.cookie('token', token, cookieOptions);

        res.status(201).json({
            success: true,
            message: 'User registered successfully.',
            user
        })
    }catch(err){
        return next(new AppError(err.message, 500));
    }
}

export const login = async (req, res, next)=>{
    try{
        const { email, password } = req.body;

        if(!email || !password){
            return next(new AppError("Enter the required fields", 400));
        }

        const user = User.findOne({ email: email}).select('+password');


        if(!user || !user.comparePassword(password )){
            return next(new AppError("Email and password is invalid", 400));
        }

        const token = await user.getJWT();
        user.password = undefined;

        res.cookie('token', token, cookieOptions);

        res.status(200).json({
            success: true,
            message: "user logged in successfully.",
            user
        })
    }catch(err){
        return next(new AppError(err.message, 500));
    }
}

export const logout = (req, res, next)=>{
    try{

        res.cookie('token', null, {
            maxAge: 0,
            secure: true,
            httpOnly: true
        })

        res.status(200).json({
            success: true,
            message: "user logged out successfully."
        })

    }catch(err){
        return next(new AppError(err.message, 500));
    }
}

export const getProfile = async (req, res)=>{
    try{
        const userId = req.user._id;
        const user = await User.findById(userId);

        res.status(200).json({
            success: true,
            message: "User details",
            user
        })

    }catch(err){
        return next(new AppError("failed to fetch profile detail", 500));
    }
}

export const fogotPassword = async (req, res, next)=>{
    try{
        const { email } = req.body;

        if(!email){
            return next(new AppError("Enter the required fields", 400));
        }

        const user = await User.findOne({ email: email });
        if(!user){
            return next(new AppError("invalid email address", 401))
        }

        const resetToken = await user.generatePasswordResetToken();

        await user.save();

        const resetPasswordURL = process.env.FRONTEND_URL + '/reset/password/' + resetToken;

        const subject = "Reset Password";
        const body = `You can reset your password by clicking <a href=${resetPasswordURL} target="_blank">Reset your password</a> \n If the above link doesn't work than copy and paste this link in new tab ${resetPasswordURL}. \n if you haven't requested this, kindly ignore.`

        try{
            await sendEmail(email, subject, body);

            res.status(200).json({
                success: true,
                message: "Reset password token has been sent to " + email + " successuflly."
            })
        }catch(err){
            user.forgotPasswordExpiry = undefined;
            user.forgotPasswordToken = undefined;

            await user.save();
            return next(new AppError(e.message, 500));
        }


    }catch(err){
        return next(new AppError("ERROR: " + err, 500));
    }

}

export const resetPassword = async (req, res, next)=>{
    try{
        const { resetToken } = req.params;
        const { password } = req.body;

        if(!resetToken){
            return next(new AppError("Invalid URL", 400))
        }
        if(!password){
            return next(new AppError("Enter the new password",400));
        }

        const forgotPasswordToken = await crypto
        .createHash('sha256')
        .update(resetPassword)
        .digest("hex");

        const user = await User.findOne({ forgotPasswordToken: forgotPasswordToken, forgotPasswordExpiry: { $gt: Date.now() }});

        if(!user){
            return next(new AppError("Token is invalid or expired, please try again.", 400))
        }

        user.password = password;
        user.forgotPasswordExpiry = undefined;
        user.forgotPasswordToken = undefined;

        await user.save();

        res.status(200).json({
            success: true,
            message: "password updation successfully."
        });
    }catch(err){
        return next(new AppError("ERROR: " + err.message, 500))
    }
}

export const changePassword = async (req, res, next)=>{
    try{
        const { oldPassword, newPassword } = req.body;
        const { id } = req.user;
        
        if(!oldPassword || !newPassword){
            return next(new AppError("All fields are required", 400));
        }

        const user = await User.findById({id}).select('+password');

        if(!user){
            return next(new AppError("User doesn't exists", 400));
        }

        const isValidPassword = await user.comparePassword(oldPassword);
        
        if(!isValidPassword){
            return next(new AppError("Invalid old password", 400));
        }

        user.password = newPassword;

        await user.save();

        user.password = undefined;

        res.status(200).json({
            success: true,
            message: "password changed successfully.",
            user
        });

    }catch(err){
        return next(new AppError("ERROR: " + err.message, 500))
    }
}

export const updateProfile = async (req, res, next)=>{
    try{
        const updationAllowed = [ "firstName", "lastName", "avatar" ];

        const { firstName, lastName, avatar } = req.body;
        const { id } = req.user;

        const user = await User.findById(id);
        if(!user){
            return next(new AppError("Invalid user", 400));
        }

        const isUpdationAllowed = Object.keys(req.body).every(key => updationAllowed.includes(key));

        if(!isUpdationAllowed){
            return next(new AppError("updation not allowed", 400));
        }

        if(firstName){
            user.firstName = firstName;
        }
        if(lastName){
            user.lastName = lastName;
        }
        
        if(req.file){
            await cloudinary.v2.uploader.destroy(user.avatar.public_id);
            try{
                const result = await cloudinary.v2.uploader.upload(req.file.path, {
                    folder: 'lms-platform',
                    width: 250,
                    height: 250,
                    gravity: 'face',
                    crop: 'fill'
                }) 

                if(result){
                    user.avatar.public_id = result.public_id;
                    user.avatar.secure_URL = result.secure_url;

                    fs.rm('uploads/' + res.file.filename);   
                }

            }catch(err){
                return next(new AppError(err || "File not uploaded, please try again", 500));
            }
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: "profile updated successfully.",
            user
        })

    }catch(err){
        return next(new AppError("ERROR: " + err, 500));
    }
}

