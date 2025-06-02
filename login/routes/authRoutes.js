const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Registro de usuario
router.post('/register', authController.register);

// Login de usuario
router.post('/login', authController.login);

// Verificar email para recuperación de contraseña
router.post('/recovery_password-rp', authController.recoveryPassword);

// Verificar respuesta de seguridad
router.post('/com_password-cp', authController.comPassword);

// Cambiar contraseña después de validación
router.post('/change-password-final', authController.changePasswordFinal);

module.exports = router;
