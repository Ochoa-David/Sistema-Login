require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors({
    origin: "*",  // Considera restringir esto en producción
    allowedHeaders: "Content-Type,Authorization"
}));
app.use(express.json());

// Servir archivos estáticos del frontend 
app.use(express.static(path.join(__dirname)));

// Conectar con mongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Conectado a MongoDB'))
    .catch(err => console.error(err));

// Rutas de autenticación y recuperación
const authRoutes = require('./routes/authRoutes');
app.use('/', authRoutes);

// Servir el index.html cuando se accede a la raíz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;

// Solo iniciar el servidor si no se está usando como módulo (para testing)
if (require.main === module) {
    app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
}

module.exports = app;