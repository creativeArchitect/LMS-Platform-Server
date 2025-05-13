import jwt from 'jsonwebtoken';


export const isLoggedIn = async (req, res, next)=>{
    const { token } = req.cookies;

    if(!token){
        return next(new AppError("Unauthenticated user, please login", 401))
    }

    const userDetails = await jwt.verify(token, process.env.JWT_SECRET);

    req.user = userDetails;

    next();
}

export const authorizedRoles = (...roles) => async (req, res, next)=>{
    const currentUserRole = req.body?.role;
    if(!roles.includes(currentUserRole)){
        return next(new AppError("You don't have permission to access this route", 403))
    }

    next();
}








