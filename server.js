
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const PORT = 3000;

const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
app.use('/gerente', express.static('gerente'));


// Configuração do armazenamento de imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "img");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({ storage });

app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));
app.use("/img", express.static(path.join(__dirname, "img")));

// Servir arquivos estáticos de todas as pastas
app.use('/login', express.static(path.join(__dirname, 'login')));
app.use('/cadastro', express.static(path.join(__dirname, 'cadastro')));
app.use('/gerente', express.static(path.join(__dirname, 'gerente')));
app.use('/cupom', express.static(path.join(__dirname, 'cupom')));
app.use('/pagamento', express.static(path.join(__dirname, 'pagamento')));

// Servir arquivos estáticos da pasta 'principal'
app.use(express.static(path.join(__dirname, "principal")));

// Rota para servir a página principal no caminho raiz
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "principal", "principal.html"));
});

// Caminhos dos CSVs
const usuariosPath = path.join(__dirname, "usuarios.csv");
const produtosPath = path.join(__dirname, "produtos.csv");
const cuponsPath = path.join(__dirname, "cupons.csv");

function salvarCSV(pathFile, dados) {
  const linhas = dados.map((linha) => {
    // Escapar campos que contêm vírgulas colocando entre aspas
    return linha
      .map((campo) => {
        const campoStr = String(campo || "");
        if (
          campoStr.includes(",") ||
          campoStr.includes("\"") ||
          campoStr.includes("\n")
        ) {
          return `\"${campoStr.replace(/\"/g, "\"\"")}\"`;
        }
        return campoStr;
      })
      .join(",");
  });
  fs.writeFileSync(pathFile, linhas.join("\n"), "utf-8");
}

function lerCSV(pathFile) {
  if (!fs.existsSync(pathFile)) {
    // Criar arquivo com header se não existir
    if (pathFile.includes("produtos.csv")) {
      fs.writeFileSync(pathFile, "id,nome,preco,categoria,foto\n", "utf-8");
    }
    return [];
  }

  const dados = fs.readFileSync(pathFile, "utf-8");
  const linhas = dados.split("\n").filter((line) => line.trim() !== "");

  return linhas.map((linha) => {
    const campos = [];
    let campo = "";
    let dentroAspas = false;

    for (let i = 0; i < linha.length; i++) {
      const char = linha[i];

      if (char === "\"" && !dentroAspas) {
        dentroAspas = true;
      } else if (char === "\"" && dentroAspas) {
        if (linha[i + 1] === "\"") {
          campo += "\"";
          i++; // Pular próxima aspa
        } else {
          dentroAspas = false;
        }
      } else if (char === "," && !dentroAspas) {
        campos.push(campo);
        campo = "";
      } else {
        campo += char;
      }
    }
    campos.push(campo); // Último campo

    return campos;
  });
}

// === USUÁRIOS ===
app.get("/usuarios", (req, res) => {
  const usuarios = lerCSV(usuariosPath);
  res.json(usuarios);
});

app.post("/usuarios", (req, res) => {
  const { email, senha, tipo = "usuario" } = req.body;
  const usuarios = lerCSV(usuariosPath);
  if (usuarios.find((u) => u[0] === email)) {
    return res.status(400).json({ message: "Email já cadastrado." });
  }
  usuarios.push([email, senha, tipo]);
  salvarCSV(usuariosPath, usuarios);
  res.json({ message: "Usuário cadastrado com sucesso!" });
});

app.post("/login", (req, res) => {
  const { email, senha } = req.body;
  const usuarios = lerCSV(usuariosPath);
  const usuario = usuarios.find((u) => u[0] === email && u[1] === senha);
  if (!usuario) {
    return res.status(401).json({ message: "Email ou senha inválidos." });
  }
  res.json({ message: "Login bem-sucedido.", tipo: usuario[2] });
});

