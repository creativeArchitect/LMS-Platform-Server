import AppError from '../utils/error.util.js'
import User from '../models/User.js'
import cloudinary from 'cloudinary';
import fs from 'fs';

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
                secure_URL: ' https://res.cloudinary.com/demo/image/upload/v1699971373/sample.jpg'
            }
        })

        if(!user){
            return next(new AppError("user registration is failed, please try again", 400))
        }

        console.log("File Details: " + JSON.stringify(req.file));
        if(req.file){
            try{
                const result = await cloudinary.v2.uploader.upload(req.file.path, { 
                    folder: 'lms-platform', width: 250, height: 250, gravity: 'faces',
                    crop: 'fill'
                });

                if(result){
                    user.avatar.public_id = result.public_id;
                    user.avatar.secure_URL = result.secure_URL;

                    // remove the file from local storage

                    fs.rm('uploads/' + req.file.filename, (err)=>{
                        if(err){
                            console.log("File Delete ERROR: " + err);
                        }
                    });
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
            User
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






























