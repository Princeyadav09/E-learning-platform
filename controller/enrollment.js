const express = require("express");
const router = express.Router();
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const Enrollment = require("../model/enrollment");
const Course = require("../model/course");
const sendMail = require("../utils/sendMail");
const User = require("../model/user");
const { isAuthenticated, isAdmin } = require("../middleware/auth");

// Course Enrollment Endpoint
/**
 * @swagger
 * /enrollment:
 *   post:
 *     summary: Create enrollment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               course_id:
 *                 type: integer
 *               user_id:
 *                 type: integer
 *             example:
 *               course_id: 123
 *               user_id: 456
 *     responses:
 *       200:
 *         description: Successful response
 */
router.post(
    "/", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
        try {
            const { course_id, user_id } = req.body;

            if (!course_id || !user_id) {
                throw new ErrorHandler("Provide courseID and userID to proceed.", 400);
            }

            // Check if the user is already enrolled in the course
            const existingEnrollment = await Enrollment.query().findOne({ user_id, course_id });

            if (existingEnrollment) {
                throw new ErrorHandler("You are already enrolled in this course", 400);
            }

            // Check if the course exists
            const course = await Course.query().findById(course_id);

            if (!course) {
                throw new ErrorHandler("Course not found", 404);
            }

            const user = await User.query().findById(user_id);

            if (!user) {
                throw new ErrorHandler("User not found", 404);
            }

            // Create new enrollment
            const newEnrollment = await Enrollment.query().insert({ user_id: user_id, course_id: course_id });

            try {
                await sendMail({
                    email: user.email,
                    subject: "Course Enrollment Confirmation",
                    message: `Hello ${user.first_name},\n\nYou have successfully enrolled in the course "${course.title}".\n\nThank you for choosing our platform.`,
                });
                res.status(201).json({
                    success: true,
                    message: `Enrolled in the course "${course.title}" successfully. Enrollment confirmation has been sent to ${user.email}.`,
                    data: newEnrollment
                });
            } catch (error) {
                return next(new ErrorHandler(error.message, 500));
            }
        } catch (error) {
            return next(new ErrorHandler(error.message, error.statusCode || 500));
        }
    }));

// View Enrolled Courses Endpoint
/**
 * @swagger
 * /enrollment/{id}:
 *   get:
 *     summary: Get enrollments by user ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User ID for which enrollments are to be retrieved
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       courseId:
 *                         type: integer
 *                         description: ID of the enrolled course
 *                         example: 123
 *                       userId:
 *                         type: integer
 *                         description: ID of the user
 *                         example: 456
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid user ID
 *       404:
 *         description: User not found or no enrollments found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: User not found or no enrollments found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Internal server error occurred
 */
router.get(
    "/:id", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
        try {
            const user_id = req.params.id; // Assuming authenticated user's ID is available in req.user

            if (!user_id) {
                throw new ErrorHandler("Provide userID to proceed.", 400);
            }

            // Step 1: Retrieve the list of course_ids in which the user is enrolled
            const enrollments = await Enrollment.query()
                .where('user_id', user_id)
                .select('course_id');

            // Extract course_ids from the enrollments
            const courseIds = enrollments.map(enrollment => enrollment.course_id);

            // Step 2: Fetch the details of each course using the retrieved course_ids
            const courses = await Course.query().findByIds(courseIds);

            // Step 3: Return the list of courses with their details
            res.status(200).json({
                success: true,
                data: courses
            });

        } catch (error) {
            return next(new ErrorHandler(error.message, error.statusCode || 500));
        }
    }));

module.exports = router;
