const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const jwt = require("jsonwebtoken");
const sendMail = require("../utils/sendMail");
const sendToken = require("../utils/jwtToken");
const { isAuthenticated } = require("../middleware/auth");
const User = require("../model/user");
const bcrypt = require("bcryptjs");


// create user
/**
 * @swagger
 * /user/create-user:
 *   post:
 *     summary: Create a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phone_number:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates whether the operation was successful
 *                 message:
 *                   type: string
 *                   description: Success message
 *       400:
 *         description: Bad request or user already exists
 *       500:
 *         description: Internal server error
 */
router.post(
    "/create-user", async (req, res, next) => {
        try {

            const { first_name, last_name, email, password, phone_number, role } = req.body;

            if (!first_name || !email || !password) {
                throw new ErrorHandler("Please provide all required fields!", 400);
            }

            const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/;
            if (!passwordRegex.test(password)) {
                throw new ErrorHandler("Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one digit.", 400);
            }

            const userEmail = await User.query().where({ email: email });

            if (userEmail.length) {
                return next(new ErrorHandler("User already exists", 400));
            }

            if (req.files) {
                const myCloud = await cloudinary.v2.uploader.upload(req.files?.avatar?.tempFilePath, {
                    folder: "avatars",
                });
            }

            const user = {
                first_name: first_name,
                last_name: last_name ? last_name : "",
                email: email,
                phone_number: phone_number ? phone_number : "",
                password: await bcrypt.hash(password, 10),
                profile_pic: req.files ? myCloud.secure_url : "",
                role: role ? role : "user",

            };

            const activationToken = createActivationToken(user);

            const activationUrl = `${process.env.SERVER_URL}/api/v1/user/activation/${activationToken}`;

            try {
                await sendMail({
                    email: user.email,
                    subject: "Activate your account",
                    message: `Hello ${user.first_name}, please click on the link to activate your account: ${activationUrl}`,
                });
                res.status(201).json({
                    success: true,
                    message: `please check your email:- ${user.email} to activate your account!`,
                });
            } catch (error) {
                return next(new ErrorHandler(error.message, 500));
            }
        } catch (error) {
            return next(new ErrorHandler(error.message, 400));
        }
    }
);

// create activation token
const createActivationToken = (user) => {
    return jwt.sign(user, process.env.ACTIVATION_SECRET, {
        expiresIn: "30m",
    });
};

// user activation 
/* @swagger
* /user/activation/{token}:
*   get:
*     summary: Activate user
*     parameters:
*       - in: path
*         name: token
*         required: true
*         description: Activation token received in the email.
*         schema:
*           type: string
*     responses:
*       200:
*         description: User activation successful
*       400:
*         description: Invalid token
*       500:
*         description: Internal server error
*/
router.get(
    "/activation/:token",
    catchAsyncErrors(async (req, res, next) => {
        try {
            const activation_token = req.params.token;

            const newUser = jwt.verify(
                activation_token,
                process.env.ACTIVATION_SECRET
            );

            if (!newUser) {
                return next(new ErrorHandler("Invalid token", 400));
            }
            console.log(newUser);
            const { first_name, last_name, email, password, phone_number, profile_pic, role } = newUser;

            let user = await User.query().findOne({ email });

            //   if (user) {
            //     return next(new ErrorHandler("User already exists", 400));
            //   }

            user = await User.query().insert({
                first_name, last_name, email, password, phone_number, profile_pic, role
            });

            try {
                await sendMail({
                    email: user.email,
                    subject: "Account created succesfully",
                    message: `Hello ${user.first_name} ${user.last_name}, your account has been created successfully.`,
                });
            } catch (error) {
                return next(new ErrorHandler(error.message, 500));
            }

            sendToken(user, 201, res);
        } catch (error) {
            return next(new ErrorHandler(error.message, 500));
        }
    })
);

// login user
/**
 * @swagger
 * /user/login-user:
 *   post:
 *     summary: Login user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful response
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post(
    "/login-user",
    catchAsyncErrors(async (req, res, next) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return next(new ErrorHandler("Please provide the all fields!", 400));
            }

            const user = await User.query().findOne({ email });

            if (!user) {
                return next(new ErrorHandler("User doesn't exists!", 400));
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                return next(
                    new ErrorHandler("Please provide the correct information", 400)
                );
            }

            sendToken(user, 201, res);
        } catch (error) {
            return next(new ErrorHandler(error.message, 500));
        }
    })
);

// find user infoormation with the userId
/**
 * @swagger
 * /user/user-info/{id}:
 *   get:
 *     summary: Retrieve user information by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the user to retrieve information
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful response
 *       500:
 *         description: Internal server error
 */
router.get(
    "/user-info/:id",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        try {
            const user = await User.query().findById(req.params.id);

            res.status(201).json({
                success: true,
                user,
            });
        } catch (error) {
            return next(new ErrorHandler(error.message, 500));
        }
    })
);

