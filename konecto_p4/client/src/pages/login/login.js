/**
 * @file login.js
 * @description Gestión de acceso y creación de sesión en localStorage.
 */

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const query = {
        query: `
            query ($email: String!, $password: String!) {
                loginUsuario(email: $email, password: $password) {
                    id
                    nombre
                    email
                    role
                }
            }
        `,
        variables: { email, password }
    };

    try {
        const response = await fetch('http://localhost:4000/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });

        const { data, errors } = await response.json();

        if (errors) {
            alert("Error: " + errors[0].message);
        } else if (data.loginUsuario) {
            const user = data.loginUsuario;
            
            // --- PERSISTENCIA DE SESIÓN ---
            localStorage.setItem('userId', user.id);
            localStorage.setItem('userName', user.nombre);
            localStorage.setItem('userEmail', user.email); // Clave principal
            localStorage.setItem('userRole', user.role);

            window.location.href = '../dashboard/dashboard.html';
        }
    } catch (err) {
        console.error("Error de conexión:", err);
        alert("No se pudo conectar con el servidor.");
    }
});