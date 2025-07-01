function cadastrar() {
    const nome = document.getElementById("nome").value;
    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;
    const confirmar = document.getElementById("confirmar").value;
    const tipoUsuario = 'usuario';

    if (senha !== confirmar) {
        alert("As senhas não coincidem!");
        return;
    }

    // Validação de senha forte
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+}{[\]|:;"'<,>.?/]).{8,}$/;
    if (!strongPasswordRegex.test(senha)) {
        alert("A senha deve conter pelo menos 8 caracteres, incluindo uma letra maiúscula, uma letra minúscula, um número e um caractere especial.");
        return;
    }

    fetch("http://localhost:3000/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha, tipo: tipoUsuario })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        if (data.message === "Usuário cadastrado com sucesso!") {
            if (tipoUsuario === "gerente") {
                window.location.href = "../gerente/gerente.html";
            } else {
                window.location.href = "../login/login.html";
            }
        }
    })
    .catch(error => {
        console.error("Erro no cadastro:", error);
        alert("Erro ao cadastrar usuário.");
    });
}




