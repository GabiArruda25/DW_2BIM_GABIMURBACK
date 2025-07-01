const cuponsValidos = {
  DESCONTO10: 0.10,
  BK2025: 0.15,
  FURIA15: 0.15,
  SUPER5: 0.05
};

function verificarCupom() {
  const input = document.getElementById('inputCupom').value.toUpperCase();
  const mensagem = document.getElementById('mensagem');

  if (cuponsValidos[input]) {
    const desconto = cuponsValidos[input] * 100;
    mensagem.textContent = `Cupom válido! Você ganhou ${desconto}% de desconto! 🎉`;
    mensagem.style.color = 'green';

    // SALVAR CUPOM NO LOCAL STORAGE AQUI!
    localStorage.setItem('cupom', input);
  } else {
    mensagem.textContent = 'Cupom inválido. 😞';
    mensagem.style.color = 'red';
    localStorage.removeItem('cupom'); // Se cupom inválido, remove cupom salvo
  }
}


function voltar() {
  window.location.href = '../principal/principal.html';
}

function pagar() {
  window.location.href = '../pagamento/pagamento.html';
}
