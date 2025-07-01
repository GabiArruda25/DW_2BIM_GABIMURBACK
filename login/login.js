function entrar() {
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
    })
    .then(res => {
        if (res.status === 401) {
            alert('Email ou senha inválidos. Redirecionando para o cadastro.');
            window.location.href = '../cadastro/cadastro.html';
            return Promise.reject('Usuário não encontrado');
        }
        return res.json();
    })
    .then(data => {
        if (data.tipo === 'gerente') {
            localStorage.setItem('loggedIn', 'true');
            localStorage.setItem('userEmail', email);
            window.location.href = '../gerente/gerente.html';
        } else {
            localStorage.setItem('loggedIn', 'true');
            localStorage.setItem('userEmail', email);
            window.location.href = '../principal/principal.html'; // Assumindo que 'menu.html' é 'principal.html'
        }
    })
    .catch(error => {
        console.error('Erro no login:', error);
    });
}

function esqueceuSenha() {
    const email = prompt("Digite seu email para recuperar a senha:");
    if (!email) return;

    fetch("http://localhost:3000/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        if (data.message.includes("Token de recuperação enviado")) {
            const token = prompt("Digite o token de recuperação que você recebeu:");
            const newPassword = prompt("Digite sua nova senha:");
            if (!token || !newPassword) return;

            fetch("http://localhost:3000/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, token, newPassword })
            })
            .then(res => res.json())
            .then(data => {
                alert(data.message);
            })
            .catch(error => {
                console.error("Erro ao redefinir senha:", error);
                alert("Erro ao redefinir senha.");
            });
        }
    })
    .catch(error => {
        console.error("Erro ao solicitar recuperação de senha:", error);
        alert("Erro ao solicitar recuperação de senha.");
    });
}



document.getElementById('btn-voltar-inicio').addEventListener('click', () => {
    window.location.href = "../principal/principal.html";
});

