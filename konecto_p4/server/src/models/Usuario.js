const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  nombre: { 
    type: String, 
    required: [true, 'El nombre es obligatorio'] 
  },
  email: { 
    type: String, 
    required: [true, 'El email es obligatorio'], 
    unique: true,
    lowercase: true 
  },
  password: { 
    type: String, 
    required: [true, 'La contraseña es obligatoria'] 
  },
  role: { 
    type: String, 
    enum: ['ADMIN', 'USER'], 
    default: 'USER' // Por defecto, todos son usuarios normales
  }
});

module.exports = mongoose.model('Usuario', usuarioSchema);