// ===== UTILITY BOX - ARQUIVO PRINCIPAL =====

// Variáveis globais
let currentTheme = 'light';
let currentUser = null;

// Elementos do DOM
const darkModeToggle = document.getElementById('darkModeToggle');
const userName = document.getElementById('userName');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadUserPreferences();
    setupKeyboardIntegration();
});

// ===== INICIALIZAÇÃO DA APLICAÇÃO =====
function initializeApp() {
    console.log('🚀 Utility Box inicializando...');
    
    // Carregar tema salvo
    loadTheme();
    
    // Carregar dados do usuário
    loadUserData();
    
    // Configurar abas
    setupTabs();
    
    // Mostrar notificação de boas-vindas
    showNotification('Bem-vindo ao Utility Box! 🎉', 'info');
}

// ===== CONFIGURAÇÃO DE EVENT LISTENERS =====
function setupEventListeners() {
    // Toggle de tema escuro/claro
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', toggleTheme);
    }
    
    // Botões de autenticação
    if (loginBtn) {
        loginBtn.addEventListener('click', showLoginModal);
    }
    
    if (registerBtn) {
        registerBtn.addEventListener('click', showRegisterModal);
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Event listeners para modais
    setupModalEventListeners();
    
    // Event listeners para navegação
    setupNavigationEventListeners();
}

// ===== CONFIGURAÇÃO DE ABAS =====
function setupTabs() {
    const tabs = document.querySelectorAll('[data-bs-toggle="tab"]');
    
    tabs.forEach(tab => {
        tab.addEventListener('shown.bs.tab', function(event) {
            const targetId = event.target.getAttribute('data-bs-target');
            const targetPane = document.querySelector(targetId);
            
            if (targetPane) {
                // Adicionar animação de entrada
                targetPane.classList.add('fade-in');
                
                // Remover classe após animação
                setTimeout(() => {
                    targetPane.classList.remove('fade-in');
                }, 500);
                
                // Atualizar título da página
                updatePageTitle(event.target.textContent.trim());
                
                // Carregar dados específicos da aba
                loadTabData(targetId);
            }
        });
    });
}

// ===== SISTEMA DE TEMA =====
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(currentTheme);
    saveTheme();
    
    // Mostrar notificação
    const themeText = currentTheme === 'dark' ? 'escuro' : 'claro';
    showNotification(`Tema ${themeText} ativado! 🌙`, 'success');
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    currentTheme = theme;
    
    // Atualizar ícone do toggle
    if (darkModeToggle) {
        const icon = darkModeToggle.nextElementSibling.querySelector('i');
        if (icon) {
            icon.className = theme === 'dark' ? 'bi bi-sun' : 'bi bi-moon-stars';
        }
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('utilityBox-theme') || 'light';
    applyTheme(savedTheme);
    
    // Atualizar estado do toggle
    if (darkModeToggle) {
        darkModeToggle.checked = savedTheme === 'dark';
    }
}

function saveTheme() {
    localStorage.setItem('utilityBox-theme', currentTheme);
}