// update user info
/**
 * @swagger
 * /user/update-user-info:
 *   put:
 *     summary: Update user information
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               email:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *             example:
 *               email: user@example.com
 *               phone_number: "+1234567890"
 *               first_name: John
 *               last_name: Doe
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
 *                 user:
 *                   $ref: '#/components/schemas/User'
 */
router.put(
    "/update-user-info",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        try {
            const { email, phone_number, first_name, last_name, } = req.body;

            const userEmail = await User.query().where({ email: email });

            if (userEmail.length) {
                return next(new ErrorHandler("User already exists", 400));
            }
            const user = req.user;
            const updatedUser = await User.query()
                .findById(req.user.user_id)
                .update({
                    first_name: first_name ? first_name : user.first_name,
                    last_name: last_name ? last_name : user.last_name,
                    email: email ? email : user.email,
                    password: user.password,
                    phone_number: phone_number ? phone_number : user.phone_number,
                    role: user.role,
                    reset_password_token: "",
                    profile_pic: user.profile_pic
                })
                .returning('*');

            if (!updatedUser) {
                return next(new ErrorHandler("User not found", 400));
            }

            res.status(200).json({
                success: true,
                updatedUser,
            });
        } catch (error) {
            return next(new ErrorHandler(error.message, 500));
        }
    })
);

// update user profile
/**
 * @swagger
 * /user/update-avatar :
 *   put:
 *     summary: update profile picture using postman 
 *     responses:
 *       200:
 *         description: Successful response
 */
router.put(
    "/update-avatar",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        try {
            let existsUser = await User.query().findById(req.user.user_id);
            if (req.files) {

                const myCloud = await cloudinary.v2.uploader.upload(req.files.avatar.tempFilePath, {
                    folder: "avatars",
                });
                const { first_name, last_name, email, password, phone_number, role } = req.user;

                existsUser = {
                    first_name,
                    last_name,
                    email,
                    password,
                    phone_number,
                    profile_pic: myCloud.secure_url,
                    role
                };
            }

            const user = await User.query().update(existsUser);

            res.status(200).json({
                success: true,
                user: existsUser,
            });
        } catch (error) {
            return next(new ErrorHandler(error.message, 500));
        }
    })
);

// reset user password request
/**
 * @swagger
 * /user/reset-password:
 *   post:
 *     summary: Reset user password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset link sent successfully
 */
router.post(
    "/reset-password",
    catchAsyncErrors(async (req, res, next) => {
        try {
            const { email } = req.body;

            // Find user by email
            const user = await User.query().where('email', email).first();
            if (!user) {
                return next(new ErrorHandler("User not found", 400));
            }

            // Generate reset password token
            const token = await bcrypt.hash(process.env.RESET_KEY, 10);
            user.reset_password_token = token;

            const { first_name, password } = user;

            await User.query().update({
                first_name,
                email,
                password,
                reset_password_token: token,
            })

            const resetUrl = `${process.env.SERVER_URL}/api/v1/user/reset-password/${token}`;

            try {
                await sendMail({
                    email: user.email,
                    subject: "Resey your password",
                    message: `Hello ${user.first_name}, please click on the link to reset your password: ${resetUrl}`,
                });
                res.status(200).json({
                    success: true,
                    message: `please check your email:- ${user.email} to reset your password!`,
                });
            } catch (error) {
                return next(new ErrorHandler(error.message, 500));
            }
        } catch (error) {
            return next(new ErrorHandler(error.message, 500));
        }
    })
);

// reset password using
/**
 * @swagger
 * /user/reset-password:
 *   put:
 *     summary: Reset password using token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *               - token
 *             properties:
 *               password:
 *                 type: string
 *                 description: New password
 *               token:
 *                 type: string
 *                 description: Reset token received by the user
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates whether the operation was successful
 *                 message:
 *                   type: string
 *                   description: Success message
 *       400:
 *         description: Invalid token or missing password
 *       500:
 *         description: Failed to reset password
 */
router.put(
    "/reset-password",
    catchAsyncErrors(async (req, res, next) => {
        try {
            const { password, token } = req.body;

            console.log(req.body)

            if (!token) {
                return next(new ErrorHandler("Token required!", 400));
            }

            if (!password) {
                return next(new ErrorHandler("Password required", 400));
            }

            // Find user by reset password token
            const user = await User.query().where('reset_password_token', token).first();
            if (!user) {
                return next(new ErrorHandler("Invalid token !", 400));
            }

            try {
                const { first_name, last_name, email, phone_number, profile_pic, role } = user;
                // Update user password and clear reset password token
                await User.query().update({
                    first_name,
                    last_name,
                    email,
                    phone_number,
                    password: await bcrypt.hash(password, 10),
                    profile_pic,
                    reset_password_token: '',
                    role,
                })

                res.status(200).json({ success: true, message: "Password reset successfully" });
            } catch (error) {
                return res
                    .status(500)
                    .json({ success: false, message: "Failed to verify reset password token" });
            }
        } catch (error) {
            return next(new ErrorHandler(error.message, 500));
        }
    })
);


module.exports = router;