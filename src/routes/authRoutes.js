const express = require("express");
const { login, register } = require("../controllers/authController");
const { validate } = require("../middleware/validate");
const { asyncHandler } = require("../utils/asyncHandler");
const { loginSchema, registerSchema } = require("../validators/authValidator");

const authRouter = express.Router();

authRouter.post("/register", validate({ body: registerSchema }), asyncHandler(register));
authRouter.post("/login", validate({ body: loginSchema }), asyncHandler(login));

module.exports = { authRouter };
