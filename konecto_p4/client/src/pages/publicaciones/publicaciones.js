/**
 * @file publicaciones.js
 * @description Gestión de CRUD, Gráficos dinámicos, Sockets e Interfaz por Rol.
 */

const socket = io("http://localhost:4000");
let miGrafico = null; // Instancia global del gráfico

document.addEventListener('DOMContentLoaded', () => {
    // 1. SESIÓN Y HEADER
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    const userRole = localStorage.getItem('userRole');
    const userEmail = localStorage.getItem('userEmail');

    if (!userId) { window.location.href = '../login/login.html'; return; }

    // --- LÓGICA DE INTERFAZ POR ROL (NUEVO) ---
    // Si el usuario es ADMIN, inyectamos la pestaña de Usuarios en la Navbar
    if (userRole === 'ADMIN') {
        const navMenu = document.getElementById('nav-menu');
        if (navMenu) {
            const li = document.createElement('li');
            li.innerHTML = `<a href="../usuarios/usuarios.html">Usuarios</a>`;
            navMenu.appendChild(li);
        }
    }

    document.getElementById('user-display').textContent = userName;
    document.getElementById('role-badge').textContent = userRole;

    document.getElementById('logoutBtn').onclick = () => {
        localStorage.clear();
        window.location.href = '../login/login.html';
    };

    // 2. LÓGICA DINÁMICA DEL FORMULARIO
    const selectTipo = document.getElementById('tipo');
    const camposDinamicos = document.getElementById('camposDinamicos');
    const grupoSueldo = document.getElementById('grupoSueldo');

    if (selectTipo) {
        selectTipo.addEventListener('change', () => {
            camposDinamicos.classList.remove('d-none');
            grupoSueldo.classList.toggle('d-none', selectTipo.value !== 'OFERTA');
        });
    }

    // 3. EVENTO SOCKET
    socket.on('actualizar_muro', () => {
        cargarPublicaciones(userEmail, userRole);
    });

    // 4. CREAR PUBLICACIÓN
    document.getElementById('formPublicar').addEventListener('submit', async (e) => {
        e.preventDefault();
        const variables = {
            titulo: document.getElementById('titulo').value.trim(),
            tipo: selectTipo.value,
            descripcion: document.getElementById('descripcion').value.trim(),
            jornada: document.getElementById('jornada').value,
            sueldo: parseFloat(document.getElementById('sueldo').value) || 0,
            email: userEmail
        };

        const mutation = `mutation($titulo: String!, $tipo: String!, $descripcion: String, $email: String!, $jornada: String, $sueldo: Float) {
            crearVoluntariado(titulo: $titulo, tipo: $tipo, descripcion: $descripcion, email: $email, jornada: $jornada, sueldo: $sueldo) { id }
        }`;

        const ok = await ejecutarFetch(mutation, variables);
        if (ok) {
            alert("✅ Publicado con éxito");
            socket.emit('nueva_publicacion');
            location.reload();
        }
    });

    // 5. EDITAR PUBLICACIÓN (SUBMIT MODAL)
    document.getElementById('formEditar').addEventListener('submit', async (e) => {
        e.preventDefault();
        const variables = {
            id: document.getElementById('edit-id').value,
            titulo: document.getElementById('edit-titulo').value.trim(),
            descripcion: document.getElementById('edit-descripcion').value.trim(),
            jornada: document.getElementById('edit-jornada').value,
            sueldo: parseFloat(document.getElementById('edit-sueldo').value) || 0
        };

        const mutation = `mutation($id: ID!, $titulo: String, $descripcion: String, $jornada: String, $sueldo: Float) {
            actualizarVoluntariado(id: $id, titulo: $titulo, descripcion: $descripcion, jornada: $jornada, sueldo: $sueldo) { id }
        }`;

        const ok = await ejecutarFetch(mutation, variables);
        if (ok) {
            alert("✅ Cambios guardados");
            socket.emit('nueva_publicacion');
            location.reload();
        }
    });

    cargarPublicaciones(userEmail, userRole);
});

// --- FUNCIONES DE APOYO ---

