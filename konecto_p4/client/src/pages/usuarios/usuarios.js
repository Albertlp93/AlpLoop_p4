/**
 * @file usuarios.js
 * @description Panel de control para administradores. Gestión integral de usuarios.
 */

document.addEventListener('DOMContentLoaded', () => {
    const userRole = localStorage.getItem('userRole');
    const userName = localStorage.getItem('userName');

    // 1. Seguridad: Solo ADMIN entra
    if (userRole !== 'ADMIN') {
        window.location.href = '../dashboard/dashboard.html';
        return;
    }

    // 2. Inyectar pestaña activa en Navbar
    const navMenu = document.getElementById('nav-menu');
    if (navMenu) {
        const li = document.createElement('li');
        li.innerHTML = `<a href="usuarios.html" class="active">Usuarios</a>`;
        navMenu.appendChild(li);
    }

    // 3. Header y Logout
    document.getElementById('user-display').textContent = userName;
    document.getElementById('logoutBtn').onclick = () => {
        localStorage.clear();
        window.location.href = '../login/login.html';
    };

    cargarUsuarios();

    // 4. Submit del Formulario de Edición
    document.getElementById('formEditUser').addEventListener('submit', async (e) => {
        e.preventDefault();

        const variables = {
            id: document.getElementById('edit-user-id').value,
            nombre: document.getElementById('edit-user-nombre').value.trim(),
            email: document.getElementById('edit-user-email').value.trim(),
            role: document.getElementById('edit-user-role').value,
            password: document.getElementById('edit-user-pass').value || undefined
        };

        const mutation = `mutation($id: ID!, $nombre: String, $email: String, $password: String, $role: String) {
            actualizarUsuario(id: $id, nombre: $nombre, email: $email, password: $password, role: $role) { id }
        }`;

        try {
            const res = await fetch('http://localhost:4000/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: mutation, variables })
            });

            const result = await res.json();
            if (result.data) {
                alert("✅ Usuario actualizado correctamente");
                location.reload();
            } else {
                alert("❌ Error: " + result.errors[0].message);
            }
        } catch (err) { console.error(err); }
    });
});

/**
 * Obtiene todos los usuarios y los renderiza en la tabla
 */
async function cargarUsuarios() {
    const query = `query { 
        obtenerUsuarios { 
            id nombre email role 
        } 
    }`;

    try {
        const res = await fetch('http://localhost:4000/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });
        const { data } = await res.json();
        const body = document.getElementById('tablaUsuariosBody');
        if (!body) return;
        body.innerHTML = '';

        data.obtenerUsuarios.forEach(u => {
            const tr = document.createElement('tr');
            const userData = JSON.stringify(u).replace(/'/g, "&apos;");

            tr.innerHTML = `
                <td class="ps-4 fw-bold">${u.nombre}</td>
                <td>${u.email}</td>
                <td><small class="text-muted">•••••••• (Encriptado)</small></td>
                <td><span class="badge ${u.role === 'ADMIN' ? 'bg-danger' : 'bg-secondary'}">${u.role}</span></td>
                <td class="text-center">
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-secondary" onclick='abrirModalUser(${userData})'>
                            <i class="bi bi-pencil-fill"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="eliminarUsuario('${u.id}', '${u.nombre}')">
                            <i class="bi bi-trash3-fill"></i>
                        </button>
                    </div>
                </td>
            `;
            body.appendChild(tr);
        });
    } catch (err) { console.error(err); }
}

/**
 * Abre el modal y precarga los datos del usuario seleccionado
 */
window.abrirModalUser = (user) => {
    document.getElementById('edit-user-id').value = user.id;
    document.getElementById('edit-user-nombre').value = user.nombre;
    document.getElementById('edit-user-email').value = user.email;
    document.getElementById('edit-user-role').value = user.role;
    document.getElementById('edit-user-pass').value = ''; // Limpiar campo pass por seguridad

    new bootstrap.Modal(document.getElementById('modalEditUsuario')).show();
};

/**
 * Elimina un usuario del sistema (Añade esta Mutation en tu backend si no existe)
 */
window.eliminarUsuario = async (id, nombre) => {
    if (id === localStorage.getItem('userId')) {
        alert("⚠️ No puedes eliminarte a ti mismo desde este panel.");
        return;
    }

    if (!confirm(`¿Estás seguro de eliminar al usuario "${nombre}"? Esta acción no se puede deshacer.`)) return;

    // Aquí podrías crear una mutation específica 'eliminarUsuario' en tu resolver
    // Por ahora, si no la tienes, te doy el esquema:
    const mutation = `mutation($id: ID!) { eliminarUsuario(id: $id) }`;

    try {
        const res = await fetch('http://localhost:4000/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: mutation, variables: { id } })
        });
        const result = await res.json();
        if (result.data) {
            alert("🗑️ Usuario eliminado");
            location.reload();
        }
    } catch (err) { console.error(err); }
};