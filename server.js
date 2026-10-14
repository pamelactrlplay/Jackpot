const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// Diz ao Express para servir os arquivos estáticos (index.html, style.css, script.js) da pasta atual
app.use(express.static(__dirname));

const ARQUIVO_DB = path.join(__dirname, "historico.json");

function lerBanco() {
    if (!fs.existsSync(ARQUIVO_DB)) return [];
    try {
        return JSON.parse(fs.readFileSync(ARQUIVO_DB, "utf8"));
    } catch (error) {
        return [];
    }
}

function salvarBanco(dados) {
    fs.writeFileSync(ARQUIVO_DB, JSON.stringify(dados, null, 2), "utf8");
}

const saldosUsuarios = {};

app.post("/api/spin", (req, res) => {
    let { usuario } = req.body;
    if (!usuario) usuario = "Convidado";

    if (saldosUsuarios[usuario] === undefined) {
        saldosUsuarios[usuario] = 1000;
    }

    let saldoAtual = saldosUsuarios[usuario];

    let lista = [0, 0, 0];
    let lista2 = ["", "", ""];

    for (let i = 0; i < 3; i++) {
        lista[i] = Math.floor(Math.random() * 101);
    }

    for (let i = 0; i < 3; i++) {
        if (lista[i] <= 50) lista2[i] = "a";
        else if (lista[i] > 50 && lista[i] <= 80) lista2[i] = "b";
        else if (lista[i] > 80 && lista[i] <= 99) lista2[i] = "c";
        else if (lista[i] == 100) lista2[i] = "d";
    }

    let venceu = false;
    if (lista2[0] === lista2[1] && lista2[1] === lista2[2]) {
        venceu = true;
        let letraSorteada = lista2[0];

        if (letraSorteada === "a") saldoAtual *= 1.5;
        else if (letraSorteada === "b") saldoAtual *= 5;
        else if (letraSorteada === "c") saldoAtual *= 25;
        else if (letraSorteada === "d") saldoAtual *= 150;
    } else {
        saldoAtual *= 0.8;
    }

    saldoAtual = Number(saldoAtual.toFixed(2));
    saldosUsuarios[usuario] = saldoAtual;

    const novaJogada = {
        usuario: usuario,
        listaLetras: lista2,
        saldoAtualizado: saldoAtual,
        venceu: venceu,
        data: new Date()
    };

    try {
        const historicoGeral = lerBanco();
        historicoGeral.push(novaJogada);
        salvarBanco(historicoGeral);
    } catch (error) {
        console.error("Erro ao salvar:", error);
    }

    res.json({
        rolos: lista2,
        saldo: saldoAtual,
        venceu: venceu
    });
});

app.get("/api/historico/:usuario", (req, res) => {
    try {
        const usuarioBuscado = req.params.usuario;
        const historicoGeral = lerBanco();
        const historicoUsuario = historicoGeral
            .filter(j => j.usuario.toLowerCase() === usuarioBuscado.toLowerCase());

        if (historicoUsuario.length > 0) {
            saldosUsuarios[usuarioBuscado] = historicoUsuario[historicoUsuario.length - 1].saldoAtualizado;
        } else if (saldosUsuarios[usuarioBuscado] === undefined) {
            saldosUsuarios[usuarioBuscado] = 1000;
        }

        res.json({
            historico: historicoUsuario.reverse().slice(0, 10),
            saldoAtual: saldosUsuarios[usuarioBuscado]
        });
    } catch (error) {
        res.status(500).json({ erro: "Erro ao buscar histórico" });
    }
});

app.listen(3000, () => {
    console.log("Servidor rodando em http://localhost:3000 🚀");
});