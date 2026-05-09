const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'USER' }
});


// MIDDLEWARE: Encriptar antes de guardar 
usuarioSchema.pre('save', async function() {
    // Si la contraseña no ha cambiado, no hacemos nada
    if (!this.isModified('password')) return;

    try {
        const salt = await bcrypt.genSalt(10);
        // Encriptamos la contraseña "limpia" que viene del resolver
        this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
        throw new Error("Error al encriptar la contraseña: " + error.message);
    }
});


module.exports = mongoose.model('Usuario', usuarioSchema);