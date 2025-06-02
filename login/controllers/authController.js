// controllers/authController.js

const dotenv = require('dotenv');
dotenv.config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/users');

// Utilidad para ocultar mensajes de error sensibles
function genericServerError(res) {
    return res.status(500).json({ success: false, message: "Error en el servidor" });
}

// Registro de usuario
exports.register = async (req, res) => {
    try {
        const { username, email, password, securityQuestion, securityAnswer } = req.body;

        if (!username || !email || !password || !securityQuestion || !securityAnswer) {
            return res.status(400).json({ success: false, message: "Todos los campos son obligatorios" });
        }

        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "El usuario o email ya existe" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const normalizedAnswer = securityAnswer.toLowerCase().trim();
        const hashedAnswer = await bcrypt.hash(normalizedAnswer, 10);

        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            securityQuestion,
            securityAnswer: hashedAnswer
        });

        await newUser.save();
        res.status(201).json({ success: true, message: "Usuario registrado con éxito" });

    } catch (err) {
        console.error("Error en el registro:", err);
        return genericServerError(res);
    }
};

// Login de usuario
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ success: false, message: 'Usuario no encontrado' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ success: false, message: 'Contraseña incorrecta' });

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'secreto',
            { expiresIn: '1h' }
        );
        res.json({ success: true, token });

    } catch (err) {
        console.error("Error en login:", err);
        return genericServerError(res);
    }
};

// Verificar email para recuperación
exports.recoveryPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email es requerido"
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Correo no registrado"
            });
        }

        res.status(200).json({
            success: true,
            message: "Correo verificado correctamente"
        });

    } catch (err) {
        console.error("Error al verificar email:", err);
        return genericServerError(res);
    }
};

// Verificar respuesta de seguridad
exports.comPassword = async (req, res) => {
    try {
        const { username, email, securityQuestion, securityAnswer } = req.body;

        if (!username || !email || !securityQuestion || !securityAnswer) {
            return res.status(400).json({
                success: false,
                message: "Todos los campos son obligatorios"
            });
        }

        const user = await User.findOne({
            email: email,
            username: username
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }

        if (user.securityQuestion !== securityQuestion) {
            return res.status(400).json({
                success: false,
                message: "Pregunta de seguridad incorrecta"
            });
        }

        const normalizedAnswer = securityAnswer.toLowerCase().trim();
        const isSecurityAnswerValid = await bcrypt.compare(normalizedAnswer, user.securityAnswer);

        if (!isSecurityAnswerValid) {
            return res.status(400).json({
                success: false,
                message: "Respuesta de seguridad incorrecta"
            });
        }

        const resetToken = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_RESET_SECRET || 'secreto-reset',
            { expiresIn: '15m' }
        );

        res.status(200).json({
            success: true,
            message: "Validación exitosa",
            resetToken: resetToken
        });

    } catch (err) {
        console.error("Error en validación de recuperación:", err);
        return genericServerError(res);
    }
};

// Cambiar contraseña después de validación
exports.changePasswordFinal = async (req, res) => {
    try {
        const { newPassword, confirmPassword } = req.body;
        const resetToken = req.headers.authorization?.replace('Bearer ', '');

        if (!newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Todos los campos son obligatorios"
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Las contraseñas no coinciden"
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "La contraseña debe tener al menos 6 caracteres"
            });
        }

        if (!resetToken) {
            return res.status(400).json({
                success: false,
                message: "Token de autorización requerido"
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(
                resetToken,
                process.env.JWT_RESET_SECRET || 'secreto-reset'
            );
        } catch (error) {
            console.error("Error al verificar el token de reseteo:", error);
            return res.status(400).json({
                success: false,
                message: "Token inválido o expirado"
            });
        }

        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Contraseña actualizada correctamente"
        });

    } catch (error) {
        console.error("Error al cambiar contraseña:", error);
        return genericServerError(res);
    }
};