import { Router } from "express";
import { addLectureToCourseById, createCourse, deleteCourse, deleteCourseLecture, getAllCourses, getLecturesByCourseId, updateCourse } from "../controllers/course.controller.js";
import { authorizedRoles, isLoggedIn } from '../middlewares/auth.middleware.js';
import upload from '../middlewares/multer.middleware.js';


const courseRoutes = Router();

courseRoutes.route('/')
.get(getAllCourses)
.post(
    isLoggedIn,
    authorizedRoles('admin'),
    upload.single('thumbnail'), createCourse
);

courseRoutes.route('/:id')
.get(
    isLoggedIn,  
    getLecturesByCourseId
)
.put(
    isLoggedIn,
    authorizedRoles('admin'),
    updateCourse
)
.delete(
    isLoggedIn,
    authorizedRoles('admin'),
    deleteCourse
)
.post(
    isLoggedIn,
    authorizedRoles('admin'),
    upload.single('lecture'),
    addLectureToCourseById
)
.delete(
    isLoggedIn,
    authorizedRoles('admin'),
    deleteCourseLecture
)


export default courseRoutes;

