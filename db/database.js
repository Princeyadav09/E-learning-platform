const Knex = require('knex');
const { Model } = require('objection');
const knexConfig = require('./knexConfig');

//Knex Configuration
const knex = Knex(knexConfig);

const initializeDB = function () {
    try {
        // Initialize knex Model
        Model.knex(knex);
        console.log("Database connected.");
    } catch (error) {
        console.error('Error initializing database:', error);
    }
};

const destroyKnex = function () {
    knex.destroy();
}

module.exports = {initializeDB, destroyKnex};

