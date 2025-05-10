import mongoose from "mongoose";

// when user pass extra query parameter to save or to get then not give any error if it is not present just ignore.
mongoose.set('strictQuery', false);

const connectDB = async ()=>{
    try{
        const { connection } =await mongoose.connect(process.env.DB_CONNECTION_URI);

        if(connection){
            console.log("database is connected to HOST: " + connection.host);
        }
    }catch(err){
        console.log("ERROR: " + err);
        process.exit(1);
    }
}

export default connectDB;












