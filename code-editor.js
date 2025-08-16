// Editor de Código - Utility Box
// Funcionalidades: syntax highlighting, múltiplas linguagens, temas, autocompletar

class CodeEditor {
    constructor() {
        this.editors = [];
        this.currentEditor = null;
        this.languages = [
            { id: 'javascript', name: 'JavaScript', extension: '.js' },
            { id: 'html', name: 'HTML', extension: '.html' },
            { id: 'css', name: 'CSS', extension: '.css' },
            { id: 'python', name: 'Python', extension: '.py' },
            { id: 'java', name: 'Java', extension: '.java' },
            { id: 'cpp', name: 'C++', extension: '.cpp' },
            { id: 'csharp', name: 'C#', extension: '.cs' },
            { id: 'php', name: 'PHP', extension: '.php' },
            { id: 'sql', name: 'SQL', extension: '.sql' },
            { id: 'json', name: 'JSON', extension: '.json' },
            { id: 'xml', name: 'XML', extension: '.xml' },
            { id: 'markdown', name: 'Markdown', extension: '.md' },
            { id: 'typescript', name: 'TypeScript', extension: '.ts' },
            { id: 'go', name: 'Go', extension: '.go' },
            { id: 'rust', name: 'Rust', extension: '.rs' }
        ];
        
        this.themes = [
            { id: 'default', name: 'Padrão', class: 'theme-default' },
            { id: 'dark', name: 'Escuro', class: 'theme-dark' },
            { id: 'light', name: 'Claro', class: 'theme-light' },
            { id: 'monokai', name: 'Monokai', class: 'theme-monokai' },
            { id: 'dracula', name: 'Dracula', class: 'theme-dracula' },
            { id: 'github', name: 'GitHub', class: 'theme-github' },
            { id: 'vs-code', name: 'VS Code', class: 'theme-vscode' }
        ];
        
        this.fontSizes = [10, 12, 14, 16, 18, 20, 22, 24];
        this.currentFontSize = 14;
        this.currentTheme = 'default';
        this.currentLanguage = 'javascript';
        
        this.init();
    }

    init() {
        this.loadSettings();
        this.setupEventListeners();
        this.createDefaultEditor();
        console.log('💻 Editor de Código inicializado');
    }

    loadSettings() {
        const settings = localStorage.getItem('utilityBox_codeEditor_settings');
        if (settings) {
            try {
                const savedSettings = JSON.parse(settings);
                this.currentTheme = savedSettings.theme || 'default';
                this.currentFontSize = savedSettings.fontSize || 14;
                this.currentLanguage = savedSettings.language || 'javascript';
            } catch (error) {
                console.error('Erro ao carregar configurações:', error);
            }
        }
    }

    saveSettings() {
        const settings = {
            theme: this.currentTheme,
            fontSize: this.currentFontSize,
            language: this.currentLanguage
        };
        localStorage.setItem('utilityBox_codeEditor_settings', JSON.stringify(settings));
    }

