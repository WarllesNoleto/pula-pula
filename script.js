let total = parseFloat(localStorage.getItem('total')) || 0;
const sessions = JSON.parse(localStorage.getItem('sessions')) || [];
const payments = JSON.parse(localStorage.getItem('payments')) || [];

updateTotalDisplay();

document.getElementById('addButton').addEventListener('click', () => {
    const childName = document.getElementById('childName').value;
    const toy = document.getElementById('toySelect').value;
    if (childName === '') {
        alert('Por favor, insira o nome da criança.');
        return;
    }

    const sessionId = sessions.length;
    sessions.push({ id: sessionId, childName, toy, seconds: 0, interval: null });

    const sessionElement = document.createElement('div');
    sessionElement.className = 'session';
    sessionElement.id = `session-${sessionId}`;
    sessionElement.innerHTML = `
        <p>Criança: ${childName}</p>
        <p>Brinquedo: ${toy === 'carrinho' ? 'Carrinho' : 'Pula-Pula'}</p>
        <p>Tempo: <span id="time-${sessionId}">0</span></p>
        <p>Valor: R$<span id="price-${sessionId}">0.00</span></p>
        <button id="startButton-${sessionId}">Iniciar</button>
        <button id="stopButton-${sessionId}" disabled>Parar</button>
        <button id="closeAccountButton-${sessionId}" disabled>Fechar Conta</button>
    `;
    document.getElementById('sessions').appendChild(sessionElement);

    document.getElementById(`startButton-${sessionId}`).addEventListener('click', () => startSession(sessionId));
    document.getElementById(`stopButton-${sessionId}`).addEventListener('click', () => stopSession(sessionId));
    document.getElementById(`closeAccountButton-${sessionId}`).addEventListener('click', () => openPaymentModal(sessionId));

    document.getElementById('childName').value = '';
});

function startSession(id) {
    const session = sessions[id];
    const sessionElement = document.getElementById(`session-${id}`);

    session.interval = setInterval(() => updateTime(id), 1000);
    sessionElement.querySelector(`#startButton-${id}`).disabled = true;
    sessionElement.querySelector(`#stopButton-${id}`).disabled = false;
    sessionElement.querySelector(`#closeAccountButton-${id}`).disabled = false;
}

function stopSession(id) {
    const session = sessions[id];
    clearInterval(session.interval);

    const sessionElement = document.getElementById(`session-${id}`);
    sessionElement.querySelector(`#startButton-${id}`).disabled = false;
    sessionElement.querySelector(`#stopButton-${id}`).disabled = true;
}

function updateTime(id) {
    const session = sessions[id];
    session.seconds++;

    const timeElement = document.getElementById(`time-${id}`);
    const priceElement = document.getElementById(`price-${id}`);

    timeElement.textContent = formatTime(session.seconds);
    priceElement.textContent = calculatePrice(session.seconds, session.toy).toFixed(2);
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
}

function calculatePrice(seconds, toy) {
    const ratePerMinute = toy === 'carrinho' ? 1.5 : 1.0;
    return (seconds / 60) * ratePerMinute;
}

function updateTotalDisplay() {
    document.getElementById('total').textContent = total.toFixed(2);
}

function openPaymentModal(id) {
    const modal = document.getElementById('paymentModal');
    modal.style.display = "block";

    const paymentOptions = document.querySelectorAll('.payment-option');
    paymentOptions.forEach(button => {
        button.onclick = () => {
            closeAccount(id, button.getAttribute('data-method'));
            modal.style.display = "none";
        };
    });

    document.querySelector('.close').onclick = () => {
        modal.style.display = "none";
    };

    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    };
}

function closeAccount(id, paymentMethod) {
    const session = sessions[id];
    const price = calculatePrice(session.seconds, session.toy);

    total += price;
    localStorage.setItem('total', total.toString());

    const sessionElement = document.getElementById(`session-${id}`);
    sessionElement.remove();

    clearInterval(session.interval);
    sessions[id] = null;

    payments.push({ price, paymentMethod });
    localStorage.setItem('payments', JSON.stringify(payments));

    alert(`Conta fechada com sucesso. Método de pagamento: ${paymentMethod}`);

    updateTotalDisplay();
}

