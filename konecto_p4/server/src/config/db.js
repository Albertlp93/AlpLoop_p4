const mongoose = require('mongoose');
const path = require('path');
// Buscamos el .env dos niveles arriba de donde está este archivo (en la raíz de /server)
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const conectarDB = async () => {
    // Imprimimos la URI para saber si por fin la ha leído (luego borraremos esto)
    console.log("Intentando conectar con URI:", process.env.MONGO_URI ? "DETECTADA ✅" : "NO DETECTADA ❌");

    try {
        if (!process.env.MONGO_URI) {
            throw new Error("La URI de MongoDB no está definida en el archivo .env");
        }
        
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Conectado');
    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
        process.exit(1);
    }
};

module.exports = conectarDB;