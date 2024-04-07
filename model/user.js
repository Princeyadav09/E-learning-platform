const { Model } = require("objection");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

class User extends Model {

	static get tableName() {
		return "users";
	}
	static get idColumn() {
		return "user_id";
	}

	// setting up validation for UserProfile Model
	static get jsonSchema() {
        return {
            type: "object",
            required: ["first_name", "email", "password"],
            properties: {
                user_id: { type: "integer" },
                first_name: { type: "string" },
                last_name: { type: "string" },
                email: { type: "string" },
                password: { type: "string", minLength: 5 },
                phone_number: { type: "string" },
                profile_pic: { type: "string" },
                reset_password_token: { type: "string" },
                role: { type: "string", default: "user" }
            },
        };
    }

	// jwt token
	getJwtToken = function () {
		return jwt.sign({ user_id: this.user_id}, process.env.JWT_SECRET_KEY,{
		    expiresIn: process.env.JWT_EXPIRES,
		});
    };

	// compare password
	comparePassword = async function (enteredPassword) {
        return await bcrypt.compare(enteredPassword, this.password);
    }

}

module.exports = User;