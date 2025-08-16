// ===== UTILITY BOX - SISTEMA DE ATALHOS DE TECLADO =====

class KeyboardShortcuts {
    constructor() {
        this.shortcuts = new Map();
        this.isEnabled = true;
        this.init();
    }

    init() {
        this.setupGlobalShortcuts();
        this.setupToolSpecificShortcuts();
        this.setupEventListeners();
        console.log('⌨️ Sistema de atalhos de teclado inicializado');
    }

    // ===== ATALHOS GLOBAIS =====
    setupGlobalShortcuts() {
        // Navegação entre abas
        this.addShortcut('Ctrl/Cmd + 1-5', 'Navegar entre abas', (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key >= '1' && event.key <= '5') {
                event.preventDefault();
                const tabIndex = parseInt(event.key) - 1;
                const tabs = document.querySelectorAll('[data-bs-toggle="tab"]');
                
                if (tabs[tabIndex]) {
                    const tab = new bootstrap.Tab(tabs[tabIndex]);
                    tab.show();
                }
            }
        });

        // Fechar modais
        this.addShortcut('Esc', 'Fechar modais', (event) => {
            if (event.key === 'Escape') {
                const openModals = document.querySelectorAll('.modal.show');
                openModals.forEach(modal => {
                    const modalInstance = bootstrap.Modal.getInstance(modal);
                    if (modalInstance) {
                        modalInstance.hide();
                    }
                });
            }
        });

