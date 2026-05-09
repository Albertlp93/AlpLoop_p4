/**
 * @file perfil.js
 * @description Gestión del perfil de usuario, validaciones y sincronización de sesión.
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Recuperar datos de sesión (centralizado)
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    const userName = localStorage.getItem('userName');
    const userEmail = localStorage.getItem('userEmail');

    // 2. Verificación de Seguridad
    if (!userId || !userEmail) {
        localStorage.clear();
        window.location.href = '../login/login.html';
        return;
    }

    // 3. Sincronizar Header (Navbar) y Elementos de la Tarjeta
    // Aseguramos que los IDs coincidan con el estilo unificado de la Navbar
    const userDisplay = document.getElementById('user-display');
    const roleBadge = document.getElementById('role-badge');
    
    if (userDisplay) userDisplay.textContent = userName;
    if (roleBadge) roleBadge.textContent = userRole;

    // Sincronizar datos específicos de la tarjeta de perfil
    const perfilRol = document.getElementById('perfil-rol');
    const avatarInitials = document.getElementById('avatar-initials');
    
    if (perfilRol) perfilRol.textContent = userRole;
    if (avatarInitials) avatarInitials.textContent = userName.charAt(0).toUpperCase();

    // 4. Botón Salir Unificado
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = (e) => {
            e.preventDefault();
            localStorage.clear();
            window.location.href = '../login/login.html';
        };
    }

    // 5. Cargar datos actuales del servidor
    await cargarDatosPerfil(userId);

    // 6. Lógica de Interfaz (Modo Edición / Cancelar)
    const btnEdit = document.getElementById('btn-edit');
    const btnSave = document.getElementById('btn-save');
    const btnCancel = document.getElementById('btn-cancel');
    const inputs = document.querySelectorAll('#perfilForm input');

    if (btnEdit) {
        btnEdit.onclick = () => {
            // Habilitar inputs para edición
            inputs.forEach(input => input.disabled = false);
            btnEdit.style.display = 'none';
            if (btnSave) btnSave.style.display = 'inline-block';
            if (btnCancel) btnCancel.style.display = 'inline-block';
        };
    }

    if (btnCancel) {
        btnCancel.onclick = () => {
            location.reload(); // Revierte cambios visuales cargando de nuevo el estado guardado
        };
    }

    // 7. Guardar Cambios con Validaciones Blindadas
    const perfilForm = document.getElementById('perfilForm');
    if (perfilForm) {
        perfilForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nombre = document.getElementById('edit-nombre').value.trim();
            const email = document.getElementById('edit-email').value.trim();
            const pass = document.getElementById('edit-password').value;
            const confirmPass = document.getElementById('edit-password-confirm').value;

            // Validaciones de negocio obligatorias
            if (!nombre || !email) {
                alert("⚠️ El nombre y el email son obligatorios.");
                return;
            }

            // Validación de coincidencia de contraseñas
            if (pass && pass !== confirmPass) {
                alert("⚠️ Las contraseñas no coinciden.");
                return;
            }

            const mutation = {
                query: `mutation($id: ID!, $nombre: String, $email: String, $password: String) {
                    actualizarUsuario(id: $id, nombre: $nombre, email: $email, password: $password) {
                        id
                        nombre
                        email
                    }
                }`,
                variables: { 
                    id: userId, 
                    nombre: nombre, 
                    email: email, 
                    password: pass || undefined 
                }
            };

            try {
                const res = await fetch('http://localhost:4000/graphql', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(mutation)
                });
                
                const result = await res.json();
                
                if (result.errors) {
                    alert("Error: " + result.errors[0].message);
                    return;
                }

                if (result.data && result.data.actualizarUsuario) {
                    // ACTUALIZACIÓN CRÍTICA: Sincronizar localStorage con los nuevos datos
                    localStorage.setItem('userName', result.data.actualizarUsuario.nombre);
                    localStorage.setItem('userEmail', result.data.actualizarUsuario.email);
                    
                    alert("✅ Perfil actualizado correctamente");
                    location.reload(); // Recarga para refrescar todos los elementos del Header
                }
            } catch (err) { 
                console.error("Error al actualizar perfil:", err);
                alert("No se pudo conectar con el servidor.");
            }
        });
    }
});

/**
 * Consulta los datos actuales del usuario para rellenar el formulario
 */
async function cargarDatosPerfil(id) {
    const query = {
        query: `query($id: ID!) { 
            obtenerUsuarioPorId(id: $id) { 
                nombre 
                email 
            } 
        }`,
        variables: { id }
    };
    
    try {
        const res = await fetch('http://localhost:4000/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });
        
        const { data } = await res.json();
        
        if (data && data.obtenerUsuarioPorId) {
            const inputNombre = document.getElementById('edit-nombre');
            const inputEmail = document.getElementById('edit-email');
            const tituloNombre = document.getElementById('perfil-nombre-titulo');

            if (inputNombre) inputNombre.value = data.obtenerUsuarioPorId.nombre;
            if (inputEmail) inputEmail.value = data.obtenerUsuarioPorId.email;
            if (tituloNombre) tituloNombre.textContent = data.obtenerUsuarioPorId.nombre;
        }
    } catch (err) { 
        console.error("Error cargando datos de perfil:", err);
    }
}