document.getElementById('registroForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('nombre').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const query = `
        mutation {
            registrarUsuario(nombre: "${nombre}", email: "${email}", password: "${password}", role: "USER") {
                id
                nombre
            }
        }
    `;

    try {
        const response = await fetch('http://localhost:4000/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });
        
        const result = await response.json();

        if (result.errors) {
            alert('Error al registrar: ' + result.errors[0].message);
        } else {
            alert('¡Cuenta creada con éxito! Ya puedes entrar.');
            window.location.href = '../login/login.html';
        }
    } catch (err) {
        alert('Error de conexión con el servidor');
    }
});