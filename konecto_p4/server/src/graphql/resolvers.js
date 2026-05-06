const Usuario = require('../models/Usuario');
const Voluntariado = require('../models/Voluntariado');
const bcrypt = require('bcryptjs');
const { ApolloError, UserInputError } = require('apollo-server-express');
const { PubSub } = require('graphql-subscriptions');

// Inicializamos PubSub para manejar los WebSockets
const pubsub = new PubSub();
const VOLUNTARIADO_CREADO = 'VOLUNTARIADO_CREADO';

const resolvers = {
  Query: {
    loginUsuario: async (_, { email, password }) => {
      try {
        const usuario = await Usuario.findOne({ email });
        if (!usuario) throw new UserInputError("Usuario no registrado");

        const esValido = await bcrypt.compare(password, usuario.password);
        if (!esValido) throw new UserInputError("Contraseña incorrecta");

        return usuario;
      } catch (error) {
        throw new ApolloError(error.message);
      }
    },

    obtenerVoluntariados: async () => {
      try {
        // Mongoose devuelve los documentos más recientes primero
        return await Voluntariado.find().sort({ fechaCreacion: -1 });
      } catch (error) {
        throw new ApolloError("Error al obtener la lista");
      }
    },

    obtenerUsuarios: async () => {
      return await Usuario.find();
    }
  },

  Mutation: {
    registrarUsuario: async (_, args) => {
      try {
        const { email, password } = args;
        const existe = await Usuario.findOne({ email });
        if (existe) throw new UserInputError("El email ya está en uso");

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const nuevoUsuario = new Usuario({
          ...args,
          password: hashedPassword
        });

        return await nuevoUsuario.save();
      } catch (error) {
        throw new ApolloError("Error en el registro: " + error.message);
      }
    },

    crearVoluntariado: async (_, args) => {
      try {
        const nuevoVol = new Voluntariado(args);
        const guardado = await nuevoVol.save();

        // NOTIFICACIÓN EN TIEMPO REAL
        // Emitimos el evento para que los clientes suscritos se actualicen
        pubsub.publish(VOLUNTARIADO_CREADO, { voluntariadoCreado: guardado });

        return guardado;
      } catch (error) {
        throw new UserInputError("Error de validación: " + error.message);
      }
    },

    eliminarTodosVoluntariados: async () => {
      const resultado = await Voluntariado.deleteMany({});
      return `Éxito: Se han eliminado ${resultado.deletedCount} registros.`;
    }
  },

  Subscription: {
    voluntariadoCreado: {
      // Los clientes se "enganchan" a este iterador para recibir datos
      subscribe: () => pubsub.asyncIterator([VOLUNTARIADO_CREADO]),
    },
  },
};

module.exports = resolvers;