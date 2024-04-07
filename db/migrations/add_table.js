// CREATE TABLE USERS (
//     user_id SERIAL PRIMARY KEY,
//     first_name TEXT,
//     last_name TEXT,
//     email TEXT,
//     phone_number TEXT,
//     password TEXT,
//     profile_pic TEXT,
//     reset_password_token TEXT,
//     role TEXT
// );


// CREATE TABLE courses (
//     course_id SERIAL PRIMARY KEY,
//     title TEXT,
//     description TEXT,
//     category TEXT,
//     level TEXT,
//     instructor TEXT,
//     price DECIMAL,
//     duration INTEGER,
//     status TEXT,
//     popularity INTEGER
// );


// CREATE TABLE enrollments (
//     enrollment_id SERIAL PRIMARY KEY,
//     user_id INTEGER REFERENCES users(user_id),
//     course_id INTEGER REFERENCES courses(course_id)
// );