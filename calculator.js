// ===== SISTEMA DE CALCULADORA =====

// Variáveis globais
let currentInput = '';
let previousInput = '';
let operation = null;
let shouldResetScreen = false;
let calculationHistory = [];

// Elementos do DOM
const calcDisplay = document.getElementById('calcDisplay');
const calculatorButtons = document.querySelector('.calculator-buttons');

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    if (calculatorButtons) {
        setupCalculatorEventListeners();
        loadCalculatorHistory();
        updateDisplay();
    }
});

// ===== CONFIGURAÇÃO DE EVENT LISTENERS =====
function setupCalculatorEventListeners() {
    if (calculatorButtons) {
        calculatorButtons.addEventListener('click', handleButtonClick);
    }
    
    // Atalhos de teclado
    document.addEventListener('keydown', handleKeyboardInput);
}

// ===== HANDLERS DE EVENTOS =====
function handleButtonClick(event) {
    const button = event.target;
    
    if (button.tagName === 'BUTTON') {
        const action = button.getAttribute('data-action');
        const value = button.getAttribute('data-number') || button.getAttribute('data-operator');
        
        if (action) {
            handleAction(action, value);
        } else if (value) {
            handleNumber(value);
        }
        
        // Efeito visual
        button.classList.add('btn-active');
        setTimeout(() => button.classList.remove('btn-active'), 150);
    }
}

function handleKeyboardInput(event) {
    const key = event.key;
    
    // Números
    if (/[0-9]/.test(key)) {
        handleNumber(key);
    }
    
    // Operadores
    else if (['+', '-', '*', '/'].includes(key)) {
        handleOperator(key);
    }
    
    // Enter ou = para calcular
    else if (key === 'Enter' || key === '=') {
        calculate();
    }
    
    // Escape para limpar
    else if (key === 'Escape') {
        clear();
    }
    
    // Backspace para apagar último caractere
    else if (key === 'Backspace') {
        backspace();
    }
    
    // Ponto decimal
    else if (key === '.') {
        handleDecimal();
    }
    
    // Atalhos adicionais
    else if (key === 'c' || key === 'C') {
        clear();
    }
    else if (key === 'h' || key === 'H') {
        if (event.ctrlKey || event.metaKey) {
            toggleHistory();
        }
    }
    else if (key === 'Delete') {
        clear();
    }
    
    // Prevenir comportamento padrão para teclas especiais
    if (['+', '-', '*', '/', 'Enter', '=', 'Escape', 'Backspace', '.', 'c', 'C', 'h', 'H', 'Delete'].includes(key)) {
        event.preventDefault();
    }
}

// ===== FUNÇÕES PRINCIPAIS =====
function handleNumber(number) {
    if (shouldResetScreen) {
        currentInput = '';
        shouldResetScreen = false;
    }
    
    // Limitar tamanho do input
    if (currentInput.length >= 15) {
        return;
    }
    
    // Evitar múltiplos zeros à esquerda
    if (number === '0' && currentInput === '0') {
        return;
    }
    
    currentInput += number;
    updateDisplay();
}

function handleOperator(operator) {
    if (currentInput === '' && previousInput === '') {
        return;
    }
    
    if (currentInput === '') {
        operation = operator;
        return;
    }
    
    if (previousInput !== '') {
        calculate();
    }
    
    operation = operator;
    previousInput = currentInput;
    currentInput = '';
    shouldResetScreen = false;
    
    updateDisplay();
}

function handleDecimal() {
    if (shouldResetScreen) {
        currentInput = '';
        shouldResetScreen = false;
    }
    
    // Evitar múltiplos pontos decimais
    if (currentInput.includes('.')) {
        return;
    }
    
    // Adicionar zero antes do ponto se necessário
    if (currentInput === '') {
        currentInput = '0';
    }
    
    currentInput += '.';
    updateDisplay();
}

function calculate() {
    if (currentInput === '' || previousInput === '' || !operation) {
        return;
    }
    
    const prev = parseFloat(previousInput);
    const current = parseFloat(currentInput);
    let result;
    
    try {
        switch (operation) {
            case '+':
                result = prev + current;
                break;
            case '-':
                result = prev - current;
                break;
            case '*':
                result = prev * current;
                break;
            case '/':
                if (current === 0) {
                    throw new Error('Divisão por zero');
                }
                result = prev / current;
                break;
            default:
                return;
        }
        
        // Adicionar ao histórico
        addToHistory(previousInput, operation, currentInput, result);
        
        // Atualizar display
        currentInput = result.toString();
        previousInput = '';
        operation = null;
        shouldResetScreen = true;
        
        updateDisplay();
        
        // Mostrar resultado
        showNotification(`Resultado: ${result} 🧮`, 'success', 2000);
        
    } catch (error) {
        showNotification(`Erro: ${error.message} ❌`, 'error');
        clear();
    }
}

function clear() {
    currentInput = '';
    previousInput = '';
    operation = null;
    shouldResetScreen = false;
    updateDisplay();
}

function backspace() {
    currentInput = currentInput.slice(0, -1);
    updateDisplay();
}

