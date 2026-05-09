/**
 * @file dashboard.js
 * @description Gestión de Dashboard: Actividad, Drag & Drop y Modal Informativo.
 */

document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    const userRole = localStorage.getItem('userRole');
    const userEmail = localStorage.getItem('userEmail');
    
    if (!userId || !userEmail) {
        localStorage.clear();
        window.location.href = '../login/login.html';
        return;
    }

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
    document.getElementById('welcome-name').textContent = userName;
    document.getElementById('user-role-display').textContent = userRole;

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = (e) => {
            e.preventDefault();
            localStorage.clear();
            window.location.href = '../login/login.html';
        };
    }

    fetchDashboardData(userEmail);
});

// --- FUNCIONES DRAG & DROP ---
window.allowDrop = (ev) => ev.preventDefault();
window.drag = (ev) => ev.dataTransfer.setData("text", ev.target.id);
window.drop = (ev) => {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");
    const element = document.getElementById(data);
    let target = ev.target;
    while (target && !target.classList.contains('drag-zone')) { target = target.parentElement; }
    if (target) {
        target.appendChild(element);
        saveDragState();
    }
}

function saveDragState() {
    const ids = Array.from(document.querySelectorAll('#mis-intereses .card-item')).map(el => el.id);
    localStorage.setItem('intereses_ids', JSON.stringify(ids));
}

// --- FUNCIÓN PARA MOSTRAR DETALLE (POPUP) ---
window.verDetalle = (pub) => {
    document.getElementById('detalle-tipo').textContent = pub.tipo;
    document.getElementById('detalle-titulo').textContent = pub.titulo;
    document.getElementById('detalle-descripcion').textContent = pub.descripcion;
    document.getElementById('detalle-jornada').textContent = pub.jornada || 'Jornada no definida';
    document.getElementById('detalle-email').textContent = pub.email;

    const badgeSueldo = document.getElementById('detalle-sueldo');
    if (pub.tipo === 'OFERTA' && pub.sueldo > 0) {
        badgeSueldo.textContent = `${pub.sueldo} €/año`;
        badgeSueldo.classList.remove('d-none');
    } else {
        badgeSueldo.classList.add('d-none');
    }

    const modal = new bootstrap.Modal(document.getElementById('modalDetalle'));
    modal.show();
};

// --- CARGA DE DATOS ---
async function fetchDashboardData(userEmail) {
    const query = { 
        query: `query { 
            obtenerVoluntariados { id titulo tipo descripcion email jornada sueldo } 
        }` 
    };

    try {
        const response = await fetch('http://localhost:4000/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });

        const { data } = await response.json();
        if (!data) return;

        const allVols = data.obtenerVoluntariados;
        const interesesGuardados = JSON.parse(localStorage.getItem('intereses_ids')) || [];

        // 1. Bloque 1: Actividad Personal
        const miActividadCont = document.getElementById('dashboard-list');
        const misPublicaciones = allVols.filter(v => v.email === userEmail);
        document.getElementById('count-propias').textContent = misPublicaciones.length;
        
        miActividadCont.innerHTML = '';
        misPublicaciones.forEach(v => {
            const div = document.createElement('div');
            div.className = 'card-item shadow-sm';
            div.style.cursor = 'pointer';
            div.onclick = () => window.verDetalle(v); // Al pinchar abre popup
            div.innerHTML = `
                <small class="fw-bold" style="color:var(--rosa-fosfo); text-transform: uppercase;">${v.tipo}</small>
                <h5 class="mt-1 mb-1" style="font-weight: 700;">${v.titulo}</h5>
                <p class="small text-muted mb-0">${v.descripcion.substring(0, 40)}...</p>
            `;
            miActividadCont.appendChild(div);
        });

        // 2. Bloque 2: Drag & Drop
        const colOfertas = document.getElementById('ofertas-disponibles');
        const colIntereses = document.getElementById('mis-intereses');
        colOfertas.innerHTML = '';
        colIntereses.innerHTML = '';

        allVols.filter(v => v.tipo === 'OFERTA').forEach(v => {
            const cardId = `drag-card-${v.id}`;
            const div = document.createElement('div');
            div.className = 'card-item draggable shadow-sm';
            div.id = cardId;
            div.draggable = true;
            div.ondragstart = window.drag;
            // Doble clic para ver detalle en marketplace si se desea (opcional)
            div.ondblclick = () => window.verDetalle(v);
            
            div.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <h6 class="mb-0 fw-bold">${v.titulo}</h6>
                    <span class="badge bg-light text-dark border" style="font-size:0.6rem">${v.jornada || 'N/A'}</span>
                </div>
                <small class="text-muted d-block mt-1" style="font-size: 0.7rem;">${v.email}</small>
            `;

            if (interesesGuardados.includes(cardId)) {
                colIntereses.appendChild(div);
            } else {
                colOfertas.appendChild(div);
            }
        });

    } catch (err) {
        console.error("Error cargando dashboard:", err);
    }
}