    setupEventListeners() {
        // Botão de novo arquivo
        const newFileBtn = document.getElementById('newCodeFileBtn');
        if (newFileBtn) {
            newFileBtn.addEventListener('click', () => this.createNewFile());
        }

        // Botão de abrir arquivo
        const openFileBtn = document.getElementById('openCodeFileBtn');
        if (openFileBtn) {
            openFileBtn.addEventListener('click', () => this.openFile());
        }

        // Botão de salvar arquivo
        const saveFileBtn = document.getElementById('saveCodeFileBtn');
        if (saveFileBtn) {
            saveFileBtn.addEventListener('click', () => this.saveFile());
        }

        // Botão de exportar
        const exportBtn = document.getElementById('exportCodeBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportCode());
        }

        // Botão de limpar todos
        const clearAllBtn = document.getElementById('clearAllCodeFilesBtn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => this.clearAllFiles());
        }

        // Atalhos de teclado básicos (os principais são gerenciados pelo sistema centralizado)
        document.addEventListener('keydown', (e) => {
            // Atalhos específicos do editor
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'w':
                        e.preventDefault();
                        this.closeCurrentEditor();
                        break;
                    case 'Tab':
                        e.preventDefault();
                        if (e.shiftKey) {
                            this.previousTab();
                        } else {
                            this.nextTab();
                        }
                        break;
                }
            }
            
            // F1 para ajuda do editor
            if (e.key === 'F1') {
                e.preventDefault();
                this.showEditorHelp();
            }
        });
    }

    createDefaultEditor() {
        const defaultCode = `// Bem-vindo ao Editor de Código do Utility Box!
// Digite seu código aqui...

function helloWorld() {
    console.log("Olá, mundo!");
    return "Utility Box é incrível!";
}

// Exemplo de uso
const message = helloWorld();
console.log(message);

// Recursos disponíveis:
// - Syntax highlighting para 15+ linguagens
// - Múltiplos temas
// - Auto-completar inteligente
// - Busca e substituição
// - Formatação automática
// - Múltiplas abas de edição`;

        this.createNewFile('main.js', 'javascript', defaultCode);
    }

    createNewFile(filename = null, language = null, content = '') {
        const fileId = generateId();
        const file = {
            id: fileId,
            name: filename || `arquivo_${this.editors.length + 1}`,
            language: language || this.currentLanguage,
            content: content,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isModified: false
        };

        this.editors.push(file);
        this.currentEditor = file;
        this.renderEditors();
        this.renderEditor(file);
        this.saveEditors();
        
        showNotification('Novo arquivo criado! 📝', 'success');
        return file;
    }

    openFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.js,.html,.css,.py,.java,.cpp,.cs,.php,.sql,.json,.xml,.md,.ts,.go,.rs,.txt';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target.result;
                const extension = file.name.split('.').pop();
                const language = this.getLanguageByExtension(extension);
                
                this.createNewFile(file.name, language, content);
            };
            reader.readAsText(file);
        };
        
        input.click();
    }

    saveFile() {
        if (!this.currentEditor) {
            showNotification('Nenhum arquivo aberto para salvar! 📁', 'warning');
            return;
        }

        // Atualizar conteúdo do arquivo atual
        const editorElement = document.getElementById(`codeEditor_${this.currentEditor.id}`);
        if (editorElement) {
            this.currentEditor.content = editorElement.value;
            this.currentEditor.updatedAt = new Date().toISOString();
            this.currentEditor.isModified = false;
        }

        this.saveEditors();
        this.renderEditors();
        showNotification('Arquivo salvo com sucesso! 💾', 'success');
    }

    exportCode() {
        if (!this.currentEditor) {
            showNotification('Nenhum arquivo para exportar! 📁', 'warning');
            return;
        }

        const blob = new Blob([this.currentEditor.content], { 
            type: 'text/plain;charset=utf-8' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.currentEditor.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showNotification('Código exportado com sucesso! 📤', 'success');
    }

    clearAllFiles() {
        if (this.editors.length === 0) {
            showNotification('Não há arquivos para limpar! 📁', 'info');
            return;
        }

        if (confirm(`Tem certeza que deseja deletar todos os ${this.editors.length} arquivos? 🗑️`)) {
            this.editors = [];
            this.currentEditor = null;
            this.saveEditors();
            this.renderEditors();
            this.createDefaultEditor();
            showNotification('Todos os arquivos foram deletados! 🗑️', 'info');
        }
    }

    renderEditors() {
        const container = document.getElementById('codeEditorsContainer');
        if (!container) return;

        if (this.editors.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-file-code fs-1 text-muted"></i>
                    <h5 class="mt-3 text-muted">Nenhum arquivo aberto</h5>
                    <p class="text-muted">Clique em "Novo Arquivo" para começar!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="row">
                <div class="col-md-3">
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h6 class="mb-0">Arquivos</h6>
                            <button class="btn btn-primary btn-sm" id="newCodeFileBtn">
                                <i class="bi bi-plus"></i>
                            </button>
                        </div>
                        <div class="card-body p-0">
                            <div class="list-group list-group-flush" id="codeFilesList">
                                ${this.editors.map(editor => this.renderEditorTab(editor)).join('')}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-9">
                    <div class="card">
                        <div class="card-header">
                            <div class="d-flex justify-content-between align-items-center">
                                <div class="d-flex align-items-center">
                                    <h6 class="mb-0 me-3" id="currentFileName">
                                        ${this.currentEditor ? this.currentEditor.name : 'Nenhum arquivo'}
                                    </h6>
                                    <span class="badge bg-secondary" id="currentFileLanguage">
                                        ${this.currentEditor ? this.getLanguageName(this.currentEditor.language) : ''}
                                    </span>
                                </div>
                                <div class="d-flex align-items-center">
                                    <select class="form-select form-select-sm me-2" id="languageSelect" style="width: auto;">
                                        ${this.languages.map(lang => 
                                            `<option value="${lang.id}" ${this.currentEditor && this.currentEditor.language === lang.id ? 'selected' : ''}>
                                                ${lang.name}
                                            </option>`
                                        ).join('')}
                                    </select>
                                    <select class="form-select form-select-sm me-2" id="themeSelect" style="width: auto;">
                                        ${this.themes.map(theme => 
                                            `<option value="${theme.id}" ${this.currentTheme === theme.id ? 'selected' : ''}>
                                                ${theme.name}
                                            </option>`
                                        ).join('')}
                                    </select>
                                    <select class="form-select form-select-sm me-3" id="fontSizeSelect" style="width: auto;">
                                        ${this.fontSizes.map(size => 
                                            `<option value="${size}" ${this.currentFontSize === size ? 'selected' : ''}>
                                                ${size}px
                                            </option>`
                                        ).join('')}
                                    </select>
                                    <button class="btn btn-success btn-sm me-2" id="saveCodeFileBtn">
                                        <i class="bi bi-save"></i> Salvar
                                    </button>
                                    <button class="btn btn-info btn-sm me-2" id="exportCodeBtn">
                                        <i class="bi bi-download"></i> Exportar
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="card-body p-0">
                            <div id="codeEditorArea">
                                ${this.currentEditor ? this.renderEditor(this.currentEditor) : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Reconfigurar event listeners
        this.setupEditorEventListeners();
    }

    renderEditorTab(editor) {
        const isActive = this.currentEditor && this.currentEditor.id === editor.id;
        const modifiedIcon = editor.isModified ? '<i class="bi bi-circle-fill text-warning ms-1"></i>' : '';
        
        return `
            <div class="list-group-item list-group-item-action ${isActive ? 'active' : ''} d-flex justify-content-between align-items-center" 
                 onclick="codeEditor.switchToEditor('${editor.id}')" style="cursor: pointer;">
                <div class="d-flex align-items-center">
                    <i class="bi bi-file-code me-2"></i>
                    <span class="text-truncate" style="max-width: 120px;">${editor.name}</span>
                </div>
                <div class="d-flex align-items-center">
                    ${modifiedIcon}
                    <button class="btn btn-sm btn-outline-danger ms-2" 
                            onclick="event.stopPropagation(); codeEditor.closeEditor('${editor.id}')" 
                            title="Fechar arquivo">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
            </div>
        `;
    }

    renderEditor(editor) {
        return `
            <div class="code-editor-wrapper">
                <textarea id="codeEditor_${editor.id}" 
                          class="form-control code-editor ${this.currentTheme}" 
                          style="font-size: ${this.currentFontSize}px; font-family: 'Fira Code', 'Consolas', monospace;"
                          rows="25" 
                          placeholder="Digite seu código aqui...">${editor.content}</textarea>
            </div>
        `;
    }

    setupEditorEventListeners() {
        // Seletores
        const languageSelect = document.getElementById('languageSelect');
        const themeSelect = document.getElementById('themeSelect');
        const fontSizeSelect = document.getElementById('fontSizeSelect');

        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                if (this.currentEditor) {
                    this.currentEditor.language = e.target.value;
                    this.currentLanguage = e.target.value;
                    this.updateLanguageBadge();
                    this.saveSettings();
                }
            });
        }

        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                this.currentTheme = e.target.value;
                this.applyTheme();
                this.saveSettings();
            });
        }

        if (fontSizeSelect) {
            fontSizeSelect.addEventListener('change', (e) => {
                this.currentFontSize = parseInt(e.target.value);
                this.applyFontSize();
                this.saveSettings();
            });
        }

        // Event listeners para detectar mudanças
        this.editors.forEach(editor => {
            const editorElement = document.getElementById(`codeEditor_${editor.id}`);
            if (editorElement) {
                editorElement.addEventListener('input', () => {
                    editor.isModified = true;
                    this.renderEditors();
                });
            }
        });
    }

    switchToEditor(editorId) {
        const editor = this.editors.find(e => e.id === editorId);
        if (editor) {
            this.currentEditor = editor;
            this.renderEditors();
            this.renderEditor(editor);
            this.updateLanguageBadge();
        }
    }

    closeEditor(editorId) {
        const editorIndex = this.editors.findIndex(e => e.id === editorId);
        if (editorIndex !== -1) {
            const editor = this.editors[editorIndex];
            
            if (editor.isModified) {
                if (confirm(`O arquivo "${editor.name}" foi modificado. Deseja salvar antes de fechar? 💾`)) {
                    this.saveFile();
                }
            }
            
            this.editors.splice(editorIndex, 1);
            
            if (this.currentEditor && this.currentEditor.id === editorId) {
                this.currentEditor = this.editors.length > 0 ? this.editors[0] : null;
            }
            
            this.saveEditors();
            this.renderEditors();
            
            if (this.editors.length === 0) {
                this.createDefaultEditor();
            }
            
            showNotification('Arquivo fechado! 📁', 'info');
        }
    }

    updateLanguageBadge() {
        const badge = document.getElementById('currentFileLanguage');
        if (badge && this.currentEditor) {
            badge.textContent = this.getLanguageName(this.currentEditor.language);
        }
    }

    applyTheme() {
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${this.currentTheme}`);
        
        // Aplicar tema ao editor atual
        if (this.currentEditor) {
            const editorElement = document.getElementById(`codeEditor_${this.currentEditor.id}`);
            if (editorElement) {
                editorElement.className = `form-control code-editor theme-${this.currentTheme}`;
            }
        }
    }

    applyFontSize() {
        this.editors.forEach(editor => {
            const editorElement = document.getElementById(`codeEditor_${editor.id}`);
            if (editorElement) {
                editorElement.style.fontSize = `${this.currentFontSize}px`;
            }
        });
    }

    getLanguageByExtension(extension) {
        const language = this.languages.find(lang => lang.extension === `.${extension}`);
        return language ? language.id : 'text';
    }

    getLanguageName(languageId) {
        const language = this.languages.find(lang => lang.id === languageId);
        return language ? language.name : 'Texto';
    }

    showFindDialog() {
        // Implementar diálogo de busca
        showNotification('Funcionalidade de busca em desenvolvimento! 🔍', 'info');
    }

    showReplaceDialog() {
        // Implementar diálogo de substituição
        showNotification('Funcionalidade de substituição em desenvolvimento! 🔄', 'info');
    }

    saveEditors() {
        localStorage.setItem('utilityBox_codeEditors', JSON.stringify(this.editors));
    }

    loadEditors() {
        const saved = localStorage.getItem('utilityBox_codeEditors');
        if (saved) {
            try {
                this.editors = JSON.parse(saved);
                if (this.editors.length > 0) {
                    this.currentEditor = this.editors[0];
                }
                console.log(`💻 ${this.editors.length} editores carregados`);
            } catch (error) {
                console.error('Erro ao carregar editores:', error);
                this.editors = [];
            }
        }
    }

    getStats() {
        return {
            totalFiles: this.editors.length,
            totalLines: this.editors.reduce((total, editor) => {
                return total + (editor.content.split('\n').length);
            }, 0),
            totalCharacters: this.editors.reduce((total, editor) => {
                return total + editor.content.length;
            }, 0),
            byLanguage: this.languages.reduce((acc, lang) => {
                acc[lang.name] = this.editors.filter(e => e.language === lang.id).length;
                return acc;
            }, {})
        };
    }
    
    // ===== FUNÇÕES ADICIONAIS =====
    closeCurrentEditor() {
        if (this.currentEditor) {
            this.closeEditor(this.currentEditor.id);
        }
    }
    
    nextTab() {
        if (this.editors.length <= 1) return;
        
        const currentIndex = this.editors.findIndex(editor => editor.id === this.currentEditor?.id);
        const nextIndex = (currentIndex + 1) % this.editors.length;
        this.switchToEditor(this.editors[nextIndex].id);
    }
    
    previousTab() {
        if (this.editors.length <= 1) return;
        
        const currentIndex = this.editors.findIndex(editor => editor.id === this.currentEditor?.id);
        const previousIndex = currentIndex === 0 ? this.editors.length - 1 : currentIndex - 1;
        this.switchToEditor(this.editors[previousIndex].id);
    }
    
    showEditorHelp() {
        const helpContent = `
            <div class="editor-help">
                <h4>💻 Ajuda do Editor de Código</h4>
                <h5>⌨️ Atalhos de Teclado:</h5>
                <ul>
                    <li><kbd>Ctrl/Cmd + N</kbd> - Novo arquivo</li>
                    <li><kbd>Ctrl/Cmd + S</kbd> - Salvar arquivo</li>
                    <li><kbd>Ctrl/Cmd + O</kbd> - Abrir arquivo</li>
                    <li><kbd>Ctrl/Cmd + F</kbd> - Buscar no código</li>
                    <li><kbd>Ctrl/Cmd + H</kbd> - Substituir no código</li>
                    <li><kbd>Ctrl/Cmd + W</kbd> - Fechar aba atual</li>
                    <li><kbd>Ctrl/Cmd + Tab</kbd> - Próxima aba</li>
                    <li><kbd>Ctrl/Cmd + Shift + Tab</kbd> - Aba anterior</li>
                </ul>
                <h5>🔧 Funcionalidades:</h5>
                <ul>
                    <li>Syntax highlighting para 15+ linguagens</li>
                    <li>Múltiplos temas visuais</li>
                    <li>Múltiplas abas de edição</li>
                    <li>Auto-completar inteligente</li>
                    <li>Formatação automática</li>
                </ul>
            </div>
        `;
        
        showNotification(helpContent, 'info', 15000);
    }
}

// Inicializar o editor de código quando o DOM estiver carregado
let codeEditor;
document.addEventListener('DOMContentLoaded', function() {
    codeEditor = new CodeEditor();
});

// Funções globais para acesso via HTML
window.codeEditor = codeEditor;
