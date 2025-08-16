// Sistema de Organização de Tarefas - Utility Box
// Funcionalidades: Kanban board, gráficos, categorias, prioridades, datas

class TaskManager {
    constructor() {
        this.tasks = [];
        this.categories = [
            { id: 'work', name: 'Trabalho', color: '#007bff', icon: 'bi-briefcase' },
            { id: 'personal', name: 'Pessoal', color: '#28a745', icon: 'bi-person' },
            { id: 'study', name: 'Estudo', color: '#ffc107', icon: 'bi-book' },
            { id: 'health', name: 'Saúde', color: '#dc3545', icon: 'bi-heart' },
            { id: 'finance', name: 'Finanças', color: '#6f42c1', icon: 'bi-wallet2' },
            { id: 'other', name: 'Outros', color: '#6c757d', icon: 'bi-three-dots' }
        ];
        this.priorities = [
            { id: 'low', name: 'Baixa', color: '#28a745', icon: 'bi-arrow-down' },
            { id: 'medium', name: 'Média', color: '#ffc107', icon: 'bi-minus' },
            { id: 'high', name: 'Alta', color: '#fd7e14', icon: 'bi-exclamation' },
            { id: 'urgent', name: 'Urgente', color: '#dc3545', icon: 'bi-exclamation-triangle' }
        ];
        this.statuses = ['pending', 'in-progress', 'completed', 'cancelled'];
        this.charts = {};
        
        this.init();
    }

    init() {
        this.loadTasks();
        this.setupEventListeners();
        this.renderTasks();
        this.initializeCharts();
        console.log('📋 Sistema de Tarefas inicializado');
    }

    setupEventListeners() {
        // Botão de nova tarefa
        const newTaskBtn = document.getElementById('newTaskBtn');
        if (newTaskBtn) {
            newTaskBtn.addEventListener('click', () => this.showTaskModal());
        }

        // Botão de limpar todas
        const clearAllBtn = document.getElementById('clearAllTasksBtn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => this.clearAllTasks());
        }

        // Botão de exportar
        const exportBtn = document.getElementById('exportTasksBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportTasks());
        }

        // Botão de importar
        const importBtn = document.getElementById('importTasksBtn');
        if (importBtn) {
            importBtn.addEventListener('click', () => this.importTasks());
        }

        // Atalhos de teclado básicos (os principais são gerenciados pelo sistema centralizado)
        document.addEventListener('keydown', (e) => {
            // Garantir que Backspace e Delete funcionem sempre
            if (e.key === 'Backspace' || e.key === 'Delete') {
                return; // Permitir comportamento padrão
            }
            
            // Enter para salvar tarefa no modal
            if (e.key === 'Enter' && e.target.matches('#taskTitle, #taskDescription')) {
                e.preventDefault();
                const saveBtn = document.querySelector('#taskModal .btn-primary');
                if (saveBtn) {
                    saveBtn.click();
                }
            }
            
            // Escape para fechar modal
            if (e.key === 'Escape') {
                this.hideTaskModal();
            }
        });

        // Event listeners para drag and drop
        this.setupDragAndDrop();
    }

    setupDragAndDrop() {
        const containers = document.querySelectorAll('.task-column');
        containers.forEach(container => {
            container.addEventListener('dragover', (e) => {
                e.preventDefault();
                container.classList.add('drag-over');
            });

            container.addEventListener('dragleave', () => {
                container.classList.remove('drag-over');
            });

            container.addEventListener('drop', (e) => {
                e.preventDefault();
                container.classList.remove('drag-over');
                const taskId = e.dataTransfer.getData('text/plain');
                const newStatus = container.dataset.status;
                this.moveTask(taskId, newStatus);
            });
        });
    }

