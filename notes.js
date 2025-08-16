// ===== SISTEMA DE BLOCOS DE NOTAS =====

// Variáveis globais
let notes = [];
let currentNoteId = null;
let autoSaveTimeout = null;

// Elementos do DOM
const notesList = document.getElementById('notesList');
const noteTitle = document.getElementById('noteTitle');
const noteContent = document.getElementById('noteContent');
const currentNoteTitle = document.getElementById('currentNoteTitle');
const newNoteBtn = document.getElementById('newNoteBtn');
const saveNoteBtn = document.getElementById('saveNoteBtn');
const deleteNoteBtn = document.getElementById('deleteNoteBtn');

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    if (newNoteBtn) {
        setupNotesEventListeners();
        loadNotes();
    }
});

// ===== CONFIGURAÇÃO DE EVENT LISTENERS =====
function setupNotesEventListeners() {
    // Botão nova nota
    if (newNoteBtn) {
        newNoteBtn.addEventListener('click', createNewNote);
    }
    
    // Botão salvar
    if (saveNoteBtn) {
        saveNoteBtn.addEventListener('click', saveCurrentNote);
    }
    
    // Botão excluir
    if (deleteNoteBtn) {
        deleteNoteBtn.addEventListener('click', deleteCurrentNote);
    }
    
    // Campos de entrada
    if (noteTitle) {
        noteTitle.addEventListener('input', handleNoteChange);
        noteTitle.addEventListener('keydown', handleNoteKeydown);
    }
    
    if (noteContent) {
        noteContent.addEventListener('input', handleNoteChange);
        noteContent.addEventListener('keydown', handleNoteKeydown);
    }
}

// ===== FUNÇÕES PRINCIPAIS =====
function createNewNote() {
    // Salvar nota atual se houver mudanças
    if (hasUnsavedChanges()) {
        if (confirm('Deseja salvar as mudanças na nota atual?')) {
            saveCurrentNote();
        }
    }
    
    // Limpar campos
    clearNoteFields();
    
    // Criar nova nota
    currentNoteId = null;
    currentNoteTitle.textContent = 'Nova Nota';
    
    // Focar no título
    if (noteTitle) {
        noteTitle.focus();
    }
    
    // Atualizar interface
    updateNotesInterface();
    
    showNotification('Nova nota criada! 📝', 'info');
}

function saveCurrentNote() {
    const title = noteTitle ? noteTitle.value.trim() : '';
    const content = noteContent ? noteContent.value.trim() : '';
    
    if (!title && !content) {
        showNotification('A nota deve ter um título ou conteúdo! ⚠️', 'warning');
        return;
    }
    
    if (currentNoteId) {
        // Atualizar nota existente
        updateNote(currentNoteId, title, content);
    } else {
        // Criar nova nota
        createNote(title, content);
    }
    
    // Limpar timeout de auto-save
    if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = null;
    }
    
    showNotification('Nota salva com sucesso! 💾', 'success');
}

function deleteCurrentNote() {
    if (!currentNoteId) {
        showNotification('Nenhuma nota selecionada para excluir! ⚠️', 'warning');
        return;
    }
    
    if (confirm('Tem certeza que deseja excluir esta nota? Esta ação não pode ser desfeita.')) {
        deleteNote(currentNoteId);
        showNotification('Nota excluída com sucesso! 🗑️', 'info');
    }
}

// ===== GESTÃO DE NOTAS =====
function createNote(title, content) {
    const note = {
        id: generateId(),
        title: title || 'Sem título',
        content: content || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: window.UtilityBox ? window.UtilityBox.currentUser()?.email : 'guest'
    };
    
    notes.push(note);
    currentNoteId = note.id;
    
    // Salvar no localStorage
    saveNotesToStorage();
    
    // Atualizar interface
    updateNotesInterface();
    displayNote(note);
    
    return note;
}