document.getElementById('closeBoxButton').addEventListener('click', () => {
    // Gerar o relatório
    const report = payments.reduce((acc, payment) => {
        acc[payment.paymentMethod] = (acc[payment.paymentMethod] || 0) + payment.price;
        return acc;
    }, {});

    // Calcula os totais
    const totalDinheiro = report['Dinheiro'] || 0;
    const totalPix = report['Pix'] || 0;
    const totalDebito = report['Cartão de Débito'] || 0;
    const totalCredito = report['Cartão de Crédito'] || 0;

    const descontoDebito = totalDebito * 0.0199;
    const totalDebitoComDesconto = totalDebito - descontoDebito;

    const descontoCredito = totalCredito * 0.0499;
    const totalCreditoComDesconto = totalCredito - descontoCredito;

    const totalDescontos = descontoDebito + descontoCredito;
    const totalComDescontos = total - totalDescontos;

    // Adiciona a data ao relatório
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('pt-BR');
    const currenthora = new Date();

    const hours = currenthora.getHours();
    const minutes = currenthora.getMinutes();
    const seconds = currenthora.getSeconds();
    // Formatando os minutos para garantir dois dígitos
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

    let reportText = `
    <html>
    <head>
        <title>Relatório de Fechamento de Caixa</title>
        <style>
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; max-height: 100vh margin: 0;}
            .report { width: 50%; padding: 20px; border: 1px solid #ccc; background-color: #f9f9f9; }
            h2 { text-align: center; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
        </style>
    </head>
    <body>
        <div class="report">
         <h2>Relatório de Fechamento de Caixa - ${formattedDate} às ${hours}:${formattedMinutes}:${seconds}</h2>
            
            <table>
                <tr>
                    <th>Descrição</th>
                    <th>Valor (R$)</th>
                </tr>
                <tr>
                    <td>Total em Dinheiro</td>
                    <td>${totalDinheiro.toFixed(2)}</td>
                </tr>
                <tr>
                    <td>Total em Pix</td>
                    <td>${totalPix.toFixed(2)}</td>
                </tr>
                <tr>
                    <td>Total em Cartão de Débito</td>
                    <td>${totalDebito.toFixed(2)}</td>
                </tr>
                <tr>
                    <td>Desconto no Débito (1.99%)</td>
                    <td>-${descontoDebito.toFixed(2)}</td>
                </tr>
                <tr>
                    <td>Total após Desconto (Débito)</td>
                    <td>${totalDebitoComDesconto.toFixed(2)}</td>
                </tr>
                <tr>
                    <td>Total em Cartão de Crédito</td>
                    <td>${totalCredito.toFixed(2)}</td>
                </tr>
                <tr>
                    <td>Desconto no Crédito (4.99%)</td>
                    <td>-${descontoCredito.toFixed(2)}</td>
                </tr>
                <tr>
                    <td>Total após Desconto (Crédito)</td>
                    <td>${totalCreditoComDesconto.toFixed(2)}</td>
                </tr>
                <tr>
                    <td><strong>Total Geral</strong></td>
                    <td><strong>${total.toFixed(2)}</strong></td>
                </tr>
                <tr>
                    <td>Total dos Descontos</td>
                    <td>-${totalDescontos.toFixed(2)}</td>
                </tr>
                <tr>
                    <td><strong>Total após Descontos</strong></td>
                    <td><strong>${totalComDescontos.toFixed(2)}</strong></td>
                </tr>
            </table>
        </div>
    </body>
    </html>
`;

// Abre uma nova janela com o relatório
const newWindow = window.open('', '_blank');
newWindow.document.write(reportText);
newWindow.document.close();

// Resetar o estado após fechar o caixa
total = 0;
localStorage.setItem('total', total.toString());
sessions.length = 0;
localStorage.setItem('sessions', JSON.stringify(sessions));
payments.length = 0;
localStorage.setItem('payments', JSON.stringify(payments));

updateTotalDisplay();
});
