// Task Manager Application
class TaskManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.currentFilter = 'all';
        this.editingTaskId = null;
        
        this.initializeElements();
        this.bindEvents();
        this.renderTasks();
        this.updateStats();
    }
    
    initializeElements() {
        // Input elements
        this.taskInput = document.getElementById('taskInput');
        this.addTaskBtn = document.getElementById('addTaskBtn');
        this.editTaskInput = document.getElementById('editTaskInput');
        
        // Display elements
        this.tasksList = document.getElementById('tasksList');
        this.emptyState = document.getElementById('emptyState');
        
        // Stats elements
        this.totalTasksEl = document.getElementById('totalTasks');
        this.completedTasksEl = document.getElementById('completedTasks');
        this.pendingTasksEl = document.getElementById('pendingTasks');
        
        // Filter elements
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.clearCompletedBtn = document.getElementById('clearCompleted');
        
        // Modal elements
        this.editModal = document.getElementById('editModal');
        this.saveEditBtn = document.getElementById('saveEditBtn');
        this.cancelEditBtn = document.getElementById('cancelEditBtn');
        this.closeModalBtn = document.querySelector('.close-modal');
        
        // Template
        this.taskTemplate = document.getElementById('taskTemplate');
    }
    
    bindEvents() {
        // Add task events
        this.addTaskBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });
        
        // Filter events
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
        });
        
        // Clear completed tasks
        this.clearCompletedBtn.addEventListener('click', () => this.clearCompletedTasks());
        
        // Modal events
        this.saveEditBtn.addEventListener('click', () => this.saveEdit());
        this.cancelEditBtn.addEventListener('click', () => this.closeEditModal());
        this.closeModalBtn.addEventListener('click', () => this.closeEditModal());
        this.editTaskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.saveEdit();
            if (e.key === 'Escape') this.closeEditModal();
        });
        
        // Close modal when clicking outside
        this.editModal.addEventListener('click', (e) => {
            if (e.target === this.editModal) this.closeEditModal();
        });
    }
    
    addTask() {
        const text = this.taskInput.value.trim();
        if (!text) {
            this.showNotification('يرجى إدخال نص المهمة', 'error');
            return;
        }
        
        const task = {
            id: Date.now().toString(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        this.tasks.unshift(task);
        this.saveTasks();
        this.taskInput.value = '';
        this.renderTasks();
        this.updateStats();
        this.showNotification('تم إضافة المهمة بنجاح', 'success');
    }
    
    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            
            const message = task.completed ? 'تم إكمال المهمة' : 'تم إلغاء إكمال المهمة';
            this.showNotification(message, 'success');
        }
    }
    
    deleteTask(id) {
        if (confirm('هل أنت متأكد من حذف هذه المهمة؟')) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            this.showNotification('تم حذف المهمة', 'success');
        }
    }
    
    editTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            this.editingTaskId = id;
            this.editTaskInput.value = task.text;
            this.showEditModal();
        }
    }
    
    saveEdit() {
        const newText = this.editTaskInput.value.trim();
        if (!newText) {
            this.showNotification('يرجى إدخال نص المهمة', 'error');
            return;
        }
        
        const task = this.tasks.find(t => t.id === this.editingTaskId);
        if (task) {
            task.text = newText;
            this.saveTasks();
            this.renderTasks();
            this.closeEditModal();
            this.showNotification('تم تحديث المهمة', 'success');
        }
    }
    
    showEditModal() {
        this.editModal.classList.add('show');
        this.editTaskInput.focus();
        this.editTaskInput.select();
    }
    
    closeEditModal() {
        this.editModal.classList.remove('show');
        this.editingTaskId = null;
        this.editTaskInput.value = '';
    }
    
    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        this.filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        this.renderTasks();
    }
    
    clearCompletedTasks() {
        const completedCount = this.tasks.filter(t => t.completed).length;
        if (completedCount === 0) {
            this.showNotification('لا توجد مهام مكتملة لحذفها', 'info');
            return;
        }
        
        if (confirm(`هل أنت متأكد من حذف ${completedCount} مهمة مكتملة؟`)) {
            this.tasks = this.tasks.filter(t => !t.completed);
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            this.showNotification(`تم حذف ${completedCount} مهمة مكتملة`, 'success');
        }
    }
    
    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'completed':
                return this.tasks.filter(t => t.completed);
            case 'pending':
                return this.tasks.filter(t => !t.completed);
            default:
                return this.tasks;
        }
    }
    
    renderTasks() {
        const filteredTasks = this.getFilteredTasks();
        
        if (filteredTasks.length === 0) {
            this.tasksList.classList.add('hidden');
            this.emptyState.classList.remove('hidden');
            return;
        }
        
        this.tasksList.classList.remove('hidden');
        this.emptyState.classList.add('hidden');
        
        this.tasksList.innerHTML = '';
        
        filteredTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            this.tasksList.appendChild(taskElement);
        });
    }
    
    createTaskElement(task) {
        const template = this.taskTemplate.content.cloneNode(true);
        const taskItem = template.querySelector('.task-item');
        
        // Set task data
        taskItem.dataset.id = task.id;
        taskItem.classList.toggle('completed', task.completed);
        
        // Set task content
        const checkbox = taskItem.querySelector('.task-checkbox');
        const taskText = taskItem.querySelector('.task-text');
        const taskDate = taskItem.querySelector('.task-date');
        
        checkbox.classList.toggle('checked', task.completed);
        taskText.textContent = task.text;
        taskDate.textContent = this.formatDate(task.createdAt);
        
        // Bind events
        checkbox.addEventListener('click', () => this.toggleTask(task.id));
        taskItem.querySelector('.edit-btn').addEventListener('click', () => this.editTask(task.id));
        taskItem.querySelector('.delete-btn').addEventListener('click', () => this.deleteTask(task.id));
        
        return taskItem;
    }
    
    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const pending = total - completed;
        
        this.totalTasksEl.textContent = total;
        this.completedTasksEl.textContent = completed;
        this.pendingTasksEl.textContent = pending;
        
        // Animate numbers
        this.animateNumber(this.totalTasksEl);
        this.animateNumber(this.completedTasksEl);
        this.animateNumber(this.pendingTasksEl);
    }
    
    animateNumber(element) {
        element.style.transform = 'scale(1.2)';
        element.style.color = '#667eea';
        
        setTimeout(() => {
            element.style.transform = 'scale(1)';
            element.style.color = '';
        }, 200);
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
            return 'اليوم';
        } else if (diffDays === 2) {
            return 'أمس';
        } else if (diffDays <= 7) {
            return `منذ ${diffDays - 1} أيام`;
        } else {
            return date.toLocaleDateString('ar-SA', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
        `;
        
        // Add styles
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: this.getNotificationColor(type),
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '10px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
            zIndex: '9999',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.9rem',
            fontWeight: '500',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease'
        });
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    getNotificationIcon(type) {
        switch (type) {
            case 'success': return 'fa-check-circle';
            case 'error': return 'fa-exclamation-circle';
            case 'warning': return 'fa-exclamation-triangle';
            default: return 'fa-info-circle';
        }
    }
    
    getNotificationColor(type) {
        switch (type) {
            case 'success': return '#27ae60';
            case 'error': return '#e74c3c';
            case 'warning': return '#f39c12';
            default: return '#3498db';
        }
    }
    
    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TaskManager();
});

// Add some sample tasks for demo (only if no tasks exist)
document.addEventListener('DOMContentLoaded', () => {
    const existingTasks = JSON.parse(localStorage.getItem('tasks'));
    if (!existingTasks || existingTasks.length === 0) {
        const sampleTasks = [
            {
                id: '1',
                text: 'تعلم JavaScript المتقدم',
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: '2',
                text: 'إنشاء مشروع محفظة أكواد',
                completed: true,
                createdAt: new Date(Date.now() - 86400000).toISOString() // Yesterday
            },
            {
                id: '3',
                text: 'مراجعة أساسيات HTML و CSS',
                completed: false,
                createdAt: new Date(Date.now() - 172800000).toISOString() // 2 days ago
            }
        ];
        
        localStorage.setItem('tasks', JSON.stringify(sampleTasks));
    }
});

