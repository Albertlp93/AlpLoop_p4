/**
 * @file dashboard.js
 * @description Lógica del panel de control con soporte para tiempo real (WebSockets).
 */

window.onload = async () => {
    // 1. Control de acceso (Roles y Sesión)
    const role = sessionStorage.getItem('role');
    const nombre = sessionStorage.getItem('nombre');

    if (!role) {
        window.location.href = '../login/login.html';
        return;
    }

    // Mostrar info de usuario y rol
    document.getElementById('userRole').innerText = role;
    
    // 2. Lógica de Administrador
    if (role === 'ADMIN') {
        const adminPanel = document.getElementById('adminPanel');
        if(adminPanel) adminPanel.style.display = 'block';
    }

    // 3. Carga inicial de datos (Asíncrona)
    await renderizarVoluntariados();

    // 4. Configuración de Tiempo Real (WebSockets)
    conectarWebSocket();
};

/**
 * Obtiene y dibuja los voluntariados en el DOM
 */
async function renderizarVoluntariados() {
    const lista = await obtenerListaVoluntariados();
    const container = document.getElementById('voluntariadosContainer');
    
    if (lista.length === 0) {
        container.innerHTML = '<p>No hay voluntariados publicados todavía.</p>';
        return;
    }

    container.innerHTML = lista.map(v => crearHTMLCarta(v)).join('');
}

/**
 * Genera el HTML de una carta de voluntariado
 */
function crearHTMLCarta(v) {
    return `
        <div class="card" id="card-${v.id}" style="border-left: 5px solid ${v.tipo === 'OFERTA' ? '#2ecc71' : '#e67e22'}">
            <h4>${v.titulo}</h4>
            <span class="badge">${v.tipo}</span>
            <p>${v.descripcion || 'Sin descripción'}</p>
            <small>Contacto: ${v.email}</small>
        </div>
    `;
}

/**
 * Conexión WebSocket para recibir actualizaciones en tiempo real
 */
function conectarWebSocket() {
    // La URL del servidor GraphQL para suscripciones suele ser /graphql
    const socket = new WebSocket('ws://localhost:4000/graphql', 'graphql-ws');

    socket.onopen = () => {
        // Mensaje de inicialización del protocolo GraphQL-WS
        const initMsg = JSON.stringify({ type: 'connection_init', payload: {} });
        socket.send(initMsg);

        // Mensaje para suscribirse al evento 'voluntariadoCreado'
        const subMsg = JSON.stringify({
            id: '1',
            type: 'start',
            payload: {
                query: `
                    subscription {
                        voluntariadoCreado {
                            id
                            titulo
                            tipo
                            descripcion
                            email
                        }
                    }
                `
            }
        });
        socket.send(subMsg);
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        // Si recibimos un dato de la suscripción
        if (data.type === 'data' && data.payload.data.voluntariadoCreado) {
            const nuevoVol = data.payload.data.voluntariadoCreado;
            const container = document.getElementById('voluntariadosContainer');
            
            // Insertar el nuevo voluntariado al principio de la lista con un efecto visual
            const divTemporal = document.createElement('div');
            divTemporal.innerHTML = crearHTMLCarta(nuevoVol);
            const nuevaCarta = divTemporal.firstElementChild;
            
            nuevaCarta.style.backgroundColor = '#fff9c4'; // Color de resaltado temporal
            container.prepend(nuevaCarta);
            
            console.log("¡Nuevo voluntariado recibido en tiempo real!");
        }
    };

    socket.onerror = (error) => console.error("Error en WebSocket:", error);
}

/**
 * Función para el botón del Administrador
 */
async function ejecutarLimpieza() {
    if (confirm("¿Estás seguro de que quieres borrar TODOS los voluntariados?")) {
        const mensaje = await limpiarBaseDatos();
        alert(mensaje);
        location.reload(); // Recargamos para ver la lista vacía
    }
}

function cerrarSesion() {
    sessionStorage.clear();
    window.location.href = '../login/login.html';
}