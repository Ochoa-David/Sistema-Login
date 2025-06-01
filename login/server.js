require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const router = express.Router();

const User = require('./models/users'); // Importa el modelo
const app = express();

// Middleware
app.use(cors({
    origin: "*",  // Permite peticiones desde cualquier origen xxxx
    allowedHeaders: "Content-Type,Authorization"
}));
app.use(bodyParser.json());
app.use(express.json());

// Servir archivos estáticos del frontend 
app.use(express.static(path.join(__dirname)));

// Conectar con mongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Conectado a MongoDB'))
    .catch(err => console.error(err));

// Ruta para registrar usuarios
app.post('/register', async (req, res) => {
    try {
        const { username, email, password, securityQuestion, securityAnswer } = req.body; 

        // Validar que los campos no estén vacíos
        if (!username || !email || !password || !securityQuestion || !securityAnswer) { 
            return res.status(400).json({ success: false, message: "Todos los campos son obligatorios" });
        }

        // Verificar si el usuario ya existe ( email O username)
        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "El usuario o email ya existe" });
        }

        // Hashear la contraseña y la respuesta de seguridad
        const hashedPassword = await bcrypt.hash(password, 10);
        // Normalizar la respuesta antes de hashear
        const normalizedAnswer = securityAnswer.toLowerCase().trim();
        const hashedAnswer = await bcrypt.hash(normalizedAnswer, 10);

        // Crear nuevo usuario con su pregunta de seguridad
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
        res.status(500).json({ success: false, message: "Error en el servidor" });
    }
});

// Ruta para iniciar sesión
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ success: false, message: 'Usuario no encontrado' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ success: false, message: 'Contraseña incorrecta' });

        const token = jwt.sign({ userId: user._id }, 'secreto', { expiresIn: '1h' });
        res.json({ success: true, token });

    } catch (err) {
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
});

// Ruta para recuperar contraseña
app.post('/recovery_password-rp', async (req, res) => {
    try {
        const { email } = req.body;
        
        // Validar email
        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: "Email es requerido" 
            });
        }
        
        // Buscar si el usuario existe
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "Correo no registrado" 
            });
        }
        
        // Si el usuario existe, responder con éxito
        res.status(200).json({
            success: true,
            message: "Correo verificado correctamente"
        });
        
    } catch (err) {
        console.error("Error al verificar email:", err);
        res.status(500).json({ 
            success: false, 
            message: "Error en el servidor" 
        });
    }
});

//verificar respuesta de seguridad
app.post('/com_password-cp', async (req, res) => {
    try {
        const { username, email, securityQuestion, securityAnswer } = req.body;
        
        // Validar que todos los campos estén presentes
        if (!username || !email || !securityQuestion || !securityAnswer) {
            return res.status(400).json({ 
                success: false, 
                message: "Todos los campos son obligatorios" 
            });
        }
        
        // Buscar el usuario 
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
        
        // Verificar pregunta de seguridad
        if (user.securityQuestion !== securityQuestion) {
            return res.status(400).json({ 
                success: false, 
                message: "Pregunta de seguridad incorrecta" 
            });
        }
        
        //Normalizar la respuesta de seguridad antes de comparar
        const normalizedAnswer = securityAnswer.toLowerCase().trim();
        const isSecurityAnswerValid = await bcrypt.compare(normalizedAnswer, user.securityAnswer);
        
        console.log('Respuesta normalizada:', normalizedAnswer);
        console.log('Hash almacenado:', user.securityAnswer);
        console.log('Comparación válida:', isSecurityAnswerValid);
        
        if (!isSecurityAnswerValid) {
            return res.status(400).json({ 
                success: false, 
                message: "Respuesta de seguridad incorrecta" 
            });
        }
        
        // Si todo es correcto, generar un token temporal para el cambio de contraseña
        const resetToken = jwt.sign(
            { userId: user._id, email: user.email }, 
            'secreto-reset', 
            { expiresIn: '15m' } // Token válido por 15 minutos
        );
        
        res.status(200).json({
            success: true,
            message: "Validación exitosa",
            resetToken: resetToken
        });
        
    } catch (err) {
        console.error("Error en validación de recuperación:", err);
        res.status(500).json({ 
            success: false, 
            message: "Error en el servidor" 
        });
    }
});

// Ruta para cambiar la contraseña después de la validación
app.post('/change-password-final', async (req, res) => {
    try {
        const { newPassword, confirmPassword } = req.body;
        const resetToken = req.headers.authorization?.replace('Bearer ', '');
        
        // Validar campos
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
        
        // Verificar token de reset
        if (!resetToken) {
            return res.status(400).json({ 
                success: false, 
                message: "Token de autorización requerido" 
            });
        }
        
        let decoded;
        try {
            decoded = jwt.verify(resetToken, 'secreto-reset');
        } catch (error) {
            return res.status(400).json({ 
                success: false, 
                message: "Token inválido o expirado" 
            });
        }
        
        // Buscar usuario por ID del token
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "Usuario no encontrado" 
            });
        }
        
        // Hashear la nueva contraseña
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Actualizar la contraseña
        user.password = hashedPassword;
        await user.save();
        
        res.status(200).json({ 
            success: true, 
            message: "Contraseña actualizada correctamente" 
        });
        
    } catch (error) {
        console.error("Error al cambiar contraseña:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error del servidor" 
        });
    }
});

// Servir el index.html cuando se accede a la raíz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

module.exports = router;
// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));