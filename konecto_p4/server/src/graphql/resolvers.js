const Usuario = require('../models/Usuario');
const Voluntariado = require('../models/Voluntariado');
const bcrypt = require('bcryptjs');
const { ApolloError, UserInputError } = require('apollo-server-express');
const { PubSub } = require('graphql-subscriptions');

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
        return await Voluntariado.find().sort({ fechaCreacion: -1 });
      } catch (error) {
        throw new ApolloError("Error al obtener la lista");
      }
    },

    obtenerUsuarioPorId: async (_, { id }) => {
      try {
        const usuario = await Usuario.findById(id);
        if (!usuario) throw new ApolloError("Usuario no encontrado");
        return usuario;
      } catch (error) {
        throw new ApolloError("Error al buscar usuario: " + error.message);
      }
    }
  },

  Mutation: {
    registrarUsuario: async (_, args) => {
      try {
        const { email } = args;
        const existe = await Usuario.findOne({ email });
        if (existe) throw new UserInputError("El email ya está en uso");

        // El modelo Usuario.js se encarga de la encriptación mediante pre('save')
        const nuevoUsuario = new Usuario(args); 
        return await nuevoUsuario.save();
      } catch (error) {
        throw new ApolloError("Error en el registro: " + error.message);
      }
    },

    actualizarUsuario: async (_, { id, ...datosActualizados }) => {
      try {
        const usuario = await Usuario.findById(id);
        if (!usuario) throw new ApolloError("Usuario no encontrado");

        // Aplicamos los cambios. Si hay 'password', el middleware de Mongoose la encriptará
        Object.assign(usuario, datosActualizados);
        return await usuario.save();
      } catch (error) {
        throw new ApolloError("Error al actualizar: " + error.message);
      }
    },

    crearVoluntariado: async (_, args) => {
      try {
        const nuevoVol = new Voluntariado(args);
        const guardado = await nuevoVol.save();
        pubsub.publish(VOLUNTARIADO_CREADO, { voluntariadoCreado: guardado });
        return guardado;
      } catch (error) {
        throw new UserInputError("Error de validación: " + error.message);
      }
    },

    eliminarTodosVoluntariados: async () => {
      const resultado = await Voluntariado.deleteMany({});
      return `Éxito: Se han eliminado ${resultado.deletedCount} voluntariados.`;
    },

    eliminarTodosUsuarios: async () => {
      const resultado = await Usuario.deleteMany({});
      return `Éxito: Se han eliminado ${resultado.deletedCount} usuarios.`;
    }
  },

  Subscription: {
    voluntariadoCreado: {
      subscribe: () => pubsub.asyncIterator([VOLUNTARIADO_CREADO]),
    },
  },
};

module.exports = resolvers;