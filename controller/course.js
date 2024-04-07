const express = require("express");
const router = express.Router();
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const Course = require("../model/course");
const { isAuthenticated, isAdmin } = require("../middleware/auth");
const { executionAsyncId } = require("async_hooks");

// Create Course Endpoint
/**
 * @swagger
 * /course/create-course:
 *   post:
 *     summary: Create a new course
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Introduction to Web Development"
 *               description:
 *                 type: string
 *                 example: "Learn the basics of web development including HTML, CSS, and JavaScript."
 *               category:
 *                 type: string
 *                 example: "Web Development"
 *               level:
 *                 type: string
 *                 example: "Beginner"
 *               instructor:
 *                 type: string
 *                 example: "John Doe"
 *               price:
 *                 type: number
 *                 example: 49.99
 *               duration:
 *                 type: number
 *                 example: 30
 *               status:
 *                 type: string
 *                 example: "Active"
 *               popularity:
 *                 type: number
 *                 example: 500
 *     responses:
 *       201:
 *         description: Course created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 */
router.post("/create-course", isAuthenticated, isAdmin("Admin"), async (req, res, next) => {
    try {
        const { title, description, category, level, instructor, price, duration, status, popularity } = req.body;

        // Validate required fields
        if (!title || !category || !price || !status) {
            throw new ErrorHandler("Please provide all required fields!", 400);
        }
        if (!duration) {
            throw new ErrorHandler("Duration must me greater than 0", 400);
        }

        // Create new course
        const newCourse = await Course.query().insert({
            title: title,
            description: description ? description : "",
            category: category,
            level: level ? level : "",
            instructor: instructor ? instructor : "",
            price: price,
            duration: duration,
            status: status,
            popularity: popularity ? popularity : ""
        });

        res.status(201).json({
            success: true,
            message: "Course created successfully",
            data: newCourse
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// Get All Courses Endpoint with Filtering and Pagination
/**
 * @swagger
 * /course/get-courses:
 *   get:
 *     summary: Get courses with filtering and pagination
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter courses by category
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *         description: Filter courses by level
 *       - in: query
 *         name: popularity
 *         schema:
 *           type: string
 *         description: Filter courses by popularity
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Successful response
 */
router.get("/get-courses", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
    try {
        let query = Course.query();

        // Filtering options
        if (req.query.category) {
            query = query.where("category", req.query.category);
        }
        if (req.query.level) {
            query = query.where("level", req.query.level);
        }
        if (req.query.popularity) {
            query = query.where("popularity", req.query.popularity);
        }

        // Pagination
        const page = req.query.page ? parseInt(req.query.page, 10) : 1;
        const pageSize = req.query.pageSize ? parseInt(req.query.pageSize, 10) : 10;
        const offset = (page - 1) * pageSize;
        query = query.limit(pageSize).offset(offset);

        // Execute the query
        const courses = await query;

        // Count total number of courses for pagination
        const totalCount = await Course.query().resultSize();

        res.status(200).json({
            success: true,
            data: courses,
            pagination: {
                totalItems: totalCount,
                totalPages: Math.ceil(totalCount / pageSize),
                currentPage: page,
                pageSize: pageSize
            }
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 400));
    }
}));

// Update Course by ID Endpoint
/**
 * @swagger
 * /course/update-course/{id}:
 *   put:
 *     summary: Update course by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the course to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Introduction to Web Development"
 *               description:
 *                 type: string
 *                 example: "Learn the basics of web development including HTML, CSS, and JavaScript."
 *               category:
 *                 type: string
 *                 example: "Web Development"
 *               level:
 *                 type: string
 *                 example: "Beginner"
 *               instructor:
 *                 type: string
 *                 example: "John Doe"
 *               price:
 *                 type: number
 *                 example: 49.99
 *               duration:
 *                 type: number
 *                 example: 30
 *               status:
 *                 type: string
 *                 example: "Active"
 *               popularity:
 *                 type: number
 *                 example: 500
 *     responses:
 *       200:
 *         description: Successful response
 */
router.put("/update-course/:id", isAuthenticated, isAdmin("Admin"), catchAsyncErrors(async (req, res, next) => {
    try {
        console.log(req.body)
        const { title, description, category, level, instructor, price, duration, status, popularity } = req.body;

        if (!req.params.id) {
            throw new ErrorHandler("Please provide id", 400);
        }

        const existingCourse = await Course.query().findById(req.params.id);

        if (!existingCourse) {
            throw new ErrorHandler("Course not found", 404);
        }

        console.log(price, "price")
        const updatedCourse = await Course.query()
            .findById(req.params.id)
            .update({
                title: title ? title : existingCourse.title,
                description: description ? description : existingCourse.description,
                category: category ? category : existingCourse.category,
                level: level ? level : existingCourse.level,
                instructor: instructor ? instructor : existingCourse.instructor,
                price: price ? price : existingCourse.price,
                duration: duration ? duration : existingCourse.duration,
                status: status ? status : existingCourse.status,
                popularity: popularity ? popularity : existingCourse.popularity
            })
            .returning('*');

        if (!updatedCourse) {
            throw new ErrorHandler("Course not found", 404);
        }

        res.status(200).json({
            success: true,
            message: "Course updated successfully",
            data: updatedCourse
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 400));
    }
}));

/**
 * @swagger
 * /course/get-course/{id}:
 *   get:
 *     summary: Get course by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the course to retrieve.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful response
 */
router.get("/get-course/:id", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
    try {

        if (!req.params.id) {
            throw new ErrorHandler("Please provide id", 404);
        }

        const course = await Course.query().findById(req.params.id);

        if (!course) {
            throw new ErrorHandler("Course not found", 404);
        }

        res.status(200).json({
            success: true,
            data: course
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 400));
    }
}));

// Delete Course by ID Endpoint
/**
 * @swagger
 * /course/delete-course/{id}:
 *   delete:
 *     summary: Delete course by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the course to delete.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful response
 */
router.delete("/delete-course/:id", isAuthenticated, isAdmin("Admin"), catchAsyncErrors(async (req, res, next) => {
    try {

        if (!req.params.id) {
            throw new ErrorHandler("Please provide id", 404);
        }

        const deletedCourse = await Course.query().delete().where("course_id", req.params.id);

        if (!deletedCourse) {
            throw new ErrorHandler("Course not found", 404);
        }

        res.status(200).json({
            success: true,
            message: "Course deleted successfully"
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 400));
    }
}));

module.exports = router;
