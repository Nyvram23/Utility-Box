// Sistema de Post-its - Utility Box
// Funcionalidades: criar, editar, deletar, mudar cores, persistência

class PostItManager {
    constructor() {
        this.postits = [];
        this.currentPostit = null;
        this.isEditing = false;
        this.colors = [
            { name: 'amarelo', class: 'postit-yellow', bg: '#ffeb3b' },
            { name: 'azul', class: 'postit-blue', bg: '#2196f3' },
            { name: 'verde', class: 'postit-green', bg: '#4caf50' },
            { name: 'rosa', class: 'postit-pink', bg: '#e91e63' },
            { name: 'laranja', class: 'postit-orange', bg: '#ff9800' },
            { name: 'roxo', class: 'postit-purple', bg: '#9c27b0' }
        ];
        
        this.init();
    }

    init() {
        this.loadPostits();
        this.setupEventListeners();
        this.renderPostits();
        console.log('📝 Sistema de Post-its inicializado');
    }

    setupEventListeners() {
        // Botão de novo post-it
        const newPostitBtn = document.getElementById('newPostitBtn');
        if (newPostitBtn) {
            newPostitBtn.addEventListener('click', () => this.createNewPostit());
        }

        // Botão de limpar todos
        const clearAllBtn = document.getElementById('clearAllPostitsBtn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => this.clearAllPostits());
        }

        // Botão de exportar
        const exportBtn = document.getElementById('exportPostitsBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportPostits());
        }

        // Botão de importar
        const importBtn = document.getElementById('importPostitsBtn');
        if (importBtn) {
            importBtn.addEventListener('click', () => this.importPostits());
        }

        // Atalhos de teclado básicos (os principais são gerenciados pelo sistema centralizado)
        document.addEventListener('keydown', (e) => {
            // Garantir que Backspace e Delete funcionem sempre
            if (e.key === 'Backspace' || e.key === 'Delete') {
                return; // Permitir comportamento padrão
            }
            
            // Enter para salvar quando editando
            if (e.key === 'Enter' && e.target.matches('#postitTitle, #postitContent')) {
                e.preventDefault();
                if (this.currentPostit) {
                    this.savePostit(this.currentPostit.id);
                }
            }
            
            // Escape para cancelar edição
            if (e.key === 'Escape') {
                this.hidePostitEditor();
            }
        });
    }

    createNewPostit() {
        const newPostit = {
            id: this.generateId(),
            title: '',
            content: '',
            color: 'postit-yellow',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            userId: window.UtilityBox ? window.UtilityBox.currentUser()?.email : 'guest'
        };

        this.postits.unshift(newPostit);
        this.currentPostit = newPostit;
        this.isEditing = true;
        
        this.savePostits();
        this.renderPostits();
        this.showPostitEditor(newPostit);
        
        showNotification('Novo Post-it criado! 📝', 'success');
    }

    showPostitEditor(postit) {
        const editor = document.getElementById('postitEditor');
        if (!editor) return;

        const titleInput = editor.querySelector('#postitTitle');
        const contentInput = editor.querySelector('#postitContent');
        const colorSelect = editor.querySelector('#postitColor');
        const saveBtn = editor.querySelector('#savePostitBtn');

        if (titleInput) titleInput.value = postit.title;
        if (contentInput) contentInput.value = postit.content;
        if (colorSelect) colorSelect.value = postit.color;

        // Configurar opções de cor
        if (colorSelect) {
            colorSelect.innerHTML = this.colors.map(color => 
                `<option value="${color.class}">${color.name}</option>`
            ).join('');
        }

        // Configurar botão de salvar
        if (saveBtn) {
            saveBtn.onclick = () => this.savePostit(postit.id);
        }

        // Mostrar editor
        const bootstrapModal = new bootstrap.Modal(editor);
        bootstrapModal.show();
        
        // Focar no título
        if (titleInput) titleInput.focus();
    }