        // Alternar tema
        this.addShortcut('Ctrl/Cmd + T', 'Alternar tema claro/escuro', (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 't') {
                event.preventDefault();
                const themeToggle = document.getElementById('darkModeToggle');
                if (themeToggle) {
                    themeToggle.checked = !themeToggle.checked;
                    themeToggle.dispatchEvent(new Event('change'));
                }
            }
        });

        // Sincronização manual
        this.addShortcut('Ctrl/Cmd + Shift + S', 'Sincronização manual', (event) => {
            if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'S') {
                event.preventDefault();
                if (window.utilityBoxAPI) {
                    window.utilityBoxAPI.manualSync();
                }
            }
        });

        // Ajuda
        this.addShortcut('F1', 'Mostrar ajuda', (event) => {
            if (event.key === 'F1') {
                event.preventDefault();
                this.showHelp();
            }
        });

        // Atalhos de contexto
        this.addShortcut('Ctrl/Cmd + /', 'Mostrar atalhos', (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === '/') {
                event.preventDefault();
                this.showShortcutsList();
            }
        });
    }

    // ===== ATALHOS ESPECÍFICOS DAS FERRAMENTAS =====
    setupToolSpecificShortcuts() {
        // ===== BLOCOS DE NOTAS =====
        this.addShortcut('Ctrl/Cmd + S (Notas)', 'Salvar nota atual', (event) => {
            if (this.isActiveTab('notes') && (event.ctrlKey || event.metaKey) && event.key === 's') {
                event.preventDefault();
                if (window.notesApp && window.notesApp.saveCurrentNote) {
                    window.notesApp.saveCurrentNote();
                }
            }
        });

        this.addShortcut('Ctrl/Cmd + N (Notas)', 'Nova nota', (event) => {
            if (this.isActiveTab('notes') && (event.ctrlKey || event.metaKey) && event.key === 'n') {
                event.preventDefault();
                if (window.notesApp && window.notesApp.createNewNote) {
                    window.notesApp.createNewNote();
                }
            }
        });

        this.addShortcut('Ctrl/Cmd + D (Notas)', 'Duplicar nota atual', (event) => {
            if (this.isActiveTab('notes') && (event.ctrlKey || event.metaKey) && event.key === 'd') {
                event.preventDefault();
                if (window.notesApp && window.notesApp.duplicateCurrentNote) {
                    window.notesApp.duplicateCurrentNote();
                }
            }
        });

        this.addShortcut('Delete (Notas)', 'Excluir nota atual', (event) => {
            if (this.isActiveTab('notes') && event.key === 'Delete') {
                event.preventDefault();
                if (window.notesApp && window.notesApp.deleteCurrentNote) {
                    window.notesApp.deleteCurrentNote();
                }
            }
        });

        // ===== CALCULADORA =====
        this.addShortcut('Ctrl/Cmd + H (Calculadora)', 'Alternar histórico', (event) => {
            if (this.isActiveTab('calculator') && (event.ctrlKey || event.metaKey) && event.key === 'h') {
                event.preventDefault();
                if (window.calculatorApp && window.calculatorApp.toggleHistory) {
                    window.calculatorApp.toggleHistory();
                }
            }
        });

        this.addShortcut('C (Calculadora)', 'Limpar calculadora', (event) => {
            if (this.isActiveTab('calculator') && (event.key === 'c' || event.key === 'C')) {
                event.preventDefault();
                if (window.calculatorApp && window.calculatorApp.clear) {
                    window.calculatorApp.clear();
                }
            }
        });

        // ===== POST-ITS =====
        this.addShortcut('Ctrl/Cmd + N (Post-its)', 'Novo Post-it', (event) => {
            if (this.isActiveTab('postits') && (event.ctrlKey || event.metaKey) && event.key === 'n') {
                event.preventDefault();
                if (window.postitsApp && window.postitsApp.createNewPostit) {
                    window.postitsApp.createNewPostit();
                }
            }
        });

        this.addShortcut('Ctrl/Cmd + E (Post-its)', 'Editar Post-it selecionado', (event) => {
            if (this.isActiveTab('postits') && (event.ctrlKey || event.metaKey) && event.key === 'e') {
                event.preventDefault();
                if (window.postitsApp && window.postitsApp.editSelectedPostit) {
                    window.postitsApp.editSelectedPostit();
                }
            }
        });

        this.addShortcut('Ctrl/Cmd + C (Post-its)', 'Copiar Post-it selecionado', (event) => {
            if (this.isActiveTab('postits') && (event.ctrlKey || event.metaKey) && event.key === 'c') {
                event.preventDefault();
                if (window.postitsApp && window.postitsApp.copySelectedPostit) {
                    window.postitsApp.copySelectedPostit();
                }
            }
        });

        // ===== TAREFAS =====
        this.addShortcut('Ctrl/Cmd + T (Tarefas)', 'Nova tarefa', (event) => {
            if (this.isActiveTab('tasks') && (event.ctrlKey || event.metaKey) && event.key === 't') {
                event.preventDefault();
                if (window.tasksApp && window.tasksApp.showTaskModal) {
                    window.tasksApp.showTaskModal();
                }
            }
        });

        this.addShortcut('Ctrl/Cmd + S (Tarefas)', 'Salvar tarefa atual', (event) => {
            if (this.isActiveTab('tasks') && (event.ctrlKey || event.metaKey) && event.key === 's') {
                event.preventDefault();
                if (window.tasksApp && window.tasksApp.saveCurrentTask) {
                    window.tasksApp.saveCurrentTask();
                }
            }
        });

        // ===== EDITOR DE CÓDIGO =====
        this.addShortcut('Ctrl/Cmd + N (Editor)', 'Novo arquivo', (event) => {
            if (this.isActiveTab('code-editor') && (event.ctrlKey || event.metaKey) && event.key === 'n') {
                event.preventDefault();
                if (window.codeEditorApp && window.codeEditorApp.newFile) {
                    window.codeEditorApp.newFile();
                }
            }
        });

        this.addShortcut('Ctrl/Cmd + S (Editor)', 'Salvar arquivo', (event) => {
            if (this.isActiveTab('code-editor') && (event.ctrlKey || event.metaKey) && event.key === 's') {
                event.preventDefault();
                if (window.codeEditorApp && window.codeEditorApp.saveFile) {
                    window.codeEditorApp.saveFile();
                }
            }
        });

        this.addShortcut('Ctrl/Cmd + O (Editor)', 'Abrir arquivo', (event) => {
            if (this.isActiveTab('code-editor') && (event.ctrlKey || event.metaKey) && event.key === 'o') {
                event.preventDefault();
                if (window.codeEditorApp && window.codeEditorApp.openFile) {
                    window.codeEditorApp.openFile();
                }
            }
        });

        this.addShortcut('Ctrl/Cmd + F (Editor)', 'Buscar no código', (event) => {
            if (this.isActiveTab('code-editor') && (event.ctrlKey || event.metaKey) && event.key === 'f') {
                event.preventDefault();
                if (window.codeEditorApp && window.codeEditorApp.findInCode) {
                    window.codeEditorApp.findInCode();
                }
            }
        });

        this.addShortcut('Ctrl/Cmd + H (Editor)', 'Substituir no código', (event) => {
            if (this.isActiveTab('code-editor') && (event.ctrlKey || event.metaKey) && event.key === 'h') {
                event.preventDefault();
                if (window.codeEditorApp && window.codeEditorApp.replaceInCode) {
                    window.codeEditorApp.replaceInCode();
                }
            }
        });

        this.addShortcut('Ctrl/Cmd + W (Editor)', 'Fechar editor atual', (event) => {
            if (this.isActiveTab('code-editor') && (event.ctrlKey || event.metaKey) && event.key === 'w') {
                event.preventDefault();
                if (window.codeEditorApp && window.codeEditorApp.closeCurrentEditor) {
                    window.codeEditorApp.closeCurrentEditor();
                }
            }
        });

        this.addShortcut('Ctrl/Cmd + Tab (Editor)', 'Próxima aba', (event) => {
            if (this.isActiveTab('code-editor') && (event.ctrlKey || event.metaKey) && event.key === 'Tab') {
                event.preventDefault();
                if (window.codeEditorApp && window.codeEditorApp.nextTab) {
                    window.codeEditorApp.nextTab();
                }
            }
        });

        this.addShortcut('Ctrl/Cmd + Shift + Tab (Editor)', 'Aba anterior', (event) => {
            if (this.isActiveTab('code-editor') && (event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'Tab') {
                event.preventDefault();
                if (window.codeEditorApp && window.codeEditorApp.previousTab) {
                    window.codeEditorApp.previousTab();
                }
            }
        });

        this.addShortcut('F1 (Editor)', 'Ajuda do editor', (event) => {
            if (this.isActiveTab('code-editor') && event.key === 'F1') {
                event.preventDefault();
                if (window.codeEditorApp && window.codeEditorApp.showEditorHelp) {
                    window.codeEditorApp.showEditorHelp();
                }
            }
        });
    }

    // ===== FUNÇÕES AUXILIARES =====
    addShortcut(key, description, handler) {
        this.shortcuts.set(key, { description, handler });
    }

    isActiveTab(tabId) {
        const activeTab = document.querySelector('.tab-pane.active');
        return activeTab && activeTab.id === tabId;
    }

    focusSearchInput(inputId) {
        const input = document.getElementById(inputId);
        if (input) {
            input.focus();
            input.select();
        }
    }

    toggleCalculatorHistory() {
        if (window.calculatorApp && window.calculatorApp.toggleHistory) {
            window.calculatorApp.toggleHistory();
        }
    }

    editSelectedPostit() {
        if (window.postitsApp && window.postitsApp.editSelectedPostit) {
            window.postitsApp.editSelectedPostit();
        }
    }

    copySelectedPostit() {
        if (window.postitsApp && window.postitsApp.copySelectedPostit) {
            window.postitsApp.copySelectedPostit();
        }
    }

    saveCurrentTask() {
        if (window.tasksApp && window.tasksApp.saveCurrentTask) {
            window.tasksApp.saveCurrentTask();
        }
    }

    showCategoryFilter() {
        // Implementar filtro de categorias para tarefas
        showNotification('Filtro de categorias em desenvolvimento! 🔧', 'info');
    }

    triggerImport() {
        // Implementar importação genérica
        showNotification('Importação genérica em desenvolvimento! 🔧', 'info');
    }

    showHelp() {
        const helpMessage = `
            🆘 **Ajuda do Utility Box**
            
            **Atalhos Globais:**
            • Ctrl/Cmd + 1-6: Navegar entre abas
            • Esc: Fechar modais
            • Ctrl/Cmd + T: Alternar tema
            • Ctrl/Cmd + Shift + S: Sincronização manual
            • F1: Esta ajuda
            • Ctrl/Cmd + /: Lista de atalhos
            
            **Ferramentas Específicas:**
            • Cada ferramenta tem seus próprios atalhos
            • Use Ctrl/Cmd + / para ver todos os atalhos
            
            **Dica:** Os atalhos são contextuais e só funcionam na aba ativa!
        `;
        
        showNotification(helpMessage, 'info', 8000);
    }

    showShortcutsList() {
        let shortcutsList = '⌨️ **Lista Completa de Atalhos**\n\n';
        
        this.shortcuts.forEach((shortcut, key) => {
            shortcutsList += `**${key}:** ${shortcut.description}\n`;
        });
        
        shortcutsList += '\n💡 **Dica:** Os atalhos são contextuais!';
        
        showNotification(shortcutsList, 'info', 10000);
    }

    // ===== EVENT LISTENERS =====
    setupEventListeners() {
        document.addEventListener('keydown', (event) => {
            // Verificar se os atalhos estão habilitados
            if (!this.isEnabled) return;
            
            // Permitir teclas básicas de edição sempre
            if (['Backspace', 'Delete', 'Tab', 'Enter', 'Escape'].includes(event.key)) {
                return;
            }
            
            // Verificar se o usuário está digitando em um campo de texto
            if (this.isTextInput(event.target)) return;
            
            // Processar atalhos
            this.shortcuts.forEach((shortcut, key) => {
                try {
                    shortcut.handler(event);
                } catch (error) {
                    console.error(`Erro no atalho ${key}:`, error);
                }
            });
        });
    }

    isTextInput(element) {
        if (!element) return false;
        
        const tagName = element.tagName.toLowerCase();
        const type = element.type?.toLowerCase();
        
        // Campos de texto
        if (tagName === 'input' && ['text', 'email', 'password', 'search', 'url', 'tel'].includes(type)) {
            return true;
        }
        
        // Áreas de texto
        if (tagName === 'textarea') {
            return true;
        }
        
        // Campos editáveis
        if (element.contentEditable === 'true') {
            return true;
        }
        
        // Permitir Backspace e Delete em qualquer lugar
        return false;
    }

    // ===== CONTROLE DO SISTEMA =====
    enable() {
        this.isEnabled = true;
        console.log('⌨️ Sistema de atalhos habilitado');
        showNotification('Atalhos de teclado habilitados! ⌨️', 'success');
    }

    disable() {
        this.isEnabled = false;
        console.log('⌨️ Sistema de atalhos desabilitado');
        showNotification('Atalhos de teclado desabilitados! 🔇', 'warning');
    }

    toggle() {
        if (this.isEnabled) {
            this.disable();
        } else {
            this.enable();
        }
    }

    getStats() {
        return {
            total: this.shortcuts.size,
            enabled: this.isEnabled,
            shortcuts: Array.from(this.shortcuts.keys())
        };
    }
}

// ===== INICIALIZAÇÃO =====
let keyboardShortcuts;

document.addEventListener('DOMContentLoaded', function() {
    keyboardShortcuts = new KeyboardShortcuts();
    
    // Exportar para escopo global
    window.KeyboardShortcuts = KeyboardShortcuts;
    window.keyboardShortcuts = keyboardShortcuts;
});

console.log('✅ Sistema de atalhos de teclado carregado!');
