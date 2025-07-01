const API_URL = "http://localhost:3000";



// Verificar se o usuário está logado e é gerente
document.addEventListener("DOMContentLoaded", function() {
  const loggedIn = localStorage.getItem("loggedIn");
  const userEmail = localStorage.getItem("userEmail");
  
  if (loggedIn !== "true" || !userEmail) {
    alert("Você precisa estar logado para acessar esta página.");
    window.location.href = "../login/login.html";
    return;
  }
  
  // Verificar se o usuário é gerente
  verificarSeEhGerente(userEmail);
  
  // Configurar os event listeners e carregar dados
  setupEventListeners();
  carregarProdutos();
  testarConexao();
});

async function verificarSeEhGerente(email) {
  try {
    const response = await fetch(`${API_URL}/usuarios`);
    const usuarios = await response.json();
    const usuario = usuarios.find(u => u[0] === email);
    
    if (!usuario || usuario[2] !== 'gerente') {
      alert("Acesso restrito. Você não tem permissão para acessar esta página.");
      window.location.href = "../principal/principal.html";
    }
  } catch (erro) {
    console.error("Erro ao verificar tipo de usuário:", erro);
    alert("Erro ao verificar suas permissões. Redirecionando para a página principal.");
    window.location.href = "../principal/principal.html";
  }
}

function setupEventListeners() {
  document.getElementById("form-produto")?.addEventListener("submit", handleProdutoSubmit);
  
  document.querySelector("#tabela-produtos tbody")?.addEventListener("click", handleProdutoTableClick);
  
  document.getElementById("promover-btn")?.addEventListener("click", promoverUsuario);
  
  document.getElementById("excluir-usuario-btn")?.addEventListener("click", handleExcluirUsuarioClick);
  
  document.getElementById("adicionar-cupom-btn")?.addEventListener("click", adicionarCupom);
}

