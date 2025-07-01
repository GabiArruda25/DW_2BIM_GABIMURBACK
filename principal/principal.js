// === REMOVIDO: produtosPorCategoria (conteúdo hardcoded) ===

// === MANTIDO: Variáveis e funções que já funcionavam corretamente ===
let carrinho = [];

// Mapeamento de categorias para corresponder ao CSV
const mapeamentoCategoria = {
    'lanches': 'Lanche',
    'snacks': 'Snacks',
    'bebidas': 'Bebida', 
    'sorvetes': 'Sorvetes'
};

const API_BASE_URL = 'http://localhost:3000';



async function mostrarCategoria(categoria) {
    try {
        const response = await fetch(`${API_BASE_URL}/produtos`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const produtos = await response.json();
        
        // Mapear a categoria solicitada para a categoria do CSV
        const categoriaCSV = mapeamentoCategoria[categoria] || categoria;
        
        const produtosFiltrados = produtos.filter(p => p.categoria === categoriaCSV);
        const container = document.getElementById("produtos-container");
        container.innerHTML = "";

        if (produtosFiltrados.length === 0) {
            container.innerHTML = `<p>Nenhum produto encontrado para a categoria: ${categoria}</p>`;
            return;
        }

        produtosFiltrados.forEach(produto => {
            const card = document.createElement("div");
            card.className = "card-produto";
            card.innerHTML = `
                <img src="${corrigirCaminhoImagem(produto.foto)}" alt="${produto.nome}" onerror="this.style.display=\'none\'">
                <h3>${produto.nome}</h3>
                <p>R$ ${parseFloat(produto.preco).toFixed(2)}</p>
                <div class="quantidade">
                    <button onclick="alterarQuantidade(\'${produto.id}\', -1)">-</button>
                    <span id="quantidade-${produto.id}">0</span>
                    <button onclick="alterarQuantidade(\'${produto.id}\', 1)">+</button>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (erro) {
        console.error("Erro ao buscar produtos:", erro);
        const container = document.getElementById("produtos-container");
        container.innerHTML = `<p>Erro ao carregar produtos. Verifique a conexão com o servidor.</p>`;
    }
}

function corrigirCaminhoImagem(caminho) {
    if (!caminho) return '';
    
    // Se já é um caminho completo, usar como está
    if (caminho.startsWith('http') || caminho.startsWith('/img/')) {
        return caminho;
    }
    
    // Se é apenas o nome do arquivo, adicionar o prefixo /img/
    const nomeArquivo = caminho.split('/').pop();
    return `/img/${nomeArquivo}`;
}

function alterarQuantidade(id, delta) {
    const index = carrinho.findIndex(item => item.id === id);

    if (index !== -1) {
        carrinho[index].quantidade += delta;
        if (carrinho[index].quantidade <= 0) {
            carrinho.splice(index, 1);
        }
    } else if (delta > 0) {
        carrinho.push({ id: id, quantidade: delta });
    }

    const quantidade = carrinho.find(item => item.id === id)?.quantidade || 0;
    const elementoQuantidade = document.getElementById(`quantidade-${id}`);
    if (elementoQuantidade) {
        elementoQuantidade.textContent = quantidade;
    }
    
    atualizarCarrinho();
}

// Função para atualizar o carrinho na interface
async function atualizarCarrinho() {
    try {
        const response = await fetch(`${API_BASE_URL}/produtos`);
        const produtos = await response.json();
        
        const listaCarrinho = document.getElementById('lista-carrinho');
        const totalElement = document.getElementById('total');
        
        if (!listaCarrinho || !totalElement) return;
        
        listaCarrinho.innerHTML = '';
        let total = 0;
        
        carrinho.forEach(item => {
            const produto = produtos.find(p => p.id == item.id);
            if (produto) {
                const subtotal = produto.preco * item.quantidade;
                total += subtotal;
                
                const itemDiv = document.createElement('div');
                itemDiv.className = 'item-carrinho';
                itemDiv.innerHTML = `
                    <span>${produto.nome}</span>
                    <span>Qtd: ${item.quantidade}</span>
                    <span>R$ ${subtotal.toFixed(2)}</span>
                `;
                listaCarrinho.appendChild(itemDiv);
            }
        });
        
        totalElement.textContent = total.toFixed(2);
        localStorage.setItem("total", total.toFixed(2));

    } catch (erro) {
        console.error("Erro ao atualizar carrinho:", erro);
    }
}

// === MODIFICADO: window.onload para exibir apenas lanches inicialmente ===
window.onload = () => {
    mostrarCategoria("lanches");
    atualizarStatusLogin();
};

function atualizarStatusLogin() {
    const userEmailSpan = document.getElementById("user-email");
    const loginBtn = document.getElementById("login-btn");
    const logoutBtn = document.getElementById("logout-btn");
    const userInfo = document.getElementById("user-info");
    const loggedInUser = localStorage.getItem("userEmail");
    const isLoggedIn = localStorage.getItem("loggedIn");

    // Verificar se ainda está logado
    if (loggedInUser && isLoggedIn === "true") {
        userEmailSpan.textContent = loggedInUser;
        loginBtn.style.display = "none";
        userInfo.style.display = "flex";
        logoutBtn.style.display = "block";
        
        // Verificar se é gerente e adicionar aba de CRUD
        verificarSeEhGerente(loggedInUser);
    } else {
        userEmailSpan.textContent = "";
        loginBtn.style.display = "block";
        userInfo.style.display = "none";
        logoutBtn.style.display = "none";
        // Remover aba de CRUD se existir
        const crudTab = document.getElementById("crud-tab");
        if (crudTab) {
            crudTab.remove();
        }
    }
}

async function verificarSeEhGerente(email) {
    try {
        const response = await fetch(`${API_BASE_URL}/usuarios`);
        const usuarios = await response.json();
        const usuario = usuarios.find(u => u[0] === email);
        
        if (usuario && usuario[2] === 'gerente') {
            adicionarAbaCRUD();
        }
    } catch (erro) {
        console.error("Erro ao verificar tipo de usuário:", erro);
    }
}

function adicionarAbaCRUD() {
    // Verificar se a aba já existe
    if (document.getElementById("crud-tab")) {
        return;
    }
    
    // Criar botão de CRUD
    const crudBtn = document.createElement("button");
    crudBtn.id = "crud-tab";
    crudBtn.textContent = "Gerenciamento";
    crudBtn.style.cssText = `
        padding: 10px 20px;
        background: linear-gradient(45deg, #28a745, #20c997);
        color: white;
        border: none;
        border-radius: 25px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        margin-left: 10px;
    `;
    
    crudBtn.addEventListener('mouseover', function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 5px 15px rgba(40, 167, 69, 0.4)';
    });
    
    crudBtn.addEventListener('mouseout', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = 'none';
    });
    
    crudBtn.onclick = () => {
        window.location.href = '../gerente/gerente.html';
    };
    
    // Adicionar ao menu superior
    const userInfo = document.getElementById("user-info");
    if (userInfo) {
        userInfo.appendChild(crudBtn);
    }
}

function logout() {
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("userEmail");
    location.reload();
}

// Função para ir para a página de cupom (permitir que gerente também faça compras)
function irParaCupom() {
    if (carrinho.length === 0) {
        alert("Adicione itens ao carrinho antes de prosseguir!");
        return;
    }
    
    // Verificar se o usuário está logado
    if (localStorage.getItem("loggedIn") !== "true") {
        alert("Você precisa estar logado para continuar com a compra.");
        window.location.href = "../login/login.html";
        return;
    }
    
    // Salvar carrinho no localStorage para manter entre páginas
    localStorage.setItem("carrinho", JSON.stringify(carrinho));
    window.location.href = "../cupom/cupom.html";
}

