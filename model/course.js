const { Model } = require("objection");

class Course extends Model {

	static get tableName() {
		return "courses";
	}
	static get idColumn() {
		return "course_id";
	}

	// setting up validation for UserProfile Model
	static get jsonSchema() {
		return {
			type: "object",
			required: ["title", "category", "price", "status", "duration"],
			properties: {
				course_id: { type: "integer" },
				title: { type: "string" },
				description: { type: "string" },
				category: { type: "string" },
                level: {type: "string"},
                instructor: {type: "string"},
                price: {type: "number"},
                duration: {type: "integer"},
				status: {type: "string"},
                popularity: {type: "integer"}
			}
		};
	}

}

module.exports = Course;