    showTaskModal(task = null) {
        const modal = document.getElementById('taskModal');
        if (!modal) return;

        const titleInput = modal.querySelector('#taskTitle');
        const descriptionInput = modal.querySelector('#taskDescription');
        const categorySelect = modal.querySelector('#taskCategory');
        const prioritySelect = modal.querySelector('#taskPriority');
        const dueDateInput = modal.querySelector('#taskDueDate');
        const saveBtn = modal.querySelector('#saveTaskBtn');

        if (task) {
            // Modo de edição
            titleInput.value = task.title;
            descriptionInput.value = task.description;
            categorySelect.value = task.category;
            prioritySelect.value = task.priority;
            dueDateInput.value = task.dueDate ? task.dueDate.split('T')[0] : '';
            saveBtn.textContent = 'Atualizar Tarefa';
            saveBtn.onclick = () => this.updateTask(task.id);
        } else {
            // Modo de criação
            titleInput.value = '';
            descriptionInput.value = '';
            categorySelect.value = 'work';
            prioritySelect.value = 'medium';
            dueDateInput.value = '';
            saveBtn.textContent = 'Criar Tarefa';
            saveBtn.onclick = () => this.createTask();
        }

        // Configurar categorias
        categorySelect.innerHTML = this.categories.map(cat => 
            `<option value="${cat.id}">${cat.name}</option>`
        ).join('');

        // Configurar prioridades
        prioritySelect.innerHTML = this.priorities.map(pri => 
            `<option value="${pri.id}">${pri.name}</option>`
        ).join('');

        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }

    hideTaskModal() {
        const modal = document.getElementById('taskModal');
        if (modal) {
            const bootstrapModal = bootstrap.Modal.getInstance(modal);
            if (bootstrapModal) {
                bootstrapModal.hide();
            }
        }
    }

    createTask() {
        const titleInput = document.getElementById('taskTitle');
        const descriptionInput = document.getElementById('taskDescription');
        const categorySelect = document.getElementById('taskCategory');
        const prioritySelect = document.getElementById('taskPriority');
        const dueDateInput = document.getElementById('taskDueDate');

        const title = titleInput.value.trim();
        const description = descriptionInput.value.trim();
        const category = categorySelect.value;
        const priority = prioritySelect.value;
        const dueDate = dueDateInput.value;

        if (!title) {
            showNotification('O título da tarefa é obrigatório! ⚠️', 'warning');
            return;
        }

        const task = {
            id: this.generateId(),
            title,
            description,
            category,
            priority,
            status: 'pending',
            dueDate: dueDate || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            userId: window.UtilityBox ? window.UtilityBox.currentUser()?.email : 'guest'
        };

        this.tasks.unshift(task);
        this.saveTasks();
        this.renderTasks();
        this.updateCharts();
        this.hideTaskModal();

        showNotification('Tarefa criada com sucesso! ✅', 'success');
    }

