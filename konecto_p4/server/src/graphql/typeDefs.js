const { gql } = require('apollo-server-express');

const typeDefs = gql`
  """
  Tipo que representa a un usuario con control de acceso basado en roles.
  """
  type Usuario {
    id: ID!
    nombre: String!
    email: String!
    role: String! # USER o ADMIN
  }

  """
  Tipo que representa una oferta o demanda de voluntariado.
  """
  type Voluntariado {
    id: ID!
    titulo: String!
    tipo: String!
    descripcion: String
    jornada: String
    sueldo: Int
    email: String
    fechaCreacion: String
  }

  type Query {
    "Login que retorna el perfil completo incluyendo el rol"
    loginUsuario(email: String!, password: String!): Usuario
    
    "Lista todos los voluntariados registrados"
    obtenerVoluntariados: [Voluntariado]
    
    "Consulta de usuarios (Solo accesible para ADMIN en la lógica)"
    obtenerUsuarios: [Usuario]
  }

  type Mutation {
    "Registro de usuario permitiendo asignar rol (opcional)"
    registrarUsuario(
      nombre: String!, 
      email: String!, 
      password: String!, 
      role: String
    ): Usuario

    "Crea un voluntariado y dispara una notificación por WebSocket"
    crearVoluntariado(
      titulo: String!, 
      tipo: String!, 
      descripcion: String, 
      jornada: String, 
      sueldo: Int, 
      email: String!
    ): Voluntariado

    "Limpia la colección completa (Uso para el administrador)"
    eliminarTodosVoluntariados: String
  }

  type Subscription {
    "Evento que se dispara automáticamente cuando se publica un nuevo voluntariado"
    voluntariadoCreado: Voluntariado
  }
`;

module.exports = typeDefs;