function handleAction(action, value) {
    switch (action) {
        case 'clear':
            clear();
            break;
        case 'backspace':
            backspace();
            break;
        case 'percent':
            handlePercent();
            break;
        case 'operator':
            handleOperator(value);
            break;
        case 'decimal':
            handleDecimal();
            break;
        case 'equals':
            calculate();
            break;
    }
}

function handlePercent() {
    if (currentInput !== '') {
        const value = parseFloat(currentInput);
        currentInput = (value / 100).toString();
        updateDisplay();
    }
}

function updateDisplay() {
    if (calcDisplay) {
        calcDisplay.value = currentInput || '0';
    }
}

// ===== HISTÓRICO DE CÁLCULOS =====
function addToHistory(prev, op, current, result) {
    const calculation = {
        id: Date.now(),
        expression: `${prev} ${op} ${current}`,
        result: result,
        timestamp: new Date().toISOString()
    };
    
    calculationHistory.unshift(calculation);
    
    // Manter apenas os últimos 20 cálculos
    if (calculationHistory.length > 20) {
        calculationHistory = calculationHistory.slice(0, 20);
    }
    
    // Salvar no localStorage
    saveCalculatorHistory();
    
    // Atualizar display do histórico
    updateHistoryDisplay();
}

function updateHistoryDisplay() {
    const historyContainer = document.querySelector('.calculator-history');
    if (!historyContainer) return;
    
    historyContainer.innerHTML = '';
    
    if (calculationHistory.length === 0) {
        historyContainer.innerHTML = '<p class="text-muted text-center">Nenhum cálculo no histórico</p>';
        return;
    }
    
    calculationHistory.forEach(calc => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item p-2 border-bottom';
        historyItem.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <small class="text-muted">${calc.expression}</small>
                    <div class="fw-bold">${calc.result}</div>
                </div>
                <button class="btn btn-sm btn-outline-secondary" onclick="useHistoryResult(${calc.result})">
                    <i class="bi bi-arrow-up"></i>
                </button>
            </div>
        `;
        historyContainer.appendChild(historyItem);
    });
}

function useHistoryResult(result) {
    currentInput = result.toString();
    shouldResetScreen = true;
    updateDisplay();
    showNotification('Resultado do histórico aplicado! 📊', 'info');
}

function clearHistory() {
    calculationHistory = [];
    saveCalculatorHistory();
    updateHistoryDisplay();
    showNotification('Histórico limpo! 🗑️', 'info');
}

function toggleHistory() {
    const historyContainer = document.querySelector('.calculator-history');
    if (historyContainer) {
        const isVisible = historyContainer.style.display !== 'none';
        historyContainer.style.display = isVisible ? 'none' : 'block';
        
        const message = isVisible ? 'Histórico oculto! 👁️' : 'Histórico visível! 📊';
        showNotification(message, 'info');
    }
}

// ===== PERSISTÊNCIA =====
function saveCalculatorHistory() {
    try {
        localStorage.setItem('utilityBox-calculator-history', JSON.stringify(calculationHistory));
    } catch (error) {
        console.error('Erro ao salvar histórico da calculadora:', error);
    }
}

function loadCalculatorHistory() {
    try {
        const savedHistory = localStorage.getItem('utilityBox-calculator-history');
        if (savedHistory) {
            calculationHistory = JSON.parse(savedHistory);
            updateHistoryDisplay();
        }
    } catch (error) {
        console.error('Erro ao carregar histórico da calculadora:', error);
        calculationHistory = [];
    }
}

// ===== FUNÇÕES DE EXPORTAÇÃO/IMPORTAÇÃO =====
function exportCalculatorHistory() {
    if (calculationHistory.length === 0) {
        showNotification('Nenhum cálculo no histórico para exportar! ⚠️', 'warning');
        return;
    }
    
    const data = {
        history: calculationHistory,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `calculadora-historico-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    showNotification('Histórico exportado com sucesso! 📤', 'success');
}

function importCalculatorHistory(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.history && Array.isArray(data.history)) {
                // Adicionar cálculos importados
                data.history.forEach(calc => {
                    calc.id = Date.now() + Math.random(); // Gerar novo ID
                    calc.importedAt = new Date().toISOString();
                });
                
                calculationHistory = [...calculationHistory, ...data.history];
                
                // Manter apenas os últimos 20
                if (calculationHistory.length > 20) {
                    calculationHistory = calculationHistory.slice(0, 20);
                }
                
                saveCalculatorHistory();
                updateHistoryDisplay();
                
                showNotification(`${data.history.length} cálculos importados com sucesso! 📥`, 'success');
            } else {
                throw new Error('Formato de arquivo inválido');
            }
        } catch (error) {
            showNotification('Erro ao importar histórico! ❌', 'error');
            console.error('Erro na importação:', error);
        }
    };
    reader.readAsText(file);
}

// ===== FUNÇÕES GLOBAIS =====
window.loadCalculatorHistory = loadCalculatorHistory;
window.exportCalculatorHistory = exportCalculatorHistory;
window.importCalculatorHistory = importCalculatorHistory;
window.clearHistory = clearHistory;
window.toggleHistory = toggleHistory;

// Exportar funções para o sistema de atalhos
window.calculatorApp = {
    clear,
    calculate,
    toggleHistory
};

console.log('✅ Sistema de calculadora carregado!');
