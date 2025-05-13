import { Router } from "express";
import { addLectureToCourseById, createCourse, deleteCourse, deleteCourseLecture, getAllCourses, getLecturesByCourseId, updateCourse, updateCourseLecture } from "../controllers/course.controller.js";
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
    upload.single('thumbnail'),
    updateCourse
)
.delete(
    isLoggedIn,
    authorizedRoles('admin'),
    deleteCourse
);

courseRoutes.route('/:id/lecture')
.post(
    isLoggedIn,
    authorizedRoles('admin'),
    upload.single('lecture'),
    addLectureToCourseById
)
.put(
    isLoggedIn,
    authorizedRoles('admin'),
    upload.single('lecture'),
    updateCourseLecture
)
.delete(
    isLoggedIn,
    authorizedRoles('admin'),
    deleteCourseLecture
)


export default courseRoutes;

