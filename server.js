import app from "./src/app.js";
import connectDB from "./src/config/dbConnection.js";
import { v2 } from "cloudinary";

// cloudinary configuration
v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})


await connectDB().then(()=>{
    app.listen(process.env.PORT || 5000, ()=> {
        console.log("server is running on port " + process.env.PORT);
    })
}).catch((err) =>{
    console.log("Database cannot be connected!!");
});




























