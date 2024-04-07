const { Model } = require("objection");

class Enrollment extends Model {

	static get tableName() {
		return "enrollments";
	}
	static get idColumn() {
		return "enrollment_id";
	}

	// setting up validation for UserProfile Model
	static get jsonSchema() {
		return {
			type: "object",
			properties: {
				enrollment_id: { type: "integer" },
				user_id: { type: "integer" },
				course_id: { type: "integer" }
			}
		};
	}

}

module.exports = Enrollment;