app.post("/usuarios/promover", (req, res) => {
  const { email } = req.body;
  let usuarios = lerCSV(usuariosPath);
  let atualizado = false;
  usuarios = usuarios.map((u) => {
    if (u[0] === email) {
      u[2] = "gerente";
      atualizado = true;
    }
    return u;
  });
  salvarCSV(usuariosPath, usuarios);
  res.json({
    message: atualizado ? "Usuário promovido a gerente!" : "Usuário não encontrado.",
  });
});

app.delete("/usuarios/:email", (req, res) => {
  const email = decodeURIComponent(req.params.email);
  let usuarios = lerCSV(usuariosPath);
  const antes = usuarios.length;
  usuarios = usuarios.filter((u) => u[0] !== email);
  salvarCSV(usuariosPath, usuarios);
  res.json({
    message: antes === usuarios.length ? "Usuário não encontrado." : "Usuário excluído com sucesso!",
  });
});

// === CUPONS ===
app.get("/cupons", (req, res) => {
  const cupons = lerCSV(cuponsPath);
  res.json(cupons);
});

app.post("/cupons", (req, res) => {
  const { codigo, percentual } = req.body;
  const cupons = lerCSV(cuponsPath);
  if (cupons.find((c) => c[0] === codigo)) {
    return res.status(400).json({ message: "Cupom já existente." });
  }
  cupons.push([codigo, percentual]);
  salvarCSV(cuponsPath, cupons);
  res.json({ message: "Cupom adicionado com sucesso!" });
});

app.delete("/cupons/:codigo", (req, res) => {
  const codigo = decodeURIComponent(req.params.codigo);
  let cupons = lerCSV(cuponsPath);
  const antes = cupons.length;
  cupons = cupons.filter((c) => c[0] !== codigo);
  salvarCSV(cuponsPath, cupons);
  res.json({
    message: antes === cupons.length ? "Cupom não encontrado." : "Cupom excluído com sucesso!",
  });
});

app.post("/cupons/validar", (req, res) => {
  const { codigo, total } = req.body;
  const cupons = lerCSV(cuponsPath);
  const cupom = cupons.find((c) => c[0] === codigo);
  if (!cupom) {
    return res.json({ message: "Cupom inválido." });
  }
  const desconto = (total * parseFloat(cupom[1])) / 100;
  const novoTotal = total - desconto;
  res.json({ total: novoTotal, desconto: desconto });
});

