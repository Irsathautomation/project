/**
 * Pro Task Manager - Advanced Task Management Application
 * Features: Categories, Priorities, Due Dates, Search, Filter, Sort, Dark Mode
 * Author: Pro Task Manager Team
 */

// ========================
// Global Variables & Constants
// ========================

// Storage key for localStorage
const STORAGE_KEY = 'proTaskManagerTasks';
const THEME_KEY = 'proTaskManagerTheme';

// Task array to store all tasks
let tasks = [];
let currentEditingTaskId = null;

// Priority order for sorting
const PRIORITY_ORDER = {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1
};

// Category icons mapping
const CATEGORY_ICONS = {
    personal: '🏠',
    work: '💼',
    shopping: '🛒',
    health: '🏥',
    finance: '💰',
    education: '📚',
    other: '📝'
};

// Priority icons mapping
const PRIORITY_ICONS = {
    low: '🟢',
    medium: '🟡',
    high: '🟠',
    urgent: '🔴'
};

// ========================
// DOM Elements
// ========================

// Main elements
const taskTitle = document.getElementById('taskTitle');
const taskCategory = document.getElementById('taskCategory');
const taskPriority = document.getElementById('taskPriority');
const taskDueDate = document.getElementById('taskDueDate');
const addTaskBtn = document.getElementById('addTaskBtn');
const toggleAdvanced = document.getElementById('toggleAdvanced');
const advancedInputs = document.getElementById('advancedInputs');

// Search and filter elements
const searchInput = document.getElementById('searchInput');
const sortBy = document.getElementById('sortBy');
const filterCategory = document.getElementById('filterCategory');
const filterStatus = document.getElementById('filterStatus');

// Statistics elements
const totalTasks = document.getElementById('totalTasks');
const completedTasks = document.getElementById('completedTasks');
const pendingTasks = document.getElementById('pendingTasks');
const overdueTasks = document.getElementById('overdueTasks');

// Task list elements
const tasksList = document.getElementById('tasksList');
const emptyState = document.getElementById('emptyState');
const noResultsState = document.getElementById('noResultsState');

// Bulk action elements
const clearCompletedBtn = document.getElementById('clearCompletedBtn');
const markAllCompleteBtn = document.getElementById('markAllCompleteBtn');

// Theme toggle
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle.querySelector('.theme-icon');

// Modal elements
const editModal = document.getElementById('editModal');
const closeModal = document.getElementById('closeModal');
const editTaskTitle = document.getElementById('editTaskTitle');
const editTaskCategory = document.getElementById('editTaskCategory');
const editTaskPriority = document.getElementById('editTaskPriority');
const editTaskDueDate = document.getElementById('editTaskDueDate');
const saveEdit = document.getElementById('saveEdit');
const cancelEdit = document.getElementById('cancelEdit');

// ========================
// Utility Functions
// ========================

/**
 * Generate unique ID for tasks
 * @returns {string} Unique task ID
 */
function generateTaskId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Reset time for comparison
    const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const tomorrowDate = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
    
    if (taskDate.getTime() === todayDate.getTime()) {
        return 'Today';
    } else if (taskDate.getTime() === tomorrowDate.getTime()) {
        return 'Tomorrow';
    } else {
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
    }
}

/**
 * Check if a task is overdue
 * @param {Object} task - Task object
 * @returns {boolean} True if task is overdue
 */
function isTaskOverdue(task) {
    if (!task.dueDate || task.completed) return false;
    const today = new Date();
    const dueDate = new Date(task.dueDate);
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    return dueDateOnly < todayDate;
}