async function handleProdutoSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const editId = submitBtn.dataset.editId;

  if (editId) {
    // Modo edição
    const nome = form.nome.value;
    const categoria = form.categoria.value;
    const preco = form.preco.value;
    
    try {
      const resposta = await fetch(`${API_URL}/produtos/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, categoria, preco })
      });

      let resultado;
      try {
        resultado = await resposta.json();
      } catch {
        resultado = { message: "Resposta inválida da API" };
      }

      if (resposta.ok) {
        alert("Produto atualizado com sucesso!");
        cancelarEdicao();
        carregarProdutos();
      } else {
        alert("Erro ao atualizar produto: " + (resultado.message || "Erro desconhecido."));
      }
    } catch (erro) {
      alert("Erro ao enviar os dados: " + erro.message);
    }
  } else {
    // Modo cadastro
    const formData = new FormData(form);

    try {
      const resposta = await fetch(`${API_URL}/produtos`, {
        method: "POST",
        body: formData
      });

      let resultado;
      try {
        resultado = await resposta.json();
      } catch {
        resultado = { message: "Resposta inválida da API" };
      }

      if (resposta.ok) {
        alert("Produto cadastrado com sucesso!");
        form.reset();
        carregarProdutos();
      } else {
        alert("Erro ao cadastrar produto: " + (resultado.message || "Erro desconhecido."));
      }
    } catch (erro) {
      alert("Erro ao enviar os dados: " + erro.message);
    }
  }
}

function showTab(tabId) {
  document.querySelectorAll(".tab-content").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".nav-tab").forEach(el => el.classList.remove("active"));

  document.getElementById(tabId)?.classList.add("active");
  document.querySelector(`.nav-tab[onclick*="${tabId}"]`)?.classList.add("active");
}

function showTabComplete(tabId) {
  showTab(tabId);
  if (tabId === 'produtos') carregarProdutos();
  else if (tabId === 'usuarios') carregarUsuarios();
  else if (tabId === 'cupons') carregarCupons();
}

async function carregarProdutos() {
  try {
    const resposta = await fetch(`${API_URL}/produtos`);
    if (!resposta.ok) throw new Error(`Erro HTTP: ${resposta.status}`);
    const produtos = await resposta.json();

    const tbody = document.querySelector("#tabela-produtos tbody");
    tbody.innerHTML = "";

    produtos.forEach(produto => {
      // Corrigir caminho da imagem
      let imagemSrc = '';
      if (produto.foto) {
        if (produto.foto.startsWith('http') || produto.foto.startsWith('/img/')) {
          imagemSrc = produto.foto;
        } else {
          // Se é apenas o nome do arquivo, adicionar o prefixo /img/
          const nomeArquivo = produto.foto.split('/').pop();
          imagemSrc = `/img/${nomeArquivo}`;
        }
      }
      
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${produto.nome || 'N/A'}</td>
        <td>${produto.categoria || 'N/A'}</td>
        <td>R$ ${parseFloat(produto.preco || 0).toFixed(2)}</td>
        <td>
          ${imagemSrc ? `<img src="${imagemSrc}" alt="${produto.nome}" style="width:60px; height:60px; object-fit:cover; border-radius:10px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block'"/>
          <span style="display:none; color:#999; font-size:12px;">Sem imagem</span>` : '<span style="color:#999; font-size:12px;">Sem imagem</span>'}
        </td>
        <td class="actions">
          <button class="btn-edit" data-id="${produto.id}">Editar</button>
          <button class="btn-delete" data-id="${produto.id}">Excluir</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    document.getElementById("total-produtos").textContent = produtos.length;
    const categoriasUnicas = [...new Set(produtos.map(p => p.categoria).filter(Boolean))];
    document.getElementById("total-categorias").textContent = categoriasUnicas.length;

  } catch (erro) {
    alert("Erro ao carregar produtos: " + erro.message);
  }
}

async function handleProdutoTableClick(e) {
  if (e.target.classList.contains("btn-delete")) {
    const id = e.target.dataset.id;
    if (confirm(`Deseja excluir o produto ID ${id}?`)) {
      try {
        const resposta = await fetch(`${API_URL}/produtos/${id}`, { method: "DELETE" });
        let resultado;
        try {
          resultado = await resposta.json();
        } catch { resultado = { message: "Erro desconhecido" }; }
        alert(resultado.message);
        if (resposta.ok) carregarProdutos();
      } catch (erro) {
        alert("Erro ao excluir: " + erro.message);
      }
    }
  } else if (e.target.classList.contains("btn-edit")) {
    const id = e.target.dataset.id;
    editarProduto(id);
  }
}

// Nova função para editar produto
async function editarProduto(id) {
  try {
    // Buscar dados do produto
    const resposta = await fetch(`${API_URL}/produtos`);
    const produtos = await resposta.json();
    const produto = produtos.find(p => p.id == id);
    
    if (!produto) {
      alert("Produto não encontrado!");
      return;
    }

    // Preencher o formulário com os dados do produto
    const form = document.getElementById("form-produto");
    form.nome.value = produto.nome;
    form.categoria.value = produto.categoria;
    form.preco.value = produto.preco;
    
    // Remover required da imagem para edição
    form.imagem.removeAttribute('required');
    
    // Alterar o botão para "Atualizar"
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.textContent = "Atualizar";
    submitBtn.dataset.editId = id;
    
    // Adicionar botão cancelar
    let cancelBtn = document.getElementById('btn-cancelar-edicao');
    if (!cancelBtn) {
      cancelBtn = document.createElement('button');
      cancelBtn.id = 'btn-cancelar-edicao';
      cancelBtn.type = 'button';
      cancelBtn.textContent = 'Cancelar';
      cancelBtn.style.marginLeft = '10px';
      cancelBtn.onclick = cancelarEdicao;
      submitBtn.parentNode.insertBefore(cancelBtn, submitBtn.nextSibling);
    }
    
  } catch (erro) {
    alert("Erro ao carregar dados do produto: " + erro.message);
  }
}

function cancelarEdicao() {
  const form = document.getElementById("form-produto");
  form.reset();
  form.imagem.setAttribute('required', 'required');
  
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.textContent = "Cadastrar";
  delete submitBtn.dataset.editId;
  
  const cancelBtn = document.getElementById('btn-cancelar-edicao');
  if (cancelBtn) {
    cancelBtn.remove();
  }
}

async function carregarUsuarios() {
  try {
    const resposta = await fetch(`${API_URL}/usuarios`);
    const usuarios = await resposta.json();
    const tbody = document.querySelector("#tabela-usuarios tbody");
    tbody.innerHTML = "";
    usuarios.forEach(usuario => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${usuario[0]}</td>
        <td><span class="user-type ${usuario[2]}">${usuario[2]}</span></td>
        <td><button class="btn-danger" onclick="excluirUsuario('${usuario[0]}')">Excluir</button></td>
      `;
      tbody.appendChild(tr);
    });
    document.getElementById("total-usuarios").textContent = usuarios.length;
    document.getElementById("total-gerentes").textContent = usuarios.filter(u => u[2] === 'gerente').length;
  } catch (erro) {
    console.error("Erro ao carregar usuários:", erro);
  }
}