// === PRODUTOS ===
app.get("/produtos", (req, res) => {
  try {
    const produtos = lerCSV(produtosPath);
    console.log("Produtos carregados do CSV:", produtos.length);

    // Pular header se existir
    const dadosProdutos =
      produtos.length > 0 && produtos[0][0] === "id" ? produtos.slice(1) : produtos;

    const produtosFormatados = dadosProdutos.map((p) => ({
      id: p[0] || "",
      nome: p[1] || "",
      preco: parseFloat(p[2]) || 0,
      categoria: p[3] || "",
      foto: p[4] || "",
    }));

    console.log("Produtos formatados:", produtosFormatados.length);
    res.json(produtosFormatados);
  } catch (error) {
    console.error("Erro ao carregar produtos:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

app.post("/produtos", upload.single("imagem"), (req, res) => {
  try {
    const { nome, preco, categoria } = req.body;
    const imagemPath = req.file ? req.file.filename : "";

    if (!nome || !preco || !categoria || !imagemPath) {
      return res.status(400).json({ message: "Todos os campos são obrigatórios." });
    }

    const produtos = lerCSV(produtosPath);

    // Criar header se ainda não existir
    if (produtos.length === 0) {
      produtos.push(["id", "nome", "preco", "categoria", "foto"]);
    }

    // Gerar ID sequencial baseado no último ID existente
    let proximoId = 1;
    const dadosProdutos =
      produtos.length > 0 && produtos[0][0] === "id" ? produtos.slice(1) : produtos;

    if (dadosProdutos.length > 0) {
      const idsNumericos = dadosProdutos
        .map((p) => parseInt(p[0]))
        .filter((id) => !isNaN(id))
        .sort((a, b) => b - a);

      if (idsNumericos.length > 0) {
        proximoId = idsNumericos[0] + 1;
      }
    }

    produtos.push([proximoId.toString(), nome, preco, categoria, imagemPath]);
    salvarCSV(produtosPath, produtos);

    console.log("Produto adicionado com imagem:", {
      id: proximoId,
      nome,
      preco,
      categoria,
      imagemPath,
    });
    res.json({ message: "Produto adicionado com sucesso!" });
  } catch (error) {
    console.error("Erro ao adicionar produto com imagem:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

app.put("/produtos/:id", (req, res) => {
  const id = decodeURIComponent(req.params.id);
  const { nome, preco, categoria = "", foto = "" } = req.body;
  let produtos = lerCSV(produtosPath);
  let atualizado = false;
  produtos = produtos.map((p) => {
    if (p[0] === id) {
      atualizado = true;
      return [id, nome, preco, categoria, foto];
    }
    return p;
  });
  salvarCSV(produtosPath, produtos);
  res.json({
    message: atualizado ? "Produto atualizado com sucesso!" : "Produto não encontrado.",
  });
});

app.delete("/produtos/:id", (req, res) => {
  const id = decodeURIComponent(req.params.id);
  let produtos = lerCSV(produtosPath);
  const antes = produtos.length;
  produtos = produtos.filter((p) => p[0] !== id);
  salvarCSV(produtosPath, produtos);
  res.json({
    message: antes === produtos.length ? "Produto não encontrado." : "Produto excluído com sucesso!",
  });
});

// === PAGAMENTO ===
app.post("/pagamento/pix", (req, res) => {
  const { valor } = req.body;
  // Simulação de QR Code PIX
  const qrCodeData = `00020126580014BR.GOV.BCB.PIX0136${Math.random()
    .toString(36)
    .substr(2, 32)}520400005303986540${valor.toFixed(2)}5802BR5925BURGER KING SORVETES6009SAO PAULO62070503***6304`;
  const qrCodeUrl = `data:image/svg+xml;base64,${Buffer.from(
    `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"200\" height=\"200\"><rect width=\"200\" height=\"200\" fill=\"white\"/><text x=\"100\" y=\"100\" text-anchor=\"middle\" font-family=\"Arial\" font-size=\"12\">QR Code PIX R$ ${valor.toFixed(2)}</text></svg>`
  ).toString("base64")}`;
  res.json({ qrCode: qrCodeUrl });
});

// In-memory store for password reset tokens (for demonstration purposes)
const passwordResetTokens = {};

app.post("/forgot-password", (req, res) => {
  const { email } = req.body;
  const usuarios = lerCSV(usuariosPath);
  const usuario = usuarios.find((u) => u[0] === email);

  if (!usuario) {
    return res.status(404).json({ message: "Email não encontrado." });
  }

  // Generate a simple token (in a real app, use a more secure, time-limited token)
  const token = Math.random().toString(36).substr(2, 8).toUpperCase();
  passwordResetTokens[email] = token; // Store token associated with email

  console.log(`Token de recuperação para ${email}: ${token}`); // Log token for demonstration
  res.json({
    message: "Token de recuperação enviado para o seu email (verifique o console do servidor).",
  });
});

app.post("/reset-password", (req, res) => {
  const { email, token, newPassword } = req.body;
  let usuarios = lerCSV(usuariosPath);

  if (!passwordResetTokens[email] || passwordResetTokens[email] !== token) {
    return res.status(400).json({ message: "Token inválido ou expirado." });
  }

  let atualizado = false;
  usuarios = usuarios.map((u) => {
    if (u[0] === email) {
      u[1] = newPassword; // Update password
      atualizado = true;
    }
    return u;
  });

  if (atualizado) {
    salvarCSV(usuariosPath, usuarios);
    delete passwordResetTokens[email]; // Invalidate token after use
    res.json({ message: "Senha redefinida com sucesso!" });
  } else {
    res.status(404).json({ message: "Usuário não encontrado." });
  }
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});