// ===== SISTEMA DE NOTIFICAÇÕES =====
function showNotification(message, type = 'info', duration = 4000) {
    // Remover notificações existentes
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
        notification.remove();
    });
    
    // Criar nova notificação
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="d-flex align-items-center p-3">
            <div class="flex-grow-1">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white ms-3" onclick="this.parentElement.parentElement.remove()"></button>
        </div>
    `;
    
    // Adicionar ao DOM
    document.body.appendChild(notification);
    
    // Auto-remover após duração
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, duration);
    
    // Adicionar evento de clique para fechar
    notification.addEventListener('click', function() {
        this.remove();
    });
}

// ===== SISTEMA DE AUTENTICAÇÃO =====
function showLoginModal() {
    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    loginModal.show();
}

function showRegisterModal() {
    const registerModal = new bootstrap.Modal(document.getElementById('registerModal'));
    registerModal.show();
}

function logout() {
    currentUser = null;
    updateUserInterface();
    saveUserData();
    
    showNotification('Logout realizado com sucesso! 👋', 'info');
}

function updateUserInterface() {
    if (currentUser) {
        userName.textContent = currentUser.name;
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
    } else {
        userName.textContent = 'Convidado';
        loginBtn.style.display = 'block';
        registerBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
    }
}

// ===== CONFIGURAÇÃO DE MODAIS =====
function setupModalEventListeners() {
    // Modal de login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Modal de registro
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
}

function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Simular autenticação
    if (email && password) {
        currentUser = {
            name: email.split('@')[0],
            email: email
        };
        
        updateUserInterface();
        saveUserData();
        
        // Fechar modal
        const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
        loginModal.hide();
        
        // Limpar formulário
        event.target.reset();
        
        showNotification(`Bem-vindo de volta, ${currentUser.name}! 👋`, 'success');
    } else {
        showNotification('Por favor, preencha todos os campos! ⚠️', 'warning');
    }
}

function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    // Simular registro
    if (name && email && password) {
        currentUser = { name, email };
        
        updateUserInterface();
        saveUserData();
        
        // Fechar modal
        const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
        registerModal.hide();
        
        // Limpar formulário
        event.target.reset();
        
        showNotification(`Conta criada com sucesso, ${name}! 🎉`, 'success');
    } else {
        showNotification('Por favor, preencha todos os campos! ⚠️', 'warning');
    }
}

// ===== CONFIGURAÇÃO DE NAVEGAÇÃO =====
function setupNavigationEventListeners() {
    // Navegação por teclado agora é gerenciada pelo sistema de atalhos
    console.log('🧭 Sistema de navegação configurado');
}

// ===== CARREGAMENTO DE DADOS DAS ABAS =====
function loadTabData(tabId) {
    switch (tabId) {
        case '#notes':
            // Carregar notas do usuário
            if (window.loadNotes) {
                window.loadNotes();
            }
            break;
            
        case '#postits':
            // Carregar post-its do usuário
            if (window.loadPostits) {
                window.loadPostits();
            }
            break;
            
        case '#tasks':
            // Carregar tarefas do usuário
            if (window.loadTasks) {
                window.loadTasks();
            }
            break;
            
        case '#code-editor':
            // Inicializar editor de código
            if (window.initCodeEditor) {
                window.initCodeEditor();
            }
            break;
    }
}

// ===== ATUALIZAÇÃO DO TÍTULO DA PÁGINA =====
function updatePageTitle(tabName) {
    document.title = `${tabName} - Utility Box`;
}

// ===== PERSISTÊNCIA DE DADOS =====
function saveUserData() {
    if (currentUser) {
        localStorage.setItem('utilityBox-user', JSON.stringify(currentUser));
    } else {
        localStorage.removeItem('utilityBox-user');
    }
}

function loadUserData() {
    const savedUser = localStorage.getItem('utilityBox-user');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            updateUserInterface();
        } catch (error) {
            console.error('Erro ao carregar dados do usuário:', error);
            localStorage.removeItem('utilityBox-user');
        }
    }
}

function loadUserPreferences() {
    // Carregar outras preferências do usuário
    const preferences = localStorage.getItem('utilityBox-preferences');
    if (preferences) {
        try {
            const prefs = JSON.parse(preferences);
            // Aplicar preferências específicas
            if (prefs.autoSave !== undefined) {
                // Configurar auto-save
            }
        } catch (error) {
            console.error('Erro ao carregar preferências:', error);
        }
    }
}

// ===== UTILITÁRIOS =====
function formatDate(date) {
    if (typeof date === 'string') {
        date = new Date(date);
    }
    
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ===== SISTEMA DE ATALHOS =====
function setupShortcuts() {
    // Sistema de atalhos agora é gerenciado pelo arquivo keyboard-shortcuts.js
    console.log('⌨️ Sistema de atalhos configurado');
}

// ===== SISTEMA DE BACKUP =====
function exportData() {
    const data = {
        user: currentUser,
        theme: currentTheme,
        notes: localStorage.getItem('utilityBox-notes'),
        postits: localStorage.getItem('utilityBox-postits'),
        tasks: localStorage.getItem('utilityBox-tasks'),
        timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `utilitybox-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    showNotification('Backup exportado com sucesso! 💾', 'success');
}

function importData(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // Validar dados
            if (data.timestamp && data.theme) {
                // Aplicar dados importados
                if (data.theme) {
                    applyTheme(data.theme);
                    saveTheme();
                }
                
                if (data.notes) {
                    localStorage.setItem('utilityBox-notes', data.notes);
                }
                
                if (data.postits) {
                    localStorage.setItem('utilityBox-postits', data.postits);
                }
                
                if (data.tasks) {
                    localStorage.setItem('utilityBox-tasks', data.tasks);
                }
                
                showNotification('Dados importados com sucesso! 📥', 'success');
                
                // Recarregar aba ativa
                const activeTab = document.querySelector('.tab-pane.active');
                if (activeTab) {
                    loadTabData('#' + activeTab.id);
                }
            } else {
                throw new Error('Formato de arquivo inválido');
            }
        } catch (error) {
            showNotification('Erro ao importar dados! ❌', 'error');
            console.error('Erro na importação:', error);
        }
    };
    reader.readAsText(file);
}

