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
    "Login que retorna el perfil completo"
    loginUsuario(email: String!, password: String!): Usuario
    
    "Lista todos los voluntariados registrados"
    obtenerVoluntariados: [Voluntariado]
    
    "Lista todos los usuarios (Solo para ADMIN)"
    obtenerUsuarios: [Usuario]
    
    "Consulta de perfil: datos de un usuario específico por su ID"
    obtenerUsuarioPorId(id: ID!): Usuario
  }

  type Mutation {
    "Registro de usuario"
    registrarUsuario(
      nombre: String!, 
      email: String!, 
      password: String!, 
      role: String
    ): Usuario

    "Actualiza los datos del perfil (nombre, email, password y role)"
    actualizarUsuario(
      id: ID!, 
      nombre: String, 
      email: String, 
      password: String,
      role: String
    ): Usuario

    "Crea un voluntariado"
    crearVoluntariado(
        titulo: String!, 
        tipo: String!, 
        descripcion: String, 
        email: String!, 
        jornada: String, 
        sueldo: Float
      ): Voluntariado

    "Limpia la base de datos"
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