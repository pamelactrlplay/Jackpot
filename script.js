const spinButton = document.getElementById("spinButton");
const message = document.getElementById("message");
const usernameInput = document.getElementById("username");
const historyList = document.getElementById("historyList");
const balanceSpan = document.getElementById("balance");

const letrasPossiveis = ["a", "b", "c", "d"];

async function carregarDadosUsuario(usuario) {
    try {
        // Usando caminho relativo para evitar bloqueio de porta/CORS
        const resposta = await fetch(`/api/historico/${encodeURIComponent(usuario)}`);
        const dados = await resposta.json();

        const saldoExibido = (dados && dados.saldoAtual !== undefined) ? dados.saldoAtual : 1000;
        balanceSpan.innerText = saldoExibido;

        historyList.innerHTML = "";
        
        const listaHistorico = dados.historico || [];
        if (!Array.isArray(listaHistorico) || listaHistorico.length === 0) {
            historyList.innerHTML = "<li>Nenhuma jogada registrada.</li>";
            return;
        }

        listaHistorico.forEach(jogada => {
            const li = document.createElement("li");
            const status = jogada.venceu ? "🎉 Ganhou" : "❌ Perdeu";
            li.textContent = `[${jogada.listaLetras.join(" - ")}] | R$ ${jogada.saldoAtualizado} (${status})`;
            historyList.appendChild(li);
        });
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
        balanceSpan.innerText = "1000";
    }
}

spinButton.addEventListener("click", async () => {
    const usuario = usernameInput.value.trim() || "Convidado";
    
    spinButton.disabled = true;
    message.textContent = "Girando os rolos...";
    message.style.color = "#f39c12";

    
    const intervaloAnimacao = setInterval(() => {
        document.getElementById("rolo0").innerText = letrasPossiveis[Math.floor(Math.random() * letrasPossiveis.length)];
        document.getElementById("rolo1").innerText = letrasPossiveis[Math.floor(Math.random() * letrasPossiveis.length)];
        document.getElementById("rolo2").innerText = letrasPossiveis[Math.floor(Math.random() * letrasPossiveis.length)];
    }, 200);

    try {
        // Caminho relativo para a API do backend
        const resposta = await fetch("/api/spin", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ usuario: usuario })
        });

        const dados = await resposta.json();

        setTimeout(() => {
            clearInterval(intervaloAnimacao);

            document.getElementById("rolo0").innerText = dados.rolos[0];
            document.getElementById("rolo1").innerText = dados.rolos[1];
            document.getElementById("rolo2").innerText = dados.rolos[2];

            balanceSpan.innerText = dados.saldo;

            if (dados.venceu) {
                message.textContent = "🎉 TRINCA! VOCÊ GANHOU! 🎉";
                message.style.color = "#2ecc71";
            } else {
                message.textContent = "Não foi dessa vez. Tente novamente!";
                message.style.color = "#e74c3c";
            }

            carregarDadosUsuario(usuario);
            spinButton.disabled = false;
        }, 2000);

    } catch (error) {
        clearInterval(intervaloAnimacao);
        message.textContent = "Erro ao conectar com o servidor!";
        message.style.color = "#e74c3c";
        console.error("Erro:", error);
        spinButton.disabled = false;
    }
});

usernameInput.addEventListener("blur", () => {
    if (usernameInput.value.trim() !== "") {
        carregarDadosUsuario(usernameInput.value.trim());
    }
});

// Carrega os dados iniciais ao abrir a página
carregarDadosUsuario(usernameInput.value.trim() || "Convidado");