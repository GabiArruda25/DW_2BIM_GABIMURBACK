window.onload = function () {
  // Verificar se o usuário está logado
  const loggedIn = localStorage.getItem("loggedIn");
  if (loggedIn !== "true") {
    alert("Você precisa estar logado para acessar a página de pagamento.");
    window.location.href = "../login/login.html";
    return;
  }


  
  const totalOriginal = parseFloat(localStorage.getItem("total")) || 0;
  const cupomDigitado = localStorage.getItem("cupom") || "";

  const cuponsValidos = {
    DESCONTO10: 0.10,
    BK2025: 0.15,
    FURIA15: 0.15,
    SUPER5: 0.05
  };

  let desconto = 0;
  if (cuponsValidos[cupomDigitado]) {
    desconto = cuponsValidos[cupomDigitado];
  }

  const valorComDesconto = totalOriginal * (1 - desconto);
  document.getElementById("valorFinal").textContent = `R$ ${valorComDesconto.toFixed(2)}`;
  document.getElementById("valorTotal").textContent = `Total: R$ ${valorComDesconto.toFixed(2)}`;

  localStorage.setItem("valorFinal", valorComDesconto.toFixed(2));
};

// Função responsável por exibir o método de pagamento escolhido (PIX ou Cartão)
function selecionarPagamento(tipo) {
  const pixArea = document.getElementById("pix-area");
  const cartaoArea = document.getElementById("cartao-area");

  if (tipo === "pix") {
    pixArea.style.display = "block";
    cartaoArea.style.display = "none";

    const chavePix = "13885897962"; // CPF
    const nome = "Gabriela Murback";
    const cidade = "SAO PAULO";
    const valor = parseFloat(localStorage.getItem("valorFinal")) || 0;

    const payload = gerarPayloadPix({
      chave: chavePix,
      nome,
      cidade,
      valor
    });

    QRCode.toCanvas(document.getElementById("qrcode"), payload, function (error) {
      if (error) console.error(error);
    });
  } else if (tipo === "cartao") {
    pixArea.style.display = "none";
    cartaoArea.style.display = "block";
  }
}

document.getElementById("voltar-cupom").addEventListener("click", function () {
  window.location.href = "../cupom/cupom.html";
});

// Função responsável por gerar o payload do pagamento via PIX
function gerarPayloadPix({ chave, nome, cidade, valor }) {
  const valorFormatado = valor.toFixed(2);
  const merchantAccountInfo = `0014BR.GOV.BCB.PIX01${chave.length.toString().padStart(2, "0")}${chave}`;
  const merchantInfoLength = merchantAccountInfo.length.toString().padStart(2, "0");

  const payload = [
    "000201",
    `26${merchantInfoLength}${merchantAccountInfo}`,
    "52040000",
    "5303986",
    `54${valorFormatado.length.toString().padStart(2, "0")}${valorFormatado}`,
    "5802BR",
    `59${nome.length.toString().padStart(2, "0")}${nome}`,
    `60${cidade.length.toString().padStart(2, "0")}${cidade}`,
    "62070503***",
    "6304"
  ];

  const payloadCompleto = payload.join("");
  const crc = gerarCRC16(payloadCompleto);
  return payloadCompleto + crc;
}

function gerarCRC16(str) {
  let polinomio = 0x1021;
  let resultado = 0xFFFF;

  for (let i = 0; i < str.length; i++) {
    resultado ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((resultado & 0x8000) !== 0) {
        resultado = (resultado << 1) ^ polinomio;
      } else {
        resultado <<= 1;
      }
      resultado &= 0xFFFF;
    }
  }

  return resultado.toString(16).toUpperCase().padStart(4, "0");
}

// Funções de validação de cartão melhoradas
function validarNumeroCartao(numero) {
  numero = numero.replace(/\s/g, "");
  if (!/^[0-9]{13,19}$/.test(numero)) {
    return false;
  }
  
  let soma = 0;
  let dobrar = false;
  for (let i = numero.length - 1; i >= 0; i--) {
    let digito = parseInt(numero.charAt(i), 10);
    if (dobrar) {
      digito *= 2;
      if (digito > 9) {
        digito -= 9;
      }
    }
    soma += digito;
    dobrar = !dobrar;
  }
  return (soma % 10) === 0;
}

function validarValidadeCartao(validade) {
  if (!/^\d{2}\/\d{2}$/.test(validade)) {
    return false;
  }
  const partes = validade.split("/");
  const mes = parseInt(partes[0], 10);
  const ano = parseInt(partes[1], 10) + 2000;

  const dataAtual = new Date();
  const anoAtual = dataAtual.getFullYear();
  const mesAtual = dataAtual.getMonth() + 1;

  if (mes < 1 || mes > 12) {
    return false;
  }
  if (ano < anoAtual || (ano === anoAtual && mes < mesAtual)) {
    return false;
  }
  return true;
}

