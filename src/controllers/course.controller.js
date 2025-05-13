import Course from '../models/course.model.js';
import cloudinary from 'cloudinary';
import fs from 'fs/promises';

export const getAllCourses = async (req, res, next)=>{
    try{
        const allCourses = await Course.find({}).select('-lectures');   //  course details except lectures

        res.status(200).json({
            success: true,
            message: "All courses",
            allCourses
        })

    }catch(err){
        return next(new AppError(err, 500));
    }
}

export const getLecturesByCourseId = async (req, res, next)=>{
    try{
        const { id } = req.params;
        const course = await Course.findById(id);
        if(!course){
            return next(new AppError("Course doesn't exists.", 400));
        }

        res.status(200).json({
            success: true,
            message: "Courses lectures fetched successfully",
            lectures: course.lectures
        })

    }catch(err){
        return next(new AppError(err.message, 500));
    }
}

export const createCourse = async (req, res, next)=>{
    try{
        const { title, category, description, price, createdBy } = req.body;

        if(!title || !category || !description || !price || !createdBy){
            return next(new AppError("All fields are required",400));
        }

        const course = await Course.create({
            title, category, description, price, createdBy
        });

        if(!course){
            return next(new AppError("Error in course creation, please try again", 400));
        }
        if(req.file){
            try{
                const result = await cloudinary.v2.uploader(req.file.path, {
                    folder: 'lms-platform',
                    height: 300,
                    width: 300,
                    gravity: 'center',
                    crop: 'fill'
                });

                course.thumbnail.public_id = result.public_id;
                course.thumbnail.secure_URL = result.secure_url;

                fs.rm('uploads/' + req.file.filename);

            }catch(err){
                return next(new AppError(err || "file is not uploaded, please try again later", 500));
            }
        }

        await course.save();
        res.status(200).json({
            success: true,
            message: "course created successfully",
            course
        })
    }catch(err){
        return next(new AppError(err.message, 500));
    }

}

export const updateCourse = async (req, res, next)=>{
    try{
        const { id } = req.params;
        const course = await Course.findByIdAndUpdate(
            id, { $set: req.body }, { runValidators: true }
        )
        if(!course){
            return next(new AppError("course doesn't exists", 400));
        }

        res.status(200).json({
            success: true,
            message: "course updated successfully",
            course
        })
    }catch(err){
        return next(new AppError(err.message, 500));
    }
}

export const deleteCourse = async (req, res, next) => {
    try{
        const { id } = req.params;
        const course = await Course.findByIdAndDelete(id);

        if(!course){
            return next(new AppError("course doesn't exists", 400));
        }

        res.status(200).json({
            success: true,
            message: "course removed successfully",
            deleteCourse: course
        })

    }catch(err){
        return next(new AppError(err.message, 500));
    }    
}

export const addLectureToCourseById = async (req, res, next)=>{
    try{
        const { id } = req.params;
        const course = await Course.findById(id);
        if(!course){
            return next(new AppError("Course doesn't exists", 400));
        }

        const { title, description } = req.body;
        if(!title || !description){
            return next(new AppError("Enter the required fields", 400));
        }

        const lectureData = {
            title,
            description,
            lecture: {}
        }

        if(req.file){
            try{
                const result = cloudinary.v2.uploader(req.file.path, {
                    folder: 'lms-platform',
                    height: 300,
                    width: 300,
                    gravity: 'center',
                    crop: 'fill'
                });

                lectureData.lecture.public_id = result.public_id;
                lectureData.lecture.secure_URL = result.secure_url;

                fs.rm('uploads/' + req.file.filename);

            }catch(err){
                return next(new AppError(err || "file is not uploaded, please try again later", 500));
            }
        }

        course.lectures.push(lectureData);

        course.numberOfLectures = course.lectures.length;

        await course.save();

        res.status(200).json({
            success: true,
            message: "lecture added successfully.",
            course
        })

    }catch(err){
        return next(new AppError(err.message, 500));
    }
}

export const deleteCourseLecture = async (req, res, next)=> {
    try{
        const { id } = req.params;
        const { lectureId } = req.body;
        const course = await Course.findById(id);
        if(!course){
            return next(new AppError("Course doesn't exists", 400));
        }

        // Find the index of the lecture to be deleted
        const lectureIndex = course.lectures.findIndex(
            (lecture) => lecture.lecture.public_id === lectureId
        );

        if(lectureIndex === -1){
            return next(new AppError("Lecture doesn't exists", 400))
        }

        // Remove the lecture
        const deletedLecture = course.lectures.splice(lectureIndex, 1)[0];
        course.numberOfLectures = course.lectures.length;

        await course.save();

        res.status(200).json({
            success: true,
            message: "lecture removed successfully",
            deletedLecture
        })

    }catch(err){
        return next(new AppError(err.message, 500));
    }
}



