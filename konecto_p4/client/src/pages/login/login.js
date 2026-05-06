document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const respuesta = await loginUsuario(email, password);

    if (respuesta.success) {
        sessionStorage.setItem('token', respuesta.data.token);
        sessionStorage.setItem('role', respuesta.data.role);
        // Redirigimos a la carpeta del dashboard
        window.location.href = '../dashboard/dashboard.html';
    } else {
        document.getElementById('errorMsg').innerText = respuesta.error;
    }
});