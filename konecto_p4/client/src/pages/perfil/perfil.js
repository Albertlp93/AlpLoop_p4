document.addEventListener('DOMContentLoaded', async () => {
    const userId = localStorage.getItem('userId');
    const nombreLocal = localStorage.getItem('userName');
    const rolLocal = localStorage.getItem('userRole');

    // 1. Verificación de sesión
    if (!userId) {
        window.location.href = '../login/login.html';
        return;
    }

    // 2. Carga estética inicial
    document.getElementById('user-display').textContent = nombreLocal;
    document.getElementById('perfil-rol').textContent = rolLocal;
    document.getElementById('avatar-initials').textContent = nombreLocal.charAt(0).toUpperCase();

    // 3. Carga de datos reales desde el Servidor (Opción B)
    await cargarDatosServidor(userId);

    // --- LÓGICA DE INTERFAZ ---
    const btnEdit = document.getElementById('btn-edit');
    const btnSave = document.getElementById('btn-save');
    const btnCancel = document.getElementById('btn-cancel');
    const inputs = document.querySelectorAll('#perfilForm input');

    // Activar modo edición
    btnEdit.addEventListener('click', () => {
        inputs.forEach(input => input.disabled = false);
        btnEdit.style.display = 'none';
        btnSave.style.display = 'inline-block';
        btnCancel.style.display = 'inline-block';
    });

    // Cancelar: Recarga la página para deshacer cambios visuales
    btnCancel.addEventListener('click', () => location.reload());

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = '../login/login.html';
    });

    // 4. ENVÍO DEL FORMULARIO (Mutation Guardar)
    document.getElementById('perfilForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const nombre = document.getElementById('edit-nombre').value;
        const email = document.getElementById('edit-email').value;
        const password = document.getElementById('edit-password').value;
        const confirm = document.getElementById('edit-password-confirm').value;

        // Validación de coincidencia de password si el usuario escribió algo
        if (password && password !== confirm) {
            alert("Las contraseñas no coinciden");
            return;
        }

        // Construcción dinámica de la Mutation
        // Solo incluimos el campo password si no está vacío
        const mutation = `
            mutation {
                actualizarUsuario(
                    id: "${userId}", 
                    nombre: "${nombre}", 
                    email: "${email}"
                    ${password ? `, password: "${password}"` : ""}
                ) {
                    id
                    nombre
                    email
                }
            }
        `;

        try {
            const response = await fetch('http://localhost:4000/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: mutation })
            });

            const { data, errors } = await response.json();

            if (errors) {
                alert('Error al guardar: ' + errors[0].message);
            } else if (data.actualizarUsuario) {
                alert('¡Perfil actualizado con éxito!');
                // Actualizamos el localStorage por si cambió el nombre
                localStorage.setItem('userName', data.actualizarUsuario.nombre);
                location.reload(); // Volver al modo lectura
            }
        } catch (err) {
            console.error(err);
            alert('Error crítico de conexión');
        }
    });
});

async function cargarDatosServidor(id) {
    const query = `
        query {
            obtenerUsuarioPorId(id: "${id}") {
                nombre
                email
            }
        }
    `;

    try {
        const response = await fetch('http://localhost:4000/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });

        const { data } = await response.json();

        if (data && data.obtenerUsuarioPorId) {
            const user = data.obtenerUsuarioPorId;
            document.getElementById('edit-nombre').value = user.nombre;
            document.getElementById('edit-email').value = user.email;
            document.getElementById('perfil-nombre-titulo').textContent = user.nombre;
        }
    } catch (err) {
        console.error("No se pudieron cargar los datos del servidor", err);
    }
}