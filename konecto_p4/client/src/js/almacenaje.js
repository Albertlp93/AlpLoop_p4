/**
 * @file almacenaje.js
 * @description Módulo centralizado para la persistencia y comunicación asíncrona (Fetch API).
 * Sustituye el antiguo uso de localStorage por llamadas al servicio web GraphQL.
 */

const API_URL = 'http://localhost:4000/graphql';

/**
 * Gestiona la autenticación de usuarios.
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<Object>} Resultado de la operación y datos del usuario.
 */
async function loginUsuario(email, password) {
    const query = {
        query: `
            query Login($email: String!, $password: String!) {
                loginUsuario(email: $email, password: $password) {
                    id
                    nombre
                    role
                }
            }
        `,
        variables: { email, password }
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });

        const res = await response.json();

        if (res.errors) {
            return { success: false, error: res.errors[0].message };
        }

        return { success: true, data: res.data.loginUsuario };
    } catch (error) {
        console.error("Error en loginUsuario:", error);
        return { success: false, error: "No se pudo conectar con el servidor." };
    }
}

/**
 * Obtiene la lista completa de voluntariados desde la base de datos.
 */
async function obtenerListaVoluntariados() {
    const query = {
        query: `
            query {
                obtenerVoluntariados {
                    id
                    titulo
                    tipo
                    descripcion
                    jornada
                    sueldo
                }
            }
        `
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });

        const res = await response.json();
        return res.data.obtenerVoluntariados || [];
    } catch (error) {
        console.error("Error en obtenerListaVoluntariados:", error);
        return [];
    }
}

/**
 * Envía un nuevo voluntariado al servidor.
 */
async function crearNuevoVoluntariado(datos) {
    const query = {
        query: `
            mutation Crear($titulo: String!, $tipo: String!, $descripcion: String, $jornada: String, $sueldo: Int, $email: String!) {
                crearVoluntariado(titulo: $titulo, tipo: $tipo, descripcion: $descripcion, jornada: $jornada, sueldo: $sueldo, email: $email) {
                    id
                    titulo
                }
            }
        `,
        variables: datos
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });

        const res = await response.json();
        if (res.errors) throw new Error(res.errors[0].message);
        return { success: true, data: res.data.crearVoluntariado };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Función para que el Administrador vacíe la colección.
 */
async function limpiarBaseDatos() {
    const query = {
        query: `
            mutation {
                eliminarTodosVoluntariados
            }
        `
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });
        const res = await response.json();
        return res.data.eliminarTodosVoluntariados;
    } catch (error) {
        return "Error al procesar la eliminación.";
    }
}