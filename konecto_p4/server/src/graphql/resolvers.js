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

    // NUEVA QUERY: Obtener todos los usuarios para el panel ADMIN
    obtenerUsuarios: async () => {
      try {
        return await Usuario.find();
      } catch (error) {
        throw new ApolloError("Error al obtener usuarios");
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

        const nuevoUsuario = new Usuario(args); 
        return await nuevoUsuario.save();
      } catch (error) {
        throw new ApolloError("Error en el registro: " + error.message);
      }
    },

    // ACTUALIZACIÓN MEJORADA: Soporta cambio de ROL y encriptación de nueva PASSWORD
    actualizarUsuario: async (_, { id, ...datosActualizados }) => {
      try {
        const usuario = await Usuario.findById(id);
        if (!usuario) throw new ApolloError("Usuario no encontrado");

        // Si se está enviando una nueva contraseña, hay que encriptarla
        if (datosActualizados.password) {
          const salt = await bcrypt.genSalt(10);
          datosActualizados.password = await bcrypt.hash(datosActualizados.password, salt);
        }

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

    actualizarVoluntariado: async (_, { id, ...datos }) => {
      try {
        const voluntariado = await Voluntariado.findByIdAndUpdate(
          id, 
          { $set: datos }, 
          { new: true }
        );
        if (!voluntariado) throw new ApolloError("Publicación no encontrada");
        return voluntariado;
      } catch (error) {
        throw new ApolloError("Error al actualizar voluntariado: " + error.message);
      }
    },

    eliminarVoluntariado: async (_, { id }) => {
      try {
        const resultado = await Voluntariado.findByIdAndDelete(id);
        return !!resultado;
      } catch (error) {
        throw new ApolloError("Error al eliminar: " + error.message);
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