function validarCvv(cvv) {
  return /^[0-9]{3,4}$/.test(cvv);
}

function validarNome(nome) {
  return nome.trim().length >= 2 && /^[a-zA-ZÀ-ÿ\s]+$/.test(nome);
}

// Função para adicionar indicador visual de validação
function adicionarIndicadorValidacao(input, isValid) {
  // Remove indicadores existentes
  const existingIndicator = input.parentNode.querySelector('.validation-indicator');
  if (existingIndicator) {
    existingIndicator.remove();
  }

  // Adiciona classes CSS
  input.classList.remove('valid', 'invalid');
  input.classList.add(isValid ? 'valid' : 'invalid');

  // Cria novo indicador
  const indicator = document.createElement('span');
  indicator.className = `validation-indicator ${isValid ? 'valid' : 'invalid'}`;
  input.parentNode.appendChild(indicator);
}

// Formatação automática dos campos
function formatarNumeroCartao(input) {
  let valor = input.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
  let valorFormatado = valor.match(/.{1,4}/g)?.join(' ') || valor;
  input.value = valorFormatado;
}

function formatarValidade(input) {
  let valor = input.value.replace(/\D/g, '');
  if (valor.length >= 2) {
    valor = valor.substring(0, 2) + '/' + valor.substring(2, 4);
  }
  input.value = valor;
}

// Event listeners para validação em tempo real
document.addEventListener("DOMContentLoaded", () => {
  const numeroCartao = document.getElementById("numero-cartao");
  const nomeCartao = document.getElementById("nome-cartao");
  const validadeCartao = document.getElementById("validade-cartao");
  const cvvCartao = document.getElementById("cvv-cartao");
  const formCartao = document.getElementById("form-cartao");
  const submitButton = formCartao?.querySelector('button[type="submit"]');

  if (numeroCartao) {
    numeroCartao.addEventListener('input', function() {
      formatarNumeroCartao(this);
      const isValid = validarNumeroCartao(this.value);
      adicionarIndicadorValidacao(this, isValid);
      verificarFormularioCompleto();
    });
  }

  if (nomeCartao) {
    nomeCartao.addEventListener('input', function() {
      const isValid = validarNome(this.value);
      adicionarIndicadorValidacao(this, isValid);
      verificarFormularioCompleto();
    });
  }

  if (validadeCartao) {
    validadeCartao.addEventListener('input', function() {
      formatarValidade(this);
      const isValid = validarValidadeCartao(this.value);
      adicionarIndicadorValidacao(this, isValid);
      verificarFormularioCompleto();
    });
  }

  if (cvvCartao) {
    cvvCartao.addEventListener('input', function() {
      this.value = this.value.replace(/[^0-9]/g, '');
      const isValid = validarCvv(this.value);
      adicionarIndicadorValidacao(this, isValid);
      verificarFormularioCompleto();
    });
  }

  function verificarFormularioCompleto() {
    if (!submitButton) return;
    
    const numeroValido = validarNumeroCartao(numeroCartao?.value || '');
    const nomeValido = validarNome(nomeCartao?.value || '');
    const validadeValida = validarValidadeCartao(validadeCartao?.value || '');
    const cvvValido = validarCvv(cvvCartao?.value || '');

    const formularioValido = numeroValido && nomeValido && validadeValida && cvvValido;
    
    submitButton.disabled = !formularioValido;
    submitButton.style.opacity = formularioValido ? '1' : '0.6';
  }

  if (formCartao) {
    formCartao.addEventListener("submit", (event) => {
      event.preventDefault();

      const numeroCartaoVal = numeroCartao.value;
      const nomeCartaoVal = nomeCartao.value;
      const validadeCartaoVal = validadeCartao.value;
      const cvvCartaoVal = cvvCartao.value;

      if (!validarNumeroCartao(numeroCartaoVal)) {
        alert("Número do cartão inválido!");
        numeroCartao.focus();
        return;
      }
      if (!validarNome(nomeCartaoVal)) {
        alert("Nome no cartão inválido!");
        nomeCartao.focus();
        return;
      }
      if (!validarValidadeCartao(validadeCartaoVal)) {
        alert("Data de validade inválida! Use o formato MM/AA e uma data futura.");
        validadeCartao.focus();
        return;
      }
      if (!validarCvv(cvvCartaoVal)) {
        alert("CVV inválido! Deve ter 3 ou 4 dígitos.");
        cvvCartao.focus();
        return;
      }

      // Animação de sucesso
      submitButton.innerHTML = "Processando...";
      submitButton.disabled = true;
      
      setTimeout(() => {
        alert("Pagamento com cartão processado com sucesso! 🎉");
        // Aqui você adicionaria a lógica para enviar os dados do cartão para um backend seguro
      }, 1500);
    });
  }
});