    hidePostitEditor() {
        const editor = document.getElementById('postitEditor');
        if (editor) {
            const bootstrapModal = bootstrap.Modal.getInstance(editor);
            if (bootstrapModal) {
                bootstrapModal.hide();
            }
        }
        this.isEditing = false;
        this.currentPostit = null;
    }

    savePostit(postitId) {
        const titleInput = document.getElementById('postitTitle');
        const contentInput = document.getElementById('postitContent');
        const colorSelect = document.getElementById('postitColor');

        if (!titleInput || !contentInput || !colorSelect) return;

        const title = titleInput.value.trim();
        const content = contentInput.value.trim();
        const color = colorSelect.value;

        if (!title && !content) {
            showNotification('O Post-it deve ter um título ou conteúdo! ⚠️', 'warning');
            return;
        }

        const postitIndex = this.postits.findIndex(p => p.id === postitId);
        if (postitIndex !== -1) {
            this.postits[postitIndex] = {
                ...this.postits[postitIndex],
                title: title || 'Sem título',
                content: content || '',
                color,
                updatedAt: new Date().toISOString()
            };

            this.savePostits();
            this.renderPostits();
            this.hidePostitEditor();

            showNotification('Post-it salvo com sucesso! 💾', 'success');
        }
    }

    editPostit(postitId) {
        const postit = this.postits.find(p => p.id === postitId);
        if (postit) {
            this.currentPostit = postit;
            this.isEditing = true;
            this.showPostitEditor(postit);
        }
    }

    deletePostit(postitId) {
        if (confirm('Tem certeza que deseja excluir este Post-it? 🗑️')) {
            this.postits = this.postits.filter(p => p.id !== postitId);
            this.savePostits();
            this.renderPostits();
            showNotification('Post-it excluído com sucesso! 🗑️', 'info');
        }
    }

    copyPostit(postitId) {
        const postit = this.postits.find(p => p.id === postitId);
        if (postit) {
            const textToCopy = `${postit.title}\n\n${postit.content}`;
            navigator.clipboard.writeText(textToCopy).then(() => {
                showNotification('Post-it copiado para a área de transferência! 📋', 'success');
            }).catch(() => {
                showNotification('Erro ao copiar Post-it! ❌', 'error');
            });
        }
    }

    clearAllPostits() {
        if (this.postits.length === 0) {
            showNotification('Não há Post-its para limpar! 📝', 'info');
            return;
        }

        if (confirm(`Tem certeza que deseja excluir todos os ${this.postits.length} Post-its? 🗑️`)) {
            this.postits = [];
            this.savePostits();
            this.renderPostits();
            showNotification('Todos os Post-its foram excluídos! 🗑️', 'info');
        }
    }

