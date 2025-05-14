import { Router } from 'express';
import { register, login, logout, getProfile, resetPassword, fogotPassword, changePassword, updateProfile } from '../controllers/user.controller.js';
import { isLoggedIn } from '../middlewares/auth.middleware.js';
import upload from '../middlewares/multer.middleware.js';


const userRoutes = Router();

userRoutes.post('/register', upload.single('avatar'),  register);
userRoutes.post('/login', login);
userRoutes.get('/logout', logout);
userRoutes.get('/me', isLoggedIn, getProfile);
userRoutes.post('/reset/password', fogotPassword);
userRoutes.post('/reset/:resetToken', resetPassword);
userRoutes.post('/change/password', isLoggedIn, changePassword);
userRoutes.put('/update', isLoggedIn, upload.single('avatar'), updateProfile);



export default userRoutes;
