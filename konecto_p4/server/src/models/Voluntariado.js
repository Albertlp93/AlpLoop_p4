const mongoose = require('mongoose');

const voluntariadoSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  tipo: { 
    type: String, 
    enum: ['OFERTA', 'DEMANDA'], 
    required: true 
  },
  descripcion: { type: String },
  jornada: { type: String },
  sueldo: { type: Number, default: 0 },
  email: { type: String, required: true },
  fechaCreacion: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Voluntariado', voluntariadoSchema);