    updateTask(taskId) {
        const titleInput = document.getElementById('taskTitle');
        const descriptionInput = document.getElementById('taskDescription');
        const categorySelect = document.getElementById('taskCategory');
        const prioritySelect = document.getElementById('taskPriority');
        const dueDateInput = document.getElementById('taskDueDate');

        const title = titleInput.value.trim();
        const description = descriptionInput.value.trim();
        const category = categorySelect.value;
        const priority = prioritySelect.value;
        const dueDate = dueDateInput.value;

        if (!title) {
            showNotification('O título da tarefa é obrigatório! ⚠️', 'warning');
            return;
        }

        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            this.tasks[taskIndex] = {
                ...this.tasks[taskIndex],
                title,
                description,
                category,
                priority,
                dueDate: dueDate || null,
                updatedAt: new Date().toISOString()
            };

            this.saveTasks();
            this.renderTasks();
            this.updateCharts();
            this.hideTaskModal();

            showNotification('Tarefa atualizada com sucesso! ✏️', 'success');
        }
    }

    deleteTask(taskId) {
        if (confirm('Tem certeza que deseja excluir esta tarefa? 🗑️')) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.saveTasks();
            this.renderTasks();
            this.updateCharts();
            showNotification('Tarefa excluída com sucesso! 🗑️', 'info');
        }
    }

    moveTask(taskId, newStatus) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task && this.statuses.includes(newStatus)) {
            task.status = newStatus;
            task.updatedAt = new Date().toISOString();
            this.saveTasks();
            this.renderTasks();
            this.updateCharts();
        }
    }

    clearAllTasks() {
        if (confirm('Tem certeza que deseja excluir TODAS as tarefas? Esta ação não pode ser desfeita! 🗑️')) {
            this.tasks = [];
            this.saveTasks();
            this.renderTasks();
            this.updateCharts();
            showNotification('Todas as tarefas foram excluídas! 🗑️', 'info');
        }
    }

    renderTasks() {
        this.statuses.forEach(status => {
            const container = document.querySelector(`[data-status="${status}"]`);
            if (!container) return;

            const taskList = container.querySelector('.task-list');
            if (!taskList) return;

            taskList.innerHTML = '';

            const statusTasks = this.tasks.filter(task => task.status === status);
            
            if (statusTasks.length === 0) {
                taskList.innerHTML = `
                    <div class="text-center text-muted p-3">
                        <i class="bi bi-inbox display-6"></i>
                        <p class="mt-2">Nenhuma tarefa</p>
                    </div>
                `;
                return;
            }

            statusTasks.forEach(task => {
                const taskElement = this.createTaskElement(task);
                taskList.appendChild(taskElement);
            });
        });
    }

    createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-item card mb-2';
        taskElement.draggable = true;
        taskElement.dataset.taskId = task.id;

        const category = this.categories.find(c => c.id === task.category);
        const priority = this.priorities.find(p => p.id === task.priority);

        taskElement.innerHTML = `
            <div class="card-body p-2">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <h6 class="card-title mb-0">${task.title}</h6>
                    <div class="dropdown">
                        <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                            <i class="bi bi-three-dots"></i>
                        </button>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="#" onclick="taskManager.editTask('${task.id}')">
                                <i class="bi bi-pencil me-2"></i>Editar
                            </a></li>
                            <li><a class="dropdown-item" href="#" onclick="taskManager.deleteTask('${task.id}')">
                                <i class="bi bi-trash me-2"></i>Excluir
                            </a></li>
                        </ul>
                    </div>
                </div>
                ${task.description ? `<p class="card-text small text-muted mb-2">${task.description}</p>` : ''}
                <div class="d-flex justify-content-between align-items-center">
                    <span class="badge" style="background-color: ${category.color}">
                        <i class="bi ${category.icon} me-1"></i>${category.name}
                    </span>
                    <span class="badge" style="background-color: ${priority.color}">
                        <i class="bi ${priority.icon} me-1"></i>${priority.name}
                    </span>
                </div>
                ${task.dueDate ? `
                    <div class="mt-2">
                        <small class="text-muted">
                            <i class="bi bi-calendar me-1"></i>${this.formatDate(task.dueDate)}
                        </small>
                    </div>
                ` : ''}
            </div>
        `;

        // Event listeners para drag and drop
        taskElement.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', task.id);
            taskElement.classList.add('dragging');
        });

        taskElement.addEventListener('dragend', () => {
            taskElement.classList.remove('dragging');
        });

        return taskElement;
    }

    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            this.showTaskModal(task);
        }
    }

    initializeCharts() {
        this.createCategoryChart();
        this.createPriorityChart();
        this.createStatusChart();
        this.createTimelineChart();
    }

    createCategoryChart() {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;

        this.charts.category = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: this.categories.map(c => c.name),
                datasets: [{
                    data: this.categories.map(c => this.tasks.filter(t => t.category === c.id).length),
                    backgroundColor: this.categories.map(c => c.color),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    title: {
                        display: true,
                        text: 'Tarefas por Categoria'
                    }
                }
            }
        });
    }

    createPriorityChart() {
        const ctx = document.getElementById('priorityChart');
        if (!ctx) return;

        this.charts.priority = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: this.priorities.map(p => p.name),
                datasets: [{
                    label: 'Quantidade',
                    data: this.priorities.map(p => this.tasks.filter(t => t.priority === p.id).length),
                    backgroundColor: this.priorities.map(p => p.color),
                    borderColor: this.priorities.map(p => p.color),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Tarefas por Prioridade'
                    }
                }
            }
        });
    }

    createStatusChart() {
        const ctx = document.getElementById('statusChart');
        if (!ctx) return;

        const statusLabels = {
            'pending': 'Pendente',
            'in-progress': 'Em Progresso',
            'completed': 'Concluída',
            'cancelled': 'Cancelada'
        };

        this.charts.status = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.values(statusLabels),
                datasets: [{
                    data: this.statuses.map(s => this.tasks.filter(t => t.status === s).length),
                    backgroundColor: ['#ffc107', '#17a2b8', '#28a745', '#dc3545'],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    title: {
                        display: true,
                        text: 'Status das Tarefas'
                    }
                }
            }
        });
    }

    createTimelineChart() {
        const ctx = document.getElementById('timelineChart');
        if (!ctx) return;

        // Agrupar tarefas por data de criação (últimos 7 dias)
        const last7Days = Array.from({length: 7}, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return date.toISOString().split('T')[0];
        }).reverse();

        this.charts.timeline = new Chart(ctx, {
            type: 'line',
            data: {
                labels: last7Days.map(date => this.formatDate(date)),
                datasets: [{
                    label: 'Tarefas Criadas',
                    data: last7Days.map(date => 
                        this.tasks.filter(t => t.createdAt.startsWith(date)).length
                    ),
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Tarefas Criadas (Últimos 7 Dias)'
                    }
                }
            }
        });
    }

    updateCharts() {
        if (this.charts.category) {
            this.charts.category.data.datasets[0].data = this.categories.map(c => 
                this.tasks.filter(t => t.category === c.id).length
            );
            this.charts.category.update();
        }

        if (this.charts.priority) {
            this.charts.priority.data.datasets[0].data = this.priorities.map(p => 
                this.tasks.filter(t => t.priority === p.id).length
            );
            this.charts.priority.update();
        }

        if (this.charts.status) {
            this.charts.status.data.datasets[0].data = this.statuses.map(s => 
                this.tasks.filter(t => t.status === s).length
            );
            this.charts.status.update();
        }

        if (this.charts.timeline) {
            const last7Days = Array.from({length: 7}, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - i);
                return date.toISOString().split('T')[0];
            }).reverse();

            this.charts.timeline.data.datasets[0].data = last7Days.map(date => 
                this.tasks.filter(t => t.createdAt.startsWith(date)).length
            );
            this.charts.timeline.update();
        }
    }

    saveTasks() {
        try {
            localStorage.setItem('utilityBox-tasks', JSON.stringify(this.tasks));
        } catch (error) {
            console.error('Erro ao salvar tarefas:', error);
            showNotification('Erro ao salvar tarefas! ❌', 'error');
        }
    }

    loadTasks() {
        try {
            const savedTasks = localStorage.getItem('utilityBox-tasks');
            if (savedTasks) {
                this.tasks = JSON.parse(savedTasks);
            }
        } catch (error) {
            console.error('Erro ao carregar tarefas:', error);
            this.tasks = [];
        }
    }

    exportTasks() {
        if (this.tasks.length === 0) {
            showNotification('Nenhuma tarefa para exportar! ⚠️', 'warning');
            return;
        }

        const data = {
            tasks: this.tasks,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `tarefas-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        showNotification('Tarefas exportadas com sucesso! 📤', 'success');
    }

    importTasks(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.tasks && Array.isArray(data.tasks)) {
                    const currentUserId = window.UtilityBox ? window.UtilityBox.currentUser()?.email : 'guest';
                    
                    // Adicionar tarefas importadas
                    data.tasks.forEach(task => {
                        task.id = this.generateId(); // Gerar novo ID
                        task.userId = currentUserId; // Atribuir ao usuário atual
                        task.importedAt = new Date().toISOString();
                    });
                    
                    this.tasks = [...this.tasks, ...data.tasks];
                    this.saveTasks();
                    this.renderTasks();
                    this.updateCharts();
                    
                    showNotification(`${data.tasks.length} tarefas importadas com sucesso! 📥`, 'success');
                } else {
                    throw new Error('Formato de arquivo inválido');
                }
            } catch (error) {
                showNotification('Erro ao importar tarefas! ❌', 'error');
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
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
}

// ===== INICIALIZAÇÃO =====
let taskManager;

document.addEventListener('DOMContentLoaded', function() {
    taskManager = new TaskManager();
    
    // Exportar para escopo global
    window.taskManager = taskManager;
    window.loadTasks = () => taskManager.loadTasks();
    window.exportTasks = () => taskManager.exportTasks();
    window.importTasks = (file) => taskManager.importTasks(file);
});

// Exportar funções para o sistema de atalhos
window.tasksApp = {
    showTaskModal: () => taskManager?.showTaskModal(),
    createTask: () => taskManager?.createTask(),
    saveCurrentTask: () => {
        const saveBtn = document.querySelector('#taskModal .btn-primary');
        if (saveBtn) {
            saveBtn.click();
        }
    }
};
