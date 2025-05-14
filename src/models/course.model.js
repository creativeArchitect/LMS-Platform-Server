import mongoose, { mongo } from "mongoose";


const courseSchema = mongoose.Schema({
    title: {
        type: String,
        trim: true,
        required: [true, 'Title is required'],
        minLength: [8, 'Title must be atleast 8 characters'],
        maxLength: [59, 'Title should be less than 60 characters']
    },
    price: {
        type: Number,
        trim: true,
        min: 3999,
    },
    description: {
        type: String,
        trim: true,
        required: [true, 'Description is required'],
        minLength: [8, 'Description must be atleast 8 characters'],
        maxLength: [200, 'Description should be less than 60 characters']
    },
    thumbnail: {
        public_id: {
            type: String,
            trim: true,
            required: true
        },
        secure_URL: {
            type: String,
            trim: true,
            required: true
        }
    },
    category: {
        type: String,
        trim: true,
        required: [true, 'Category is required'],
    },
    lectures: [
        {
            title: String,
            description: String,
            lecture: {
                public_id: {
                    type: String,
                    trim: true,
                    required: true
                },
                secure_URL: {
                    type: String,
                    trim: true,
                    required: true
                }
            }  
        }
    ],
    numberOfLectures: {
        type: Number,
        trim: true,
        default: 0,
        required: true
    },
    createdBy: {
        type: String,
        trim: true,
        required: [true, 'creator name is required']
    },
}, { timestamps: true } 
)


const Course = new mongoose.model("Course", courseSchema);

export default Course;
