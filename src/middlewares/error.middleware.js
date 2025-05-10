

const errorMiddleware = (err, req, res, next)=> {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Something went wrong";

    return res.status(err.statusCode).json({
        uccess: false,
        essage: err.message,
        tack: err.stack,
    })
}


export default errorMiddleware;











