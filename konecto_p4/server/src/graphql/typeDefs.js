const { gql } = require('apollo-server-express');

const typeDefs = gql`
  """
  Tipo que representa a un usuario con control de acceso basado en roles.
  """
  type Usuario {
    id: ID!
    nombre: String!
    email: String!
    role: String!
  }

  """
  Tipo que representa una oferta o demanda de voluntariado.
  """
  type Voluntariado {
      id: ID!
      titulo: String!
      tipo: String!
      descripcion: String
      email: String
      fechaCreacion: String
      jornada: String
      sueldo: Float
  }

  type Query {
    loginUsuario(email: String!, password: String!): Usuario
    obtenerVoluntariados: [Voluntariado]
    obtenerUsuarios: [Usuario]
    obtenerUsuarioPorId(id: ID!): Usuario
  }

  type Mutation {
    registrarUsuario(
      nombre: String!, 
      email: String!, 
      password: String!, 
      role: String
    ): Usuario

    actualizarUsuario(
      id: ID!, 
      nombre: String, 
      email: String, 
      password: String,
      role: String
    ): Usuario

    # --- NUEVA MUTATION: DEFINICIÓN ---
    "Elimina un usuario específico por su ID"
    eliminarUsuario(id: ID!): Boolean

    crearVoluntariado(
        titulo: String!, 
        tipo: String!, 
        descripcion: String, 
        email: String!, 
        jornada: String, 
        sueldo: Float
      ): Voluntariado

    eliminarTodosVoluntariados: String
    eliminarTodosUsuarios: String
    actualizarVoluntariado(id: ID!, titulo: String, descripcion: String, jornada: String, sueldo: Float): Voluntariado
    eliminarVoluntariado(id: ID!): Boolean
  }

  type Subscription {
    voluntariadoCreado: Voluntariado
  }
`;

module.exports = typeDefs;