/**
 * Show notification message
 * @param {string} message - Message to display
 * @param {string} type - Type of notification (success, error, info)
 */
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button class="notification-close">&times;</button>
    `;
    
    // Style the notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: type === 'success' ? 'var(--success-color)' : 
                   type === 'error' ? 'var(--error-color)' : 'var(--primary-color)',
        color: 'white',
        padding: '12px 20px',
        borderRadius: '8px',
        boxShadow: 'var(--shadow-lg)',
        zIndex: '1001',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        maxWidth: '300px',
        animation: 'slideInRight 0.3s ease-out'
    });
    
    // Close button style
    const closeBtn = notification.querySelector('.notification-close');
    Object.assign(closeBtn.style, {
        background: 'transparent',
        border: 'none',
        color: 'white',
        fontSize: '18px',
        cursor: 'pointer',
        padding: '0',
        marginLeft: '10px'
    });
    
    // Close notification
    closeBtn.addEventListener('click', () => removeNotification(notification));
    
    document.body.appendChild(notification);
    
    // Auto remove after 4 seconds
    setTimeout(() => removeNotification(notification), 4000);
}

/**
 * Remove notification with animation
 * @param {HTMLElement} notification - Notification element
 */
function removeNotification(notification) {
    if (notification && notification.parentNode) {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
}

// ========================
// LocalStorage Functions
// ========================

/**
 * Load tasks from localStorage
 */
function loadTasksFromStorage() {
    try {
        const storedTasks = localStorage.getItem(STORAGE_KEY);
        if (storedTasks) {
            tasks = JSON.parse(storedTasks);
            // Ensure all tasks have required properties
            tasks = tasks.map(task => ({
                id: task.id || generateTaskId(),
                title: task.title || '',
                category: task.category || 'other',
                priority: task.priority || 'medium',
                dueDate: task.dueDate || null,
                completed: task.completed || false,
                createdAt: task.createdAt || new Date().toISOString(),
                completedAt: task.completedAt || null
            }));
        }
    } catch (error) {
        console.error('Error loading tasks from storage:', error);
        tasks = [];
        showNotification('Error loading saved tasks', 'error');
    }
}

/**
 * Save tasks to localStorage
 */
function saveTasksToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
        console.error('Error saving tasks to storage:', error);
        showNotification('Error saving tasks', 'error');
    }
}

/**
 * Load theme from localStorage
 */
function loadThemeFromStorage() {
    try {
        const savedTheme = localStorage.getItem(THEME_KEY);
        if (savedTheme) {
            setTheme(savedTheme);
        }
    } catch (error) {
        console.error('Error loading theme from storage:', error);
    }
}

/**
 * Save theme to localStorage
 * @param {string} theme - Theme name (light/dark)
 */
function saveThemeToStorage(theme) {
    try {
        localStorage.setItem(THEME_KEY, theme);
    } catch (error) {
        console.error('Error saving theme to storage:', error);
    }
}

// ========================
// Theme Functions
// ========================

/**
 * Set application theme
 * @param {string} theme - Theme name (light/dark)
 */
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    themeToggle.title = `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`;
}

/**
 * Toggle between light and dark themes
 */
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    saveThemeToStorage(newTheme);
    showNotification(`Switched to ${newTheme} mode`, 'info');
}

// ========================
// Task Management Functions
// ========================

/**
 * Add a new task
 */
function addTask() {
    const title = taskTitle.value.trim();
    
    // Validate input
    if (!title) {
        showNotification('Please enter a task title', 'error');
        taskTitle.focus();
        return;
    }
    
    // Create new task object
    const newTask = {
        id: generateTaskId(),
        title: title,
        category: taskCategory.value,
        priority: taskPriority.value,
        dueDate: taskDueDate.value || null,
        completed: false,
        createdAt: new Date().toISOString(),
        completedAt: null
    };
    
    // Add to tasks array
    tasks.unshift(newTask);
    
    // Clear form
    clearTaskForm();
    
    // Save and update UI
    saveTasksToStorage();
    renderTasks();
    updateStatistics();
    
    showNotification('Task added successfully!');
}

/**
 * Clear the task input form
 */
function clearTaskForm() {
    taskTitle.value = '';
    taskCategory.value = 'personal';
    taskPriority.value = 'medium';
    taskDueDate.value = '';
    
    // Hide advanced inputs if shown
    if (advancedInputs.classList.contains('show')) {
        toggleAdvancedInputs();
    }
}

/**
 * Toggle task completion status
 * @param {string} taskId - Task ID
 */
function toggleTaskCompletion(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    task.completed = !task.completed;
    task.completedAt = task.completed ? new Date().toISOString() : null;
    
    saveTasksToStorage();
    renderTasks();
    updateStatistics();
    
    const message = task.completed ? 
        '✅ Task marked as completed!' : 
        '📋 Task marked as pending';
    showNotification(message);
}

/**
 * Delete a task
 * @param {string} taskId - Task ID
 */
function deleteTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Confirm deletion
    if (!confirm(`Are you sure you want to delete "${task.title}"?`)) {
        return;
    }
    
    // Find and remove task
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
        tasks.splice(taskIndex, 1);
        
        saveTasksToStorage();
        renderTasks();
        updateStatistics();
        
        showNotification('Task deleted successfully');
    }
}

/**
 * Open edit modal for a task
 * @param {string} taskId - Task ID
 */
function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    currentEditingTaskId = taskId;
    
    // Populate modal fields
    editTaskTitle.value = task.title;
    editTaskCategory.value = task.category;
    editTaskPriority.value = task.priority;
    editTaskDueDate.value = task.dueDate || '';
    
    // Show modal
    editModal.classList.add('show');
}

/**
 * Save edited task
 */
function saveEditedTask() {
    const task = tasks.find(t => t.id === currentEditingTaskId);
    if (!task) return;
    
    const title = editTaskTitle.value.trim();
    if (!title) {
        showNotification('Please enter a task title', 'error');
        editTaskTitle.focus();
        return;
    }
    
    // Update task
    task.title = title;
    task.category = editTaskCategory.value;
    task.priority = editTaskPriority.value;
    task.dueDate = editTaskDueDate.value || null;
    
    // Close modal
    closeEditModal();
    
    // Save and update UI
    saveTasksToStorage();
    renderTasks();
    updateStatistics();
    
    showNotification('Task updated successfully!');
}

/**
 * Close edit modal
 */
function closeEditModal() {
    editModal.classList.remove('show');
    currentEditingTaskId = null;
}

/**
 * Clear all completed tasks
 */
function clearCompletedTasks() {
    const completedCount = tasks.filter(task => task.completed).length;
    
    if (completedCount === 0) {
        showNotification('No completed tasks to clear', 'info');
        return;
    }
    
    if (!confirm(`Clear ${completedCount} completed task(s)?`)) {
        return;
    }
    
    tasks = tasks.filter(task => !task.completed);
    
    saveTasksToStorage();
    renderTasks();
    updateStatistics();
    
    showNotification(`Cleared ${completedCount} completed tasks`);
}

/**
 * Mark all tasks as complete
 */
function markAllTasksComplete() {
    const pendingTasks = tasks.filter(task => !task.completed);
    
    if (pendingTasks.length === 0) {
        showNotification('No pending tasks to complete', 'info');
        return;
    }
    
    if (!confirm(`Mark ${pendingTasks.length} task(s) as complete?`)) {
        return;
    }
    
    tasks.forEach(task => {
        if (!task.completed) {
            task.completed = true;
            task.completedAt = new Date().toISOString();
        }
    });
    
    saveTasksToStorage();
    renderTasks();
    updateStatistics();
    
    showNotification(`Marked ${pendingTasks.length} tasks as complete! 🎉`);
}

// ========================
// Search, Filter, and Sort Functions
// ========================

/**
 * Get filtered and sorted tasks based on current criteria
 * @returns {Array} Filtered and sorted tasks
 */
function getFilteredAndSortedTasks() {
    let filteredTasks = [...tasks];
    
    // Apply search filter
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (searchTerm) {
        filteredTasks = filteredTasks.filter(task =>
            task.title.toLowerCase().includes(searchTerm)
        );
    }
    
    // Apply category filter
    const categoryFilter = filterCategory.value;
    if (categoryFilter !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.category === categoryFilter);
    }
    
    // Apply status filter
    const statusFilter = filterStatus.value;
    if (statusFilter !== 'all') {
        switch (statusFilter) {
            case 'pending':
                filteredTasks = filteredTasks.filter(task => !task.completed);
                break;
            case 'completed':
                filteredTasks = filteredTasks.filter(task => task.completed);
                break;
            case 'overdue':
                filteredTasks = filteredTasks.filter(task => 
                    !task.completed && isTaskOverdue(task)
                );
                break;
        }
    }
    
    // Apply sorting
    const sortOption = sortBy.value;
    filteredTasks.sort((a, b) => {
        switch (sortOption) {
            case 'title':
                return a.title.localeCompare(b.title);
            case 'category':
                return a.category.localeCompare(b.category);
            case 'priority':
                return PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
            case 'dueDate':
                if (!a.dueDate && !b.dueDate) return 0;
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate) - new Date(b.dueDate);
            case 'created':
            default:
                return new Date(b.createdAt) - new Date(a.createdAt);
        }
    });
    
    return filteredTasks;
}

/**
 * Handle search input
 */
function handleSearch() {
    renderTasks();
}

/**
 * Handle filter change
 */
function handleFilterChange() {
    renderTasks();
}

// ========================
// UI Rendering Functions
// ========================

/**
 * Render all tasks in the UI
 */
function renderTasks() {
    const filteredTasks = getFilteredAndSortedTasks();
    
    // Clear current task list
    tasksList.innerHTML = '';
    
    // Show appropriate empty state
    if (tasks.length === 0) {
        emptyState.style.display = 'block';
        noResultsState.style.display = 'none';
        return;
    } else if (filteredTasks.length === 0) {
        emptyState.style.display = 'none';
        noResultsState.style.display = 'block';
        return;
    } else {
        emptyState.style.display = 'none';
        noResultsState.style.display = 'none';
    }
    
    // Render tasks
    filteredTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        tasksList.appendChild(taskElement);
    });
}

/**
 * Create a task DOM element
 * @param {Object} task - Task object
 * @returns {HTMLElement} Task element
 */
function createTaskElement(task) {
    const taskDiv = document.createElement('div');
    taskDiv.className = `task-item ${task.completed ? 'completed' : ''}`;
    
    const isOverdue = isTaskOverdue(task);
    
    taskDiv.innerHTML = `
        <div class="task-header">
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
                 onclick="toggleTaskCompletion('${task.id}')"
                 title="${task.completed ? 'Mark as pending' : 'Mark as complete'}">
                ${task.completed ? '✓' : ''}
            </div>
            <div class="task-content">
                <div class="task-title ${task.completed ? 'completed' : ''}">${task.title}</div>
                <div class="task-meta">
                    <span class="task-category">
                        ${CATEGORY_ICONS[task.category]} ${task.category.charAt(0).toUpperCase() + task.category.slice(1)}
                    </span>
                    <span class="task-priority priority-${task.priority}">
                        ${PRIORITY_ICONS[task.priority]} ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </span>
                    ${task.dueDate ? `
                        <span class="task-due-date ${isOverdue ? 'overdue' : ''}">
                            ⏰ ${formatDate(task.dueDate)}
                        </span>
                    ` : ''}
                </div>
            </div>
            <div class="task-actions">
                <button class="task-action-btn edit" 
                        onclick="editTask('${task.id}')"
                        title="Edit task">
                    ✏️
                </button>
                <button class="task-action-btn delete" 
                        onclick="deleteTask('${task.id}')"
                        title="Delete task">
                    🗑️
                </button>
            </div>
        </div>
    `;
    
    return taskDiv;
}

/**
 * Update statistics display
 */
function updateStatistics() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;
    const overdue = tasks.filter(task => !task.completed && isTaskOverdue(task)).length;
    
    totalTasks.textContent = total;
    completedTasks.textContent = completed;
    pendingTasks.textContent = pending;
    overdueTasks.textContent = overdue;
    
    // Update page title with progress
    if (total > 0) {
        const percentage = Math.round((completed / total) * 100);
        document.title = `Pro Task Manager (${percentage}% Complete)`;
    } else {
        document.title = 'Pro Task Manager';
    }
}

/**
 * Toggle advanced input visibility
 */
function toggleAdvancedInputs() {
    const isVisible = advancedInputs.classList.contains('show');
    
    if (isVisible) {
        advancedInputs.classList.remove('show');
        document.getElementById('toggleText').textContent = 'Show More Options';
        toggleAdvanced.classList.remove('active');
    } else {
        advancedInputs.classList.add('show');
        document.getElementById('toggleText').textContent = 'Hide Options';
        toggleAdvanced.classList.add('active');
    }
}

// ========================
// Event Listeners Setup
// ========================

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // Task form events
    addTaskBtn.addEventListener('click', addTask);
    taskTitle.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });
    toggleAdvanced.addEventListener('click', toggleAdvancedInputs);
    
    // Search and filter events
    searchInput.addEventListener('input', handleSearch);
    sortBy.addEventListener('change', handleFilterChange);
    filterCategory.addEventListener('change', handleFilterChange);
    filterStatus.addEventListener('change', handleFilterChange);
    
    // Bulk action events
    clearCompletedBtn.addEventListener('click', clearCompletedTasks);
    markAllCompleteBtn.addEventListener('click', markAllTasksComplete);
    
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // Modal events
    closeModal.addEventListener('click', closeEditModal);
    cancelEdit.addEventListener('click', closeEditModal);
    saveEdit.addEventListener('click', saveEditedTask);
    
    // Close modal when clicking outside
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) {
            closeEditModal();
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

/**
 * Handle keyboard shortcuts
 * @param {KeyboardEvent} e - Keyboard event
 */
function handleKeyboardShortcuts(e) {
    // Escape key to close modal or clear search
    if (e.key === 'Escape') {
        if (editModal.classList.contains('show')) {
            closeEditModal();
        } else if (searchInput.value) {
            searchInput.value = '';
            handleSearch();
        } else {
            taskTitle.blur();
        }
    }
    
    // Ctrl/Cmd + Enter to add task quickly
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        addTask();
    }
    
    // Ctrl/Cmd + F to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInput.focus();
    }
    
    // Alt + T to toggle theme
    if (e.altKey && e.key === 't') {
        e.preventDefault();
        toggleTheme();
    }
}

// ========================
// Application Initialization
// ========================

/**
 * Initialize the application
 */
function initializeApp() {
    console.log('🚀 Initializing Pro Task Manager...');
    
    // Load data from storage
    loadTasksFromStorage();
    loadThemeFromStorage();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initial render
    renderTasks();
    updateStatistics();
    
    // Set minimum date for due date inputs to today
    const today = new Date().toISOString().split('T')[0];
    taskDueDate.min = today;
    editTaskDueDate.min = today;
    
    // Add custom styles for animations
    addCustomStyles();
    
    // Show welcome message for first-time users
    if (tasks.length === 0 && !localStorage.getItem('proTaskManagerWelcomed')) {
        setTimeout(() => {
            showNotification('Welcome to Pro Task Manager! 🎉', 'info');
            localStorage.setItem('proTaskManagerWelcomed', 'true');
        }, 1000);
    }
    
    console.log('✅ Pro Task Manager initialized successfully!');
}

/**
 * Add custom CSS styles for animations and notifications
 */
function addCustomStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(100px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        @keyframes slideOutRight {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(100px);
            }
        }
        
        .notification {
            font-family: inherit;
            font-weight: 500;
        }
        
        .task-item.removing {
            animation: fadeOut 0.3s ease-out forwards;
        }
    `;
    document.head.appendChild(style);
}

// ========================
// Application Entry Point
// ========================

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Export functions for potential testing (if in Node.js environment)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        addTask,
        toggleTaskCompletion,
        deleteTask,
        editTask,
        clearCompletedTasks,
        markAllTasksComplete,
        toggleTheme,
        getFilteredAndSortedTasks
    };
} 