async function excluirUsuario(email) {
  try {
    const resposta = await fetch(`${API_URL}/usuarios/${encodeURIComponent(email)}`, { method: "DELETE" });
    const resultado = await resposta.json();
    alert(resultado.message);
    carregarUsuarios();
  } catch (erro) {
    alert("Erro ao excluir usuário: " + erro.message);
  }
}

async function promoverUsuario() {
  const email = document.getElementById("email-usuario").value;
  if (!email) return alert("Informe o email do usuário.");
  try {
    const resposta = await fetch(`${API_URL}/usuarios/promover`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const resultado = await resposta.json();
    alert(resultado.message);
    carregarUsuarios();
  } catch {
    alert("Erro ao promover usuário");
  }
}

function handleExcluirUsuarioClick() {
  const email = document.getElementById("email-usuario").value;
  if (!email) return alert("Informe o email do usuário.");
  if (confirm(`Deseja excluir o usuário ${email}?`)) {
    excluirUsuario(email);
  }
}

async function carregarCupons() {
  try {
    const resposta = await fetch(`${API_URL}/cupons`);
    const cupons = await resposta.json();
    const tbody = document.querySelector("#tabela-cupons tbody");
    tbody.innerHTML = "";
    cupons.forEach(cupom => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${cupom[0]}</td>
        <td>${cupom[1]}%</td>
        <td><button class="btn-danger" onclick="excluirCupom('${cupom[0]}')">Excluir</button></td>
      `;
      tbody.appendChild(tr);
    });
    document.getElementById("total-cupons").textContent = cupons.length;
  } catch (erro) {
    console.error("Erro ao carregar cupons:", erro);
  }
}

async function adicionarCupom() {
  const codigo = document.getElementById("codigo-cupom").value;
  const percentual = Number(document.getElementById("percentual-cupom").value);
  if (!codigo || !percentual) return alert("Preencha todos os campos.");

  try {
    const resposta = await fetch(`${API_URL}/cupons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigo, percentual })
    });
    const resultado = await resposta.json();
    alert(resultado.message);
    if (resposta.ok) {
      document.getElementById("codigo-cupom").value = "";
      document.getElementById("percentual-cupom").value = "";
      carregarCupons();
    }
  } catch {
    alert("Erro ao adicionar cupom");
  }
}

async function excluirCupom(codigo) {
  if (!confirm(`Deseja excluir o cupom ${codigo}?`)) return;
  try {
    const resposta = await fetch(`${API_URL}/cupons/${encodeURIComponent(codigo)}`, { method: "DELETE" });
    const resultado = await resposta.json();
    alert(resultado.message);
    carregarCupons();
  } catch {
    alert("Erro ao excluir cupom");
  }
}

async function testarConexao() {
  try {
    const resposta = await fetch(`${API_URL}/produtos`);
    if (!resposta.ok) throw new Error("Falha na conexão com a API");
    console.log("API online");
  } catch (erro) {
    console.error("Erro de conexão:", erro);
  }
}