    renderPostits() {
        const container = document.getElementById('postitsContainer');
        if (!container) return;

        // Filtrar post-its do usuário atual
        const currentUserId = window.UtilityBox ? window.UtilityBox.currentUser()?.email : 'guest';
        const userPostits = this.postits.filter(postit => postit.userId === currentUserId);

        if (userPostits.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted p-5">
                    <i class="bi bi-sticky display-1"></i>
                    <h4 class="mt-3">Nenhum Post-it encontrado</h4>
                    <p class="text-muted">Clique no botão + para criar seu primeiro Post-it</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';

        userPostits.forEach(postit => {
            const postitElement = this.createPostitElement(postit);
            container.appendChild(postitElement);
        });
    }

    createPostitElement(postit) {
        const postitDiv = document.createElement('div');
        postitDiv.className = `postit ${postit.color} mb-3`;
        postitDiv.innerHTML = `
            <div class="postit-header d-flex justify-content-between align-items-start mb-2">
                <h6 class="postit-title mb-0">${postit.title || 'Sem título'}</h6>
                <div class="dropdown">
                    <button class="btn btn-sm btn-outline-dark dropdown-toggle" type="button" data-bs-toggle="dropdown">
                        <i class="bi bi-three-dots"></i>
                    </button>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item" href="#" onclick="postitManager.editPostit('${postit.id}')">
                            <i class="bi bi-pencil me-2"></i>Editar
                        </a></li>
                        <li><a class="dropdown-item" href="#" onclick="postitManager.copyPostit('${postit.id}')">
                            <i class="bi bi-clipboard me-2"></i>Copiar
                        </a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item text-danger" href="#" onclick="postitManager.deletePostit('${postit.id}')">
                            <i class="bi bi-trash me-2"></i>Excluir
                        </a></li>
                    </ul>
                </div>
            </div>
            ${postit.content ? `<div class="postit-content">${postit.content}</div>` : ''}
            <div class="postit-footer mt-2">
                <small class="text-muted">
                    <i class="bi bi-clock me-1"></i>${this.formatDate(postit.updatedAt)}
                </small>
            </div>
        `;

        return postitDiv;
    }

    savePostits() {
        try {
            localStorage.setItem('utilityBox-postits', JSON.stringify(this.postits));
        } catch (error) {
            console.error('Erro ao salvar Post-its:', error);
            showNotification('Erro ao salvar Post-its! ❌', 'error');
        }
    }

    loadPostits() {
        try {
            const savedPostits = localStorage.getItem('utilityBox-postits');
            if (savedPostits) {
                this.postits = JSON.parse(savedPostits);
            }
        } catch (error) {
            console.error('Erro ao carregar Post-its:', error);
            this.postits = [];
        }
    }

    exportPostits() {
        const currentUserId = window.UtilityBox ? window.UtilityBox.currentUser()?.email : 'guest';
        const userPostits = this.postits.filter(postit => postit.userId === currentUserId);

        if (userPostits.length === 0) {
            showNotification('Nenhum Post-it para exportar! ⚠️', 'warning');
            return;
        }

        const data = {
            postits: userPostits,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `postits-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        showNotification('Post-its exportados com sucesso! 📤', 'success');
    }

    importPostits(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.postits && Array.isArray(data.postits)) {
                    const currentUserId = window.UtilityBox ? window.UtilityBox.currentUser()?.email : 'guest';
                    
                    // Adicionar post-its importados
                    data.postits.forEach(postit => {
                        postit.id = this.generateId(); // Gerar novo ID
                        postit.userId = currentUserId; // Atribuir ao usuário atual
                        postit.importedAt = new Date().toISOString();
                    });
                    
                    this.postits = [...this.postits, ...data.postits];
                    this.savePostits();
                    this.renderPostits();
                    
                    showNotification(`${data.postits.length} Post-its importados com sucesso! 📥`, 'success');
                } else {
                    throw new Error('Formato de arquivo inválido');
                }
            } catch (error) {
                showNotification('Erro ao importar Post-its! ❌', 'error');
                console.error('Erro na importação:', error);
            }
        };
        reader.readAsText(file);
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
            return 'Hoje';
        } else if (diffDays === 2) {
            return 'Ontem';
        } else if (diffDays <= 7) {
            return `${diffDays - 1} dias atrás`;
        } else {
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }
    }
}

// ===== INICIALIZAÇÃO =====
let postitManager;

document.addEventListener('DOMContentLoaded', function() {
    postitManager = new PostItManager();
    
    // Exportar para escopo global
    window.postitManager = postitManager;
    window.loadPostits = () => postitManager.loadPostits();
    window.exportPostits = () => postitManager.exportPostits();
    window.importPostits = (file) => postitManager.importPostits(file);
});

// Exportar funções para o sistema de atalhos
window.postitsApp = {
    createNewPostit: () => postitManager?.createNewPostit(),
    editSelectedPostit: () => {
        // Implementar lógica para editar post-it selecionado
        const selectedPostit = document.querySelector('.postit.selected');
        if (selectedPostit) {
            const postitId = selectedPostit.dataset.postitId;
            if (postitId) {
                postitManager.editPostit(postitId);
            }
        }
    },
    copySelectedPostit: () => {
        // Implementar lógica para copiar post-it selecionado
        const selectedPostit = document.querySelector('.postit.selected');
        if (selectedPostit) {
            const postitId = selectedPostit.dataset.postitId;
            if (postitId) {
                postitManager.copyPostit(postitId);
            }
        }
    }
};