function updateNote(id, title, content) {
    const noteIndex = notes.findIndex(note => note.id === id);
    
    if (noteIndex !== -1) {
        notes[noteIndex].title = title || 'Sem título';
        notes[noteIndex].content = content || '';
        notes[noteIndex].updatedAt = new Date().toISOString();
        
        // Salvar no localStorage
        saveNotesToStorage();
        
        // Atualizar interface
        updateNotesInterface();
        displayNote(notes[noteIndex]);
        
        return notes[noteIndex];
    }
    
    return null;
}

function deleteNote(id) {
    notes = notes.filter(note => note.id !== id);
    
    // Salvar no localStorage
    saveNotesToStorage();
    
    // Limpar campos se a nota excluída era a atual
    if (currentNoteId === id) {
        clearNoteFields();
        currentNoteId = null;
        currentNoteTitle.textContent = 'Nova Nota';
    }
    
    // Atualizar interface
    updateNotesInterface();
}

function getNote(id) {
    return notes.find(note => note.id === id);
}

// ===== INTERFACE DO USUÁRIO =====
function updateNotesInterface() {
    if (!notesList) return;
    
    // Limpar lista
    notesList.innerHTML = '';
    
    // Filtrar notas do usuário atual
    const currentUserId = window.UtilityBox ? window.UtilityBox.currentUser()?.email : 'guest';
    const userNotes = notes.filter(note => note.userId === currentUserId);
    
    if (userNotes.length === 0) {
        notesList.innerHTML = `
            <div class="text-center text-muted p-3">
                <i class="bi bi-journal-text display-6"></i>
                <p class="mt-2">Nenhuma nota encontrada</p>
                <small>Clique no botão + para criar sua primeira nota</small>
            </div>
        `;
        return;
    }
    
    // Ordenar notas por data de atualização (mais recentes primeiro)
    userNotes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    // Criar itens da lista
    userNotes.forEach(note => {
        const noteItem = createNoteListItem(note);
        notesList.appendChild(noteItem);
    });
}

function createNoteListItem(note) {
    const item = document.createElement('div');
    item.className = 'list-group-item note-item';
    item.dataset.noteId = note.id;
    
    // Marcar como ativa se for a nota atual
    if (currentNoteId === note.id) {
        item.classList.add('active');
    }
    
    // Formatar data
    const date = new Date(note.updatedAt);
    const formattedDate = formatDate(date);
    
    // Truncar título se for muito longo
    const displayTitle = note.title.length > 30 ? note.title.substring(0, 30) + '...' : note.title;
    
    // Truncar conteúdo se for muito longo
    const displayContent = note.content.length > 50 ? note.content.substring(0, 50) + '...' : note.content;
    
    item.innerHTML = `
        <div class="note-title">${displayTitle}</div>
        <div class="note-content text-muted small">${displayContent}</div>
        <div class="note-date">${formattedDate}</div>
    `;
    
    // Event listener para selecionar nota
    item.addEventListener('click', () => selectNote(note.id));
    
    return item;
}

function displayNote(note) {
    if (!note) return;
    
    // Atualizar campos
    if (noteTitle) noteTitle.value = note.title;
    if (noteContent) noteContent.value = note.content;
    
    // Atualizar título da aba
    if (currentNoteTitle) {
        currentNoteTitle.textContent = note.title || 'Sem título';
    }
    
    // Marcar nota como selecionada na lista
    updateSelectedNoteInList(note.id);
    
    // Atualizar título da página
    document.title = `${note.title || 'Sem título'} - Bloco de Notas - Utility Box`;
}

function selectNote(noteId) {
    const note = getNote(noteId);
    if (!note) return;
    
    // Salvar nota atual se houver mudanças
    if (hasUnsavedChanges()) {
        if (confirm('Deseja salvar as mudanças na nota atual?')) {
            saveCurrentNote();
        }
    }
    
    // Selecionar nova nota
    currentNoteId = noteId;
    displayNote(note);
    
    // Focar no conteúdo
    if (noteContent) {
        noteContent.focus();
    }
}

