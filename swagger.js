const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'My API',
        version: '1.0.0',
        description: 'My API Description',
    },
    servers: [
        {
            url: '/api/v1', // Specify the base path here
            description: 'Base URL for the API',
        },
    ],
};

const options = {
    swaggerDefinition,
    apis: ['./controller/*.js'], // Path to the API routes in your Node.js application
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;