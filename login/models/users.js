/**
 * Import statements must be at the top of the file.
 */
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    securityQuestion: { type: String, required: true },  // Pregunta de seguridad
    securityAnswer: { type: String, required: true }     // Respuesta encriptada
});

const User = mongoose.model('User', UserSchema);
module.exports = User;