// ===== SISTEMA DE SINCRONIZAÇÃO =====
function setupSyncSystem() {
    // Botão de sincronização manual
    const manualSyncBtn = document.getElementById('manualSyncBtn');
    if (manualSyncBtn) {
        manualSyncBtn.addEventListener('click', () => {
            if (utilityBoxAPI) {
                utilityBoxAPI.manualSync();
            }
        });
    }

    // Botão de status da sincronização
    const syncStatsBtn = document.getElementById('syncStatsBtn');
    if (syncStatsBtn) {
        syncStatsBtn.addEventListener('click', () => {
            if (utilityBoxAPI) {
                const stats = utilityBoxAPI.getSyncStats();
                showSyncStats(stats);
            }
        });
    }

    // Botão de limpar dados de sincronização
    const clearSyncBtn = document.getElementById('clearSyncBtn');
    if (clearSyncBtn) {
        clearSyncBtn.addEventListener('click', () => {
            if (utilityBoxAPI) {
                if (confirm('Tem certeza que deseja limpar todos os dados de sincronização? 🗑️')) {
                    utilityBoxAPI.clearSyncData();
                }
            }
        });
    }

    // Botão principal de sincronização
    const syncBtn = document.getElementById('syncBtn');
    if (syncBtn) {
        syncBtn.addEventListener('click', () => {
            if (utilityBoxAPI) {
                utilityBoxAPI.manualSync();
            }
        });
    }

    console.log('☁️ Sistema de sincronização configurado');
}

function showSyncStats(stats) {
    const message = `
        📊 Status da Sincronização:
        Conexão: ${stats.isOnline ? '🟢 Online' : '🔴 Offline'}
        Última sincronização: ${stats.lastSync ? formatDate(new Date(stats.lastSync)) : 'Nunca'}
        Itens pendentes: ${stats.pendingItems}
        Usuário: ${stats.userId ? 'Logado' : 'Convidado'}
        Auto-sync: ${stats.autoSyncActive ? '🟢 Ativo' : '🔴 Inativo'}
    `;
    
    showNotification(message, 'info');
}

// ===== INICIALIZAÇÃO DE ATALHOS =====
setupShortcuts();

// ===== INTEGRAÇÃO COM SISTEMA DE ATALHOS =====
function setupKeyboardIntegration() {
    // Aguardar o sistema de atalhos estar disponível
    const checkKeyboardSystem = setInterval(() => {
        if (window.keyboardShortcuts) {
            clearInterval(checkKeyboardSystem);
            
            // Configurar integração
            console.log('⌨️ Sistema de atalhos integrado com sucesso');
            
            // Adicionar botão de toggle para atalhos na interface
            addKeyboardToggleButton();
        }
    }, 100);
}

function addKeyboardToggleButton() {
    const header = document.querySelector('.navbar-nav');
    if (header && !document.getElementById('keyboardToggleBtn')) {
        const toggleBtn = document.createElement('li');
        toggleBtn.className = 'nav-item';
        toggleBtn.innerHTML = `
            <button class="btn btn-outline-secondary btn-sm" id="keyboardToggleBtn" title="Ativar/Desativar Atalhos de Teclado">
                <i class="bi bi-keyboard"></i>
            </button>
        `;
        
        toggleBtn.addEventListener('click', () => {
            if (window.keyboardShortcuts) {
                window.keyboardShortcuts.toggle();
                
                // Atualizar ícone do botão
                const icon = toggleBtn.querySelector('i');
                if (icon) {
                    icon.className = window.keyboardShortcuts.isEnabled ? 'bi bi-keyboard' : 'bi bi-keyboard-fill';
                }
            }
        });
        
        header.appendChild(toggleBtn);
    }
}

// ===== EXPORTAÇÃO DE FUNÇÕES GLOBAIS =====
window.UtilityBox = {
    showNotification,
    formatDate,
    generateId,
    exportData,
    importData,
    currentUser: () => currentUser,
    currentTheme: () => currentTheme
};

console.log('✅ Utility Box inicializado com sucesso!');
