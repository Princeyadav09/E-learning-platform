module.exports = {
    client: 'pg',
    connection: process.env.DB_URL,
    migrations: {
        directory: __dirname + '/db/migrations'
    },
    seeds: {
        directory: __dirname + '/db/seeds'
    }
}