function updateSelectedNoteInList(noteId) {
    // Remover seleção anterior
    const previousSelected = notesList.querySelector('.note-item.active');
    if (previousSelected) {
        previousSelected.classList.remove('active');
    }
    
    // Selecionar nova nota
    const newSelected = notesList.querySelector(`[data-note-id="${noteId}"]`);
    if (newSelected) {
        newSelected.classList.add('active');
    }
}

function clearNoteFields() {
    if (noteTitle) noteTitle.value = '';
    if (noteContent) noteContent.value = '';
    currentNoteId = null;
}

// ===== AUTO-SAVE =====
function handleNoteChange() {
    // Configurar auto-save após 2 segundos de inatividade
    if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
    }
    
    autoSaveTimeout = setTimeout(() => {
        if (hasUnsavedChanges()) {
            autoSaveNote();
        }
    }, 2000);
}

function autoSaveNote() {
    const title = noteTitle ? noteTitle.value.trim() : '';
    const content = noteContent ? noteContent.value.trim() : '';
    
    if (title || content) {
        if (currentNoteId) {
            updateNote(currentNoteId, title, content);
        } else {
            createNote(title, content);
        }
        
        showNotification('Nota salva automaticamente! 💾', 'info', 2000);
    }
}

function hasUnsavedChanges() {
    if (!currentNoteId) {
        const title = noteTitle ? noteTitle.value.trim() : '';
        const content = noteContent ? noteContent.value.trim() : '';
        return title || content;
    }
    
    const currentNote = getNote(currentNoteId);
    if (!currentNote) return false;
    
    const currentTitle = noteTitle ? noteTitle.value.trim() : '';
    const currentContent = noteContent ? noteContent.value.trim() : '';
    
    return currentTitle !== currentNote.title || currentContent !== currentNote.content;
}

// ===== ATALHOS DE TECLADO =====
function handleNoteKeydown(event) {
    // Tab para navegar entre campos
    if (event.key === 'Tab') {
        if (event.target === noteTitle && !event.shiftKey) {
            event.preventDefault();
            if (noteContent) noteContent.focus();
        } else if (event.target === noteContent && event.shiftKey) {
            event.preventDefault();
            if (noteTitle) noteTitle.focus();
        }
    }
    
    // Enter para salvar (quando pressionado no título)
    if (event.key === 'Enter' && event.target === noteTitle) {
        event.preventDefault();
        saveCurrentNote();
    }
    
    // Ctrl/Cmd + Enter para nova nota
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        createNewNote();
    }
    
    // Garantir que Backspace e Delete funcionem sempre
    if (event.key === 'Backspace' || event.key === 'Delete') {
        // Permitir comportamento padrão
        return;
    }
}

// ===== PERSISTÊNCIA =====
function saveNotesToStorage() {
    try {
        localStorage.setItem('utilityBox-notes', JSON.stringify(notes));
    } catch (error) {
        console.error('Erro ao salvar notas:', error);
        showNotification('Erro ao salvar notas no navegador! ⚠️', 'error');
    }
}

function loadNotes() {
    try {
        const savedNotes = localStorage.getItem('utilityBox-notes');
        if (savedNotes) {
            notes = JSON.parse(savedNotes);
        }
    } catch (error) {
        console.error('Erro ao carregar notas:', error);
        notes = [];
    }
    
    // Atualizar interface
    updateNotesInterface();
}

// ===== FUNÇÕES DE UTILIDADE =====
function formatDate(date) {
    if (typeof date === 'string') {
        date = new Date(date);
    }
    
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

// ===== FUNÇÕES ADICIONAIS =====
function duplicateCurrentNote() {
    if (!currentNoteId) {
        showNotification('Nenhuma nota selecionada para duplicar! ⚠️', 'warning');
        return;
    }
    
    const currentNote = getNote(currentNoteId);
    if (!currentNote) return;
    
    const duplicatedNote = {
        id: generateId(),
        title: `${currentNote.title} (Cópia)`,
        content: currentNote.content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: window.UtilityBox ? window.UtilityBox.currentUser()?.email : 'guest'
    };
    
    notes.unshift(duplicatedNote);
    saveNotesToStorage();
    updateNotesInterface();
    
    // Selecionar a nota duplicada
    currentNoteId = duplicatedNote.id;
    selectNote(duplicatedNote.id);
    
    showNotification('Nota duplicada com sucesso! 📋', 'success');
}

function deleteCurrentNote() {
    if (!currentNoteId) {
        showNotification('Nenhuma nota selecionada para deletar! ⚠️', 'warning');
        return;
    }
    
    if (confirm('Tem certeza que deseja deletar esta nota? 🗑️')) {
        deleteNote(currentNoteId);
    }
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ===== FUNÇÕES DE EXPORTAÇÃO/IMPORTAÇÃO =====
function exportNotes() {
    const currentUserId = window.UtilityBox ? window.UtilityBox.currentUser()?.email : 'guest';
    const userNotes = notes.filter(note => note.userId === currentUserId);
    
    if (userNotes.length === 0) {
        showNotification('Nenhuma nota para exportar! ⚠️', 'warning');
        return;
    }
    
    const data = {
        notes: userNotes,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `notas-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    showNotification('Notas exportadas com sucesso! 📤', 'success');
}

function importNotes(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.notes && Array.isArray(data.notes)) {
                const currentUserId = window.UtilityBox ? window.UtilityBox.currentUser()?.email : 'guest';
                
                // Adicionar notas importadas
                data.notes.forEach(note => {
                    note.id = generateId(); // Gerar novo ID
                    note.userId = currentUserId; // Atribuir ao usuário atual
                    note.importedAt = new Date().toISOString();
                });
                
                notes = [...notes, ...data.notes];
                saveNotesToStorage();
                updateNotesInterface();
                
                showNotification(`${data.notes.length} notas importadas com sucesso! 📥`, 'success');
            } else {
                throw new Error('Formato de arquivo inválido');
            }
        } catch (error) {
            showNotification('Erro ao importar notas! ❌', 'error');
            console.error('Erro na importação:', error);
        }
    };
    reader.readAsText(file);
}

// ===== FUNÇÕES DE BUSCA =====
function searchNotes(query) {
    if (!query.trim()) {
        updateNotesInterface();
        return;
    }
    
    const currentUserId = window.UtilityBox ? window.UtilityBox.currentUser()?.email : 'guest';
    const userNotes = notes.filter(note => note.userId === currentUserId);
    
    const filteredNotes = userNotes.filter(note => 
        note.title.toLowerCase().includes(query.toLowerCase()) ||
        note.content.toLowerCase().includes(query.toLowerCase())
    );
    
    // Atualizar interface com resultados filtrados
    displayFilteredNotes(filteredNotes);
}

function displayFilteredNotes(filteredNotes) {
    if (!notesList) return;
    
    notesList.innerHTML = '';
    
    if (filteredNotes.length === 0) {
        notesList.innerHTML = `
            <div class="text-center text-muted p-3">
                <i class="bi bi-search display-6"></i>
                <p class="mt-2">Nenhuma nota encontrada</p>
                <small>Tente usar termos diferentes na busca</small>
            </div>
        `;
        return;
    }
    
    filteredNotes.forEach(note => {
        const noteItem = createNoteListItem(note);
        notesList.appendChild(noteItem);
    });
}

// ===== FUNÇÕES GLOBAIS =====
window.loadNotes = loadNotes;
window.exportNotes = exportNotes;
window.importNotes = importNotes;
window.searchNotes = searchNotes;

// Exportar funções para o sistema de atalhos
window.notesApp = {
    saveCurrentNote,
    createNewNote,
    duplicateCurrentNote,
    deleteCurrentNote
};

console.log('✅ Sistema de notas carregado!');