async function cargarPublicaciones(userEmail, userRole) {
    const query = `query { obtenerVoluntariados { id titulo tipo descripcion email jornada sueldo } }`;
    try {
        const res = await fetch('http://localhost:4000/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });
        const { data } = await res.json();
        const body = document.getElementById('tablaPublicacionesBody');
        if (!body) return;
        body.innerHTML = '';

        if (data && data.obtenerVoluntariados) {
            let filtrados = data.obtenerVoluntariados;
            if (userRole !== 'ADMIN') filtrados = filtrados.filter(p => p.email === userEmail);
            
            // Estadísticas para el Gráfico
            const ofertas = filtrados.filter(p => p.tipo === 'OFERTA').length;
            const demandas = filtrados.filter(p => p.tipo === 'DEMANDA').length;
            actualizarGrafico(ofertas, demandas);
            
            const totalCountEl = document.getElementById('total-count');
            if (totalCountEl) totalCountEl.textContent = filtrados.length;

            filtrados.forEach(pub => {
                const tr = document.createElement('tr');
                const pubData = JSON.stringify(pub).replace(/'/g, "&apos;");
                const infoSueldo = pub.tipo === 'OFERTA' ? `<br><span class="text-success fw-bold small">${pub.sueldo}€/año</span>` : '';

                tr.innerHTML = `
                    <td class="ps-4 align-middle"><span class="badge ${pub.tipo === 'OFERTA' ? 'bg-success' : 'bg-warning text-dark'}">${pub.tipo}</span></td>
                    <td class="align-middle"><b>${pub.titulo}</b><br><small class="text-muted">${pub.descripcion}</small></td>
                    <td class="align-middle"><span class="badge bg-light text-dark border">${pub.jornada}</span>${infoSueldo}</td>
                    <td class="align-middle"><small class="text-muted">${pub.email}</small></td>
                    <td class="text-center align-middle">
                        <div class="btn-group">
                            <button class="btn btn-sm btn-outline-secondary" onclick='abrirModalEditar(${pubData})'><i class="bi bi-pencil-fill"></i></button>
                            <button class="btn btn-sm btn-outline-danger" onclick="eliminarPublicacion('${pub.id}')"><i class="bi bi-trash3-fill"></i></button>
                        </div>
                    </td>
                `;
                body.appendChild(tr);
            });
        }
    } catch (err) { console.error(err); }
}

window.eliminarPublicacion = async (id) => {
    if (!confirm("¿Eliminar publicación?")) return;
    const mutation = `mutation($id: ID!) { eliminarVoluntariado(id: $id) }`;
    const ok = await ejecutarFetch(mutation, { id });
    if (ok) {
        socket.emit('nueva_publicacion');
        location.reload();
    }
};

window.abrirModalEditar = (pub) => {
    document.getElementById('edit-id').value = pub.id;
    document.getElementById('edit-titulo').value = pub.titulo;
    document.getElementById('edit-descripcion').value = pub.descripcion;
    document.getElementById('edit-jornada').value = pub.jornada;
    document.getElementById('edit-sueldo').value = pub.sueldo || 0;

    const grupoSueldoModal = document.getElementById('grupoSueldoModal');
    if (grupoSueldoModal) {
        if (pub.tipo === 'DEMANDA') {
            grupoSueldoModal.classList.add('d-none');
        } else {
            grupoSueldoModal.classList.remove('d-none');
        }
    }

    new bootstrap.Modal(document.getElementById('modalEditar')).show();
};

function actualizarGrafico(o, d) {
    const canvas = document.getElementById('graficoPublicaciones');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (miGrafico) miGrafico.destroy();
    
    miGrafico = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Ofertas', 'Demandas'],
            datasets: [{
                data: [o, d],
                backgroundColor: ['#198754', '#ffc107'],
                borderWidth: 0
            }]
        },
        options: { cutout: '70%', plugins: { legend: { display: false } }, responsive: true, maintainAspectRatio: false }
    });
}

async function ejecutarFetch(query, variables) {
    try {
        const res = await fetch('http://localhost:4000/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, variables })
        });
        const result = await res.json();
        if (result.errors) { alert("Error: " + result.errors[0].message); return false; }
        return true;
    } catch (err) { return false; }
}