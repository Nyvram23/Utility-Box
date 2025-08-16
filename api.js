// API REST Simulada - Utility Box
// Sistema de sincronização em nuvem com endpoints para todas as ferramentas

class UtilityBoxAPI {
    constructor() {
        this.baseURL = 'https://api.utilitybox.cloud'; // Simulado
        this.apiKey = null;
        this.userId = null;
        this.isOnline = navigator.onLine;
        this.syncQueue = [];
        this.lastSync = null;
        this.syncInterval = null;
        
        this.init();
    }

    init() {
        this.setupOnlineOfflineDetection();
        this.loadUserSession();
        this.startAutoSync();
        console.log('🌐 API REST simulada inicializada');
    }

    setupOnlineOfflineDetection() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.syncPendingData();
            showNotification('Conexão restaurada! Sincronizando dados... 🔄', 'success');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            showNotification('Modo offline ativado. Dados serão sincronizados quando online. 📱', 'warning');
        });
    }

    loadUserSession() {
        const session = localStorage.getItem('utilityBox_session');
        if (session) {
            try {
                const sessionData = JSON.parse(session);
                this.apiKey = sessionData.apiKey;
                this.userId = sessionData.userId;
                this.lastSync = sessionData.lastSync;
            } catch (error) {
                console.error('Erro ao carregar sessão:', error);
            }
        }
    }

    saveUserSession() {
        const sessionData = {
            apiKey: this.apiKey,
            userId: this.userId,
            lastSync: this.lastSync
        };
        localStorage.setItem('utilityBox_session', JSON.stringify(sessionData));
    }

    // Simulação de autenticação
    async authenticate(email, password) {
        // Simula delay de rede
        await this.simulateNetworkDelay();
        
        // Simula validação de credenciais
        if (email && password) {
            this.userId = generateId();
            this.apiKey = this.generateJWT();
            this.lastSync = new Date().toISOString();
            
            this.saveUserSession();
            
            return {
                success: true,
                user: {
                    id: this.userId,
                    email: email,
                    name: email.split('@')[0]
                },
                token: this.apiKey
            };
        }
        
        throw new Error('Credenciais inválidas');
    }

    generateJWT() {
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = btoa(JSON.stringify({
            userId: this.userId,
            exp: Date.now() + (24 * 60 * 60 * 1000) // 24 horas
        }));
        const signature = btoa('utilitybox_secret_key_' + Date.now());
        
        return `${header}.${payload}.${signature}`;
    }

    // Endpoints para todas as ferramentas
    async syncNotes(notes) {
        return await this.apiCall('POST', '/notes/sync', { notes });
    }

    async syncCalculator(history) {
        return await this.apiCall('POST', '/calculator/sync', { history });
    }

    async syncPostits(postits) {
        return await this.apiCall('POST', '/postits/sync', { postits });
    }

    async syncTasks(tasks) {
        return await this.apiCall('POST', '/tasks/sync', { tasks });
    }

    async syncSolitaireStats(stats) {
        return await this.apiCall('POST', '/solitaire/sync', { stats });
    }

    // Sistema de sincronização principal
    async syncAllData() {
        if (!this.isOnline || !this.apiKey) {
            return { success: false, message: 'Offline ou não autenticado' };
        }

        try {
            const syncData = {
                notes: this.getLocalData('notes'),
                calculator: this.getLocalData('calculator'),
                postits: this.getLocalData('postits'),
                tasks: this.getLocalData('tasks'),
                solitaire: this.getLocalData('solitaire')
            };

            const response = await this.apiCall('POST', '/sync/all', syncData);
            
            if (response.success) {
                this.lastSync = new Date().toISOString();
                this.saveUserSession();
                this.processServerData(response.data);
                showNotification('Dados sincronizados com sucesso! ☁️', 'success');
            }

            return response;
        } catch (error) {
            console.error('Erro na sincronização:', error);
            showNotification('Erro na sincronização. Tentando novamente... ❌', 'error');
            return { success: false, error: error.message };
        }
    }

    getLocalData(type) {
        const data = localStorage.getItem(`utilityBox_${type}`);
        return data ? JSON.parse(data) : [];
    }

    processServerData(serverData) {
        // Processa dados recebidos do servidor
        if (serverData.notes) {
            localStorage.setItem('utilityBox_notes', JSON.stringify(serverData.notes));
        }
        if (serverData.calculator) {
            localStorage.setItem('utilityBox_calculator', JSON.stringify(serverData.calculator));
        }
        if (serverData.postits) {
            localStorage.setItem('utilityBox_postits', JSON.stringify(serverData.postits));
        }
        if (serverData.tasks) {
            localStorage.setItem('utilityBox_tasks', JSON.stringify(serverData.tasks));
        }
        if (serverData.solitaire) {
            localStorage.setItem('utilityBox_solitaire_stats', JSON.stringify(serverData.solitaire));
        }
    }

    // Sistema de fila de sincronização
    addToSyncQueue(type, data) {
        this.syncQueue.push({
            id: generateId(),
            type: type,
            data: data,
            timestamp: new Date().toISOString(),
            retries: 0
        });

        this.saveSyncQueue();
        
        if (this.isOnline) {
            this.processSyncQueue();
        }
    }

    async processSyncQueue() {
        if (this.syncQueue.length === 0 || !this.isOnline) return;

        const item = this.syncQueue[0];
        
        try {
            let response;
            switch (item.type) {
                case 'notes':
                    response = await this.syncNotes(item.data);
                    break;
                case 'calculator':
                    response = await this.syncCalculator(item.data);
                    break;
                case 'postits':
                    response = await this.syncPostits(item.data);
                    break;
                case 'tasks':
                    response = await this.syncTasks(item.data);
                    break;
                case 'solitaire':
                    response = await this.syncSolitaireStats(item.data);
                    break;
            }

            if (response && response.success) {
                this.syncQueue.shift();
                this.saveSyncQueue();
            } else {
                item.retries++;
                if (item.retries >= 3) {
                    this.syncQueue.shift();
                    this.saveSyncQueue();
                    showNotification(`Falha na sincronização de ${item.type} após 3 tentativas`, 'error');
                }
            }
        } catch (error) {
            item.retries++;
            if (item.retries >= 3) {
                this.syncQueue.shift();
                this.saveSyncQueue();
            }
        }

        // Processa próximo item da fila
        if (this.syncQueue.length > 0) {
            setTimeout(() => this.processSyncQueue(), 1000);
        }
    }

    saveSyncQueue() {
        localStorage.setItem('utilityBox_syncQueue', JSON.stringify(this.syncQueue));
    }

    loadSyncQueue() {
        const saved = localStorage.getItem('utilityBox_syncQueue');
        if (saved) {
            try {
                this.syncQueue = JSON.parse(saved);
            } catch (error) {
                console.error('Erro ao carregar fila de sincronização:', error);
                this.syncQueue = [];
            }
        }
    }

    // Sincronização automática
    startAutoSync() {
        this.syncInterval = setInterval(() => {
            if (this.isOnline && this.apiKey) {
                this.syncAllData();
            }
        }, 5 * 60 * 1000); // A cada 5 minutos
    }

    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    // Sincronização manual
    async manualSync() {
        if (!this.isOnline) {
            showNotification('Sem conexão com a internet! 🌐', 'warning');
            return;
        }

        if (!this.apiKey) {
            showNotification('Faça login para sincronizar! 🔐', 'warning');
            return;
        }

        showNotification('Iniciando sincronização... 🔄', 'info');
        const result = await this.syncAllData();
        
        if (result.success) {
            showNotification('Sincronização concluída! ✅', 'success');
        }
    }

    // Sincronização de dados pendentes
    async syncPendingData() {
        if (this.syncQueue.length > 0) {
            showNotification(`Sincronizando ${this.syncQueue.length} itens pendentes... 🔄`, 'info');
            await this.processSyncQueue();
        }
    }

    // Método principal da API
    async apiCall(method, endpoint, data = null) {
        if (!this.apiKey) {
            throw new Error('Não autenticado');
        }

        // Simula chamada de API
        await this.simulateNetworkDelay();
        
        // Simula diferentes respostas baseadas no endpoint
        switch (endpoint) {
            case '/notes/sync':
                return this.simulateNotesSync(data);
            case '/calculator/sync':
                return this.simulateCalculatorSync(data);
            case '/postits/sync':
                return this.simulatePostitsSync(data);
            case '/tasks/sync':
                return this.simulateTasksSync(data);
            case '/solitaire/sync':
                return this.simulateSolitaireSync(data);
            case '/sync/all':
                return this.simulateFullSync(data);
            default:
                throw new Error('Endpoint não encontrado');
        }
    }

    // Simulações de respostas da API
    simulateNotesSync(data) {
        return {
            success: true,
            message: 'Notas sincronizadas',
            data: { notes: data.notes },
            timestamp: new Date().toISOString()
        };
    }

    simulateCalculatorSync(data) {
        return {
            success: true,
            message: 'Histórico da calculadora sincronizado',
            data: { calculator: data.history },
            timestamp: new Date().toISOString()
        };
    }

    simulatePostitsSync(data) {
        return {
            success: true,
            message: 'Post-its sincronizados',
            data: { postits: data.postits },
            timestamp: new Date().toISOString()
        };
    }

    simulateTasksSync(data) {
        return {
            success: true,
            message: 'Tarefas sincronizadas',
            data: { tasks: data.tasks },
            timestamp: new Date().toISOString()
        };
    }

    simulateSolitaireSync(data) {
        return {
            success: true,
            message: 'Estatísticas do jogo sincronizadas',
            data: { solitaire: data.stats },
            timestamp: new Date().toISOString()
        };
    }

    simulateFullSync(data) {
        return {
            success: true,
            message: 'Sincronização completa realizada',
            data: data,
            timestamp: new Date().toISOString()
        };
    }

    simulateNetworkDelay() {
        return new Promise(resolve => {
            setTimeout(resolve, Math.random() * 1000 + 500); // 500ms a 1.5s
        });
    }

    // Estatísticas de sincronização
    getSyncStats() {
        return {
            isOnline: this.isOnline,
            lastSync: this.lastSync,
            pendingItems: this.syncQueue.length,
            userId: this.userId,
            autoSyncActive: !!this.syncInterval
        };
    }

    // Limpar dados de sincronização
    clearSyncData() {
        this.syncQueue = [];
        this.lastSync = null;
        this.saveSyncQueue();
        localStorage.removeItem('utilityBox_session');
        this.apiKey = null;
        this.userId = null;
        
        showNotification('Dados de sincronização limpos! 🗑️', 'info');
    }
}

// Inicializar API quando o DOM estiver carregado
let utilityBoxAPI;
document.addEventListener('DOMContentLoaded', function() {
    utilityBoxAPI = new UtilityBoxAPI();
});

// Funções globais para acesso via HTML
window.utilityBoxAPI = utilityBoxAPI;
