// Estado de la aplicación
let tasks = {
  q1: [],
  q2: [],
  q3: [],
  q4: []
};

let currentQuadrant = null;
let editingTaskId = null;

const modal = document.getElementById('taskModal');
const taskInput = document.getElementById('taskInput');
const modalTitle = document.getElementById('modalTitle');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');

// Tareas guardadas
loadTasks();
renderAllTasks();

// Event Listeners
document.querySelectorAll('.add-task-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    currentQuadrant = e.target.dataset.quadrant;
    editingTaskId = null;
    openModal();
  });
});
saveBtn.addEventListener('click', saveTask);
cancelBtn.addEventListener('click', closeModal);

taskInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') saveTask();
});

modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});


// Modal
function openModal(taskText = '') {
  modal.classList.add('active');
  taskInput.value = taskText;
  taskInput.focus();
  modalTitle.textContent = editingTaskId ? 'Editar Tarea' : 'Nueva Tarea';
}

function closeModal() {
  modal.classList.remove('active');
  taskInput.value = '';
  currentQuadrant = null;
  editingTaskId = null;
}

// Guardar tarea
function saveTask() {
  const text = taskInput.value.trim();
  
  if (!text) {
    taskInput.focus();
    return;
  }

  if (editingTaskId) {
    // Editar tarea existente
    const task = findTaskById(editingTaskId);
    if (task) {
      task.text = text;
    }
  } else {
    // Crear nueva tarea
    const newTask = {
      id: Date.now().toString(),
      text: text,
      createdAt: new Date().toISOString()
    };
    tasks[currentQuadrant].push(newTask);
  }

  saveTasks();
  renderTasks(currentQuadrant);
  closeModal();
}

// Editar tarea
function editTask(quadrant, taskId) {
  const task = tasks[quadrant].find(t => t.id === taskId);
  if (task) {
    currentQuadrant = quadrant;
    editingTaskId = taskId;
    openModal(task.text);
  }
}

// Eliminar tarea
function deleteTask(quadrant, taskId) {
  tasks[quadrant] = tasks[quadrant].filter(task => task.id !== taskId);
  saveTasks();
  renderTasks(quadrant);
}


// Buscar tarea por ID en todos los cuadrantes
function findTaskById(taskId) {
  for (let quadrant in tasks) {
    const task = tasks[quadrant].find(t => t.id === taskId);
    if (task) return task;
  }
  return null;
}

// Renderizar tareas
function renderTasks(quadrant) {
  const container = document.getElementById(`tasks-${quadrant}`);
  container.innerHTML = '';

  tasks[quadrant].forEach(task => {
    const taskEl = createTaskElement(task, quadrant);
    container.appendChild(taskEl);
  });
}

function renderAllTasks() {
  Object.keys(tasks).forEach(quadrant => renderTasks(quadrant));
}

// Crear elemento de tarea
function createTaskElement(task, quadrant) {
  const taskEl = document.createElement('div');
  taskEl.className = 'task';
  taskEl.draggable = true;
  taskEl.dataset.taskId = task.id;
  taskEl.dataset.quadrant = quadrant;

  taskEl.innerHTML = `
    <div class="task-text">${escapeHtml(task.text)}</div>
    <div class="task-actions">
      <button class="task-btn edit" title="Editar">✏️</button>
      <button class="task-btn delete" title="Eliminar">🗑️</button>
    </div>
  `;

  // Event listeners para botones
  taskEl.querySelector('.edit').addEventListener('click', (e) => {
    e.stopPropagation();
    editTask(quadrant, task.id);
  });

  taskEl.querySelector('.delete').addEventListener('click', (e) => {
    e.stopPropagation();
    if (confirm('¿Eliminar esta tarea?')) {
      deleteTask(quadrant, task.id);
    }
  });

  // Drag and drop
  taskEl.addEventListener('dragstart', handleDragStart);
  taskEl.addEventListener('dragend', handleDragEnd);

  return taskEl;
}

// Drag and Drop
let draggedElement = null;

function handleDragStart(e) {
  draggedElement = e.target;
  e.target.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
  e.target.classList.remove('dragging');
  document.querySelectorAll('.quadrant').forEach(q => {
    q.classList.remove('drag-over');
  });
}

// Agregar event listeners a los cuadrantes
document.querySelectorAll('.quadrant').forEach(quadrant => {
  quadrant.addEventListener('dragover', handleDragOver);
  quadrant.addEventListener('drop', handleDrop);
  quadrant.addEventListener('dragleave', handleDragLeave);
  quadrant.addEventListener('dragenter', handleDragEnter);
});

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.dataTransfer.dropEffect = 'move';
  return false;
}

function handleDragEnter(e) {
  e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
  if (e.target.classList.contains('quadrant')) {
    e.target.classList.remove('drag-over');
  }
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }

  const targetQuadrant = e.currentTarget.dataset.quadrant;
  const sourceQuadrant = draggedElement.dataset.quadrant;
  const taskId = draggedElement.dataset.taskId;

  if (targetQuadrant !== sourceQuadrant) {
    // Mover tarea entre cuadrantes
    const taskIndex = tasks[sourceQuadrant].findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      const [task] = tasks[sourceQuadrant].splice(taskIndex, 1);
      tasks[targetQuadrant].push(task);
      
      saveTasks();
      renderTasks(sourceQuadrant);
      renderTasks(targetQuadrant);
    }
  }

  return false;
}

function saveTasks() {
  localStorage.setItem('eisenhower-tasks', JSON.stringify(tasks));
}

function loadTasks() {
  const saved = localStorage.getItem('eisenhower-tasks');
  if (saved) {
    try {
      tasks = JSON.parse(saved);
    } catch (e) {
      console.error('Error cargando tareas:', e);
    }
  }
}

// Utilidad para escapar HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
