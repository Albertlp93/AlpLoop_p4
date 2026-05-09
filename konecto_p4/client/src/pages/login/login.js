document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // IMPORTANTE: Pedimos el ID para poder consultar el perfil luego
    const query = `
        query {
            loginUsuario(email: "${email}", password: "${password}") {
                id
                nombre
                role
            }
        }
    `;

    try {
        const response = await fetch('http://localhost:4000/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });
        
        const { data, errors } = await response.json();

        if (errors) {
            alert('Error: ' + errors[0].message);
        } else if (data.loginUsuario) {
            // Guardamos la sesión con el ID único del usuario
            localStorage.setItem('userId', data.loginUsuario.id);
            localStorage.setItem('userName', data.loginUsuario.nombre);
            localStorage.setItem('userRole', data.loginUsuario.role);
            
            alert('¡Bienvenido, ' + data.loginUsuario.nombre + '!');
            window.location.href = '../dashboard/dashboard.html';
        }
    } catch (err) {
        console.error("Error en login:", err);
        alert('No se pudo conectar con el servidor');
    }
});