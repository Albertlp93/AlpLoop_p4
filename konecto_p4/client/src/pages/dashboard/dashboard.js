document.addEventListener('DOMContentLoaded', () => {
    // 1. CONTROL DE SESIÓN
    const nombre = localStorage.getItem('userName');
    const rol = localStorage.getItem('userRole');

    if (!nombre) {
        // Si no hay datos, fuera al login
        window.location.href = '../login/login.html';
        return;
    }

    // 2. ACTUALIZAR TEXTOS
    document.getElementById('user-display').textContent = nombre;
    document.getElementById('welcome-name').textContent = nombre;
    document.getElementById('role-badge').textContent = rol;
    document.getElementById('user-role-display').textContent = rol;

    // 3. MENU DINÁMICO PARA ADMIN
    const navMenu = document.getElementById('nav-menu');
    if (rol === 'ADMIN') {
        const adminLi = document.createElement('li');
        adminLi.innerHTML = `<a href="../admin/admin.html" class="nav-admin">🛡️ Admin</a>`;
        navMenu.appendChild(adminLi);
        document.getElementById('welcome-text').textContent = "Modo Administrador: Control total de la plataforma activado.";
    }

    // 4. CARGAR DATOS REALES (GraphQL)
    fetchData();

    // 5. CERRAR SESIÓN
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = '../login/login.html';
    });
});

/**
 * Consulta a MongoDB vía GraphQL para traer los voluntariados
 */
async function fetchData() {
    const query = `
        query {
            obtenerVoluntariados {
                titulo
                tipo
                descripcion
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
        const container = document.getElementById('voluntariados-list');
        const countText = document.getElementById('count-voluntariados');

        if (data && data.obtenerVoluntariados) {
            const items = data.obtenerVoluntariados;
            countText.textContent = items.length;

            if (items.length > 0) {
                container.innerHTML = ''; // Limpiar mensaje de carga
                
                // Mostramos solo los 2 últimos en el Dashboard para no saturar
                items.slice(0, 2).forEach(item => {
                    const card = document.createElement('div');
                    card.className = 'vol-card';
                    card.innerHTML = `
                        <small style="color: var(--rosa-fosfo); font-weight: 800;">${item.tipo.toUpperCase()}</small>
                        <h4 style="margin: 10px 0 5px 0; font-size: 1.2rem;">${item.titulo}</h4>
                        <p style="font-size: 0.9rem; color: #555; line-height: 1.5;">${item.descripcion.substring(0, 100)}...</p>
                        <div style="margin-top: 15px; font-size: 0.8rem; font-weight: 600;">📩 ${item.email}</div>
                    `;
                    container.appendChild(card);
                });
            } else {
                container.innerHTML = '<p>No hay actividad reciente para mostrar.</p>';
            }
        }
    } catch (err) {
        console.error("Error cargando el Dashboard:", err);
        document.getElementById('voluntariados-list').innerHTML = '<p>Error de conexión con el servidor.</p>';
    }
}