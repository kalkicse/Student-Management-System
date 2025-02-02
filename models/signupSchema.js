// signupSchema.js
const mongoose = require('mongoose');

const signupSchema = new mongoose.Schema({
    // Define your schema fields here
    email: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Signup', signupSchema,'signup');
