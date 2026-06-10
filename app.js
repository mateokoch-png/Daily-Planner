// ── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'mateo_planner_v1';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveState(s) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  window._state = s;
}

function getState() { return window._state; }

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((target - now) / 86400000);
}

function fmtDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning, Mateo';
  if (h < 18) return 'Good afternoon, Mateo';
  return 'Good evening, Mateo';
}

function todayLabel() {
  return new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

function el(id) { return document.getElementById(id); }

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Default Data ──────────────────────────────────────────────────────────────

const DEFAULT_PROJECTS = [
  { id: 'university', name: 'University',          color: '#3B5BDB', icon: '🎓' },
  { id: 'sunken',     name: 'Sunken Robotics',     color: '#0C9488', icon: '🤖' },
  { id: 'berlin',     name: 'EvoLogics / Berlin',  color: '#16A34A', icon: '🏙️' },
  { id: 'minor',      name: 'Minor Planning',      color: '#D97706', icon: '🗺️' },
];

const DEFAULT_TASKS = [
  { id: uid(), projectId: 'university', title: 'Final presentation', dueDate: '', priority: 'high',   done: false, doneDate: null, followUpDays: null, followUpNote: '', followUpDate: null, createdAt: new Date().toISOString() },
  { id: uid(), projectId: 'sunken',     title: 'Prep weekly meeting agenda',   dueDate: '', priority: 'medium', done: false, doneDate: null, followUpDays: null, followUpNote: '', followUpDate: null, createdAt: new Date().toISOString() },
  { id: uid(), projectId: 'berlin',     title: 'Research housing in Berlin',   dueDate: '', priority: 'high',   done: false, doneDate: null, followUpDays: null, followUpNote: '', followUpDate: null, createdAt: new Date().toISOString() },
  { id: uid(), projectId: 'berlin',     title: 'Confirm internship start date', dueDate: '', priority: 'medium', done: false, doneDate: null, followUpDays: null, followUpNote: '', followUpDate: null, createdAt: new Date().toISOString() },
  { id: uid(), projectId: 'minor',      title: 'Research minor options',       dueDate: '', priority: 'medium', done: false, doneDate: null, followUpDays: null, followUpNote: '', followUpDate: null, createdAt: new Date().toISOString() },
  { id: uid(), projectId: 'minor',      title: 'Decide on minor program by January', dueDate: '', priority: 'high', done: false, doneDate: null, followUpDays: null, followUpNote: '', followUpDate: null, createdAt: new Date().toISOString() },
];

function initState() {
  const existing = loadState();
  if (existing) {
    window._state = existing;
  } else {
    window._state = {
      projects: DEFAULT_PROJECTS,
      tasks: DEFAULT_TASKS,
      exams: [],
      todayTaskIds: [],
      dismissedFollowUps: [],
    };
    saveState(window._state);
  }
}

// ── View Router ───────────────────────────────────────────────────────────────

let currentView = 'home';
let currentProjectId = null;

function showView(name) {
  currentView = name;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  if (name === 'home') {
    el('view-home').classList.add('active');
    el('nav-home').classList.add('active');
    renderHome();
  } else if (name === 'project') {
    el('view-project').classList.add('active');
  } else if (name === 'exams') {
    el('view-exams').classList.add('active');
    el('nav-exams').classList.add('active');
    renderExamView();
  }
}

// ── Home Render ───────────────────────────────────────────────────────────────

function renderHome() {
  el('header-greeting').textContent = greeting();
  el('header-date').textContent = todayLabel();
  renderExamStrip();
  renderNudges();
  renderTodayTasks();
  renderProjectCards();
}

// ── Exam Strip ────────────────────────────────────────────────────────────────

function renderExamStrip() {
  const { exams } = getState();
  const strip = el('exam-strip');
  strip.innerHTML = '';

  const sorted = [...exams].sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length === 0) {
    const hint = document.createElement('span');
    hint.className = 'exam-hint';
    hint.textContent = 'No exams yet';
    strip.appendChild(hint);
  }

  sorted.forEach(exam => {
    const days = daysUntil(exam.date);
    const card = document.createElement('div');
    let urgencyClass = '';
    let numClass = '';
    if (days !== null && days <= 7)  { urgencyClass = 'exam-urgent'; numClass = 'c-red'; }
    else if (days !== null && days <= 21) { urgencyClass = 'exam-soon'; numClass = 'c-amber'; }

    card.className = `exam-card ${urgencyClass}`;
    card.innerHTML = `
      <div class="exam-days-num ${numClass}">${days !== null ? days : '?'}</div>
      <div class="exam-days-unit">days</div>
      <div class="exam-card-name">${escHtml(exam.name)}</div>
      <div class="exam-card-date">${fmtDate(exam.date)}</div>
    `;
    strip.appendChild(card);
  });

  const addPill = document.createElement('div');
  addPill.className = 'exam-add-pill';
  addPill.textContent = '+';
  addPill.title = 'Add exam';
  addPill.addEventListener('click', () => showView('exams'));
  strip.appendChild(addPill);
}

// ── Follow-up Nudges ──────────────────────────────────────────────────────────

function renderNudges() {
  const state = getState();
  const todayStr = todayISO();

  const due = state.tasks.filter(t =>
    t.done &&
    t.followUpDate &&
    t.followUpDate <= todayStr &&
    !state.dismissedFollowUps.includes(t.id)
  );

  const section = el('nudge-section');
  const list = el('nudge-list');
  list.innerHTML = '';

  if (due.length === 0) { section.classList.add('hidden'); return; }
  section.classList.remove('hidden');

  due.forEach(task => {
    const proj = state.projects.find(p => p.id === task.projectId);
    const card = document.createElement('div');
    card.className = 'nudge-card';
    card.innerHTML = `
      <div>
        <div class="nudge-title">↩ ${escHtml(task.title)}</div>
        <div class="nudge-sub">${escHtml(task.followUpNote || 'Follow up on this')} · ${escHtml(proj?.name || '')}</div>
      </div>
      <button class="nudge-dismiss" aria-label="Dismiss">✕</button>
    `;
    card.querySelector('.nudge-dismiss').addEventListener('click', () => {
      const s = getState();
      s.dismissedFollowUps.push(task.id);
      saveState(s);
      renderNudges();
    });
    list.appendChild(card);
  });
}

// ── Today Tasks ───────────────────────────────────────────────────────────────

function renderTodayTasks() {
  const state = getState();
  const container = el('today-list');
  container.innerHTML = '';

  const todayTasks = state.todayTaskIds
    .map(id => state.tasks.find(t => t.id === id))
    .filter(Boolean);

  if (todayTasks.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'today-empty';
    empty.textContent = 'Tap to commit to today\'s 3 tasks →';
    empty.addEventListener('click', openTodayPicker);
    container.appendChild(empty);
    return;
  }

  todayTasks.forEach(task => {
    const proj = state.projects.find(p => p.id === task.projectId);
    const item = document.createElement('div');
    item.className = `today-item${task.done ? ' is-done' : ''}`;
    item.innerHTML = `
      <div class="check-circle${task.done ? ' is-done' : ''}" data-id="${task.id}" role="checkbox" aria-checked="${task.done}"></div>
      <div class="today-info">
        <div class="today-title">${escHtml(task.title)}</div>
        <div class="today-meta">${escHtml(proj?.name || '')}${task.dueDate ? ' · ' + fmtDate(task.dueDate) : ''}</div>
      </div>
    `;
    item.querySelector('.check-circle').addEventListener('click', () => toggleTask(task.id));
    container.appendChild(item);
  });
}

// ── Project Cards ─────────────────────────────────────────────────────────────

function renderProjectCards() {
  const state = getState();
  const grid = el('project-grid');
  grid.innerHTML = '';

  state.projects.forEach(project => {
    const pending = state.tasks.filter(t => t.projectId === project.id && !t.done);
    const all = state.tasks.filter(t => t.projectId === project.id);

    const sorted = [...pending].sort((a, b) => {
      const po = { high: 0, medium: 1, low: 2 };
      if (po[a.priority] !== po[b.priority]) return po[a.priority] - po[b.priority];
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      return a.dueDate ? -1 : b.dueDate ? 1 : 0;
    });

    const withDates = pending.filter(t => t.dueDate).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    const nearest = withDates[0];
    const nearestDays = nearest ? daysUntil(nearest.dueDate) : null;

    let badgeClass = '';
    let badgeText = pending.length + ' task' + (pending.length !== 1 ? 's' : '');
    if (nearestDays !== null) {
      if (nearestDays < 0)       { badgeClass = 'urgent'; badgeText = 'Overdue'; }
      else if (nearestDays === 0){ badgeClass = 'urgent'; badgeText = 'Due today'; }
      else if (nearestDays <= 7) { badgeClass = 'soon';   badgeText = `${nearestDays}d left`; }
      else                       { badgeText = `${nearestDays}d left`; }
    }

    const top3 = sorted.slice(0, 3);
    const card = document.createElement('div');
    card.className = 'project-card';
    card.style.borderLeftColor = project.color;

    const previewRows = top3.length === 0
      ? `<div class="all-clear">All clear ✓</div>`
      : top3.map(t => `
          <div class="task-preview-row">
            <div class="p-dot ${t.priority}"></div>
            <div class="task-preview-title">${escHtml(t.title)}</div>
            ${t.dueDate ? `<div class="task-preview-due">${fmtDate(t.dueDate)}</div>` : ''}
          </div>`).join('');

    card.innerHTML = `
      <div class="project-card-top">
        <div class="project-card-name">${escHtml(project.icon)} ${escHtml(project.name)}</div>
        <div class="deadline-badge ${badgeClass}">${badgeText}</div>
      </div>
      ${previewRows}
    `;
    card.addEventListener('click', () => openProject(project.id));
    grid.appendChild(card);
  });
}

// ── Project Detail ────────────────────────────────────────────────────────────

function openProject(projectId) {
  currentProjectId = projectId;
  const state = getState();
  const project = state.projects.find(p => p.id === projectId);

  el('project-title').textContent = `${project.icon} ${project.name}`;
  renderProjectTasks();
  showView('project');
}

function renderProjectTasks() {
  const state = getState();
  const container = el('project-tasks-container');
  container.innerHTML = '';

  const all = state.tasks.filter(t => t.projectId === currentProjectId);

  const pOrder = { high: 0, medium: 1, low: 2 };
  const pending = all.filter(t => !t.done).sort((a, b) => {
    if (pOrder[a.priority] !== pOrder[b.priority]) return pOrder[a.priority] - pOrder[b.priority];
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    return a.dueDate ? -1 : b.dueDate ? 1 : 0;
  });
  const done = all.filter(t => t.done);

  if (all.length === 0) {
    container.innerHTML = '<div class="empty-state">No tasks yet.<br>Tap <strong>+</strong> to add one.</div>';
    return;
  }

  if (pending.length > 0) {
    const lbl = document.createElement('div');
    lbl.className = 'task-section-label';
    lbl.textContent = 'Open';
    container.appendChild(lbl);
    const wrap = document.createElement('div');
    wrap.className = 'task-list-container';
    pending.forEach(t => wrap.appendChild(buildTaskItem(t)));
    container.appendChild(wrap);
  }

  if (done.length > 0) {
    const lbl = document.createElement('div');
    lbl.className = 'task-section-label';
    lbl.textContent = 'Done';
    container.appendChild(lbl);
    const wrap = document.createElement('div');
    wrap.className = 'task-list-container';
    done.forEach(t => wrap.appendChild(buildTaskItem(t)));
    container.appendChild(wrap);
  }
}

function buildTaskItem(task) {
  const item = document.createElement('div');
  item.className = `task-item${task.done ? ' is-done' : ''}`;

  const days = task.dueDate ? daysUntil(task.dueDate) : null;
  let dueClass = 'task-due-chip';
  let dueText = task.dueDate ? fmtDate(task.dueDate) : '';
  if (!task.done && days !== null) {
    if (days < 0)       { dueClass += ' overdue';   dueText = `Overdue · ${fmtDate(task.dueDate)}`; }
    else if (days === 0){ dueClass += ' due-today';  dueText = 'Due today'; }
  }

  const followupChip = (!task.done && task.followUpDays)
    ? `<span class="followup-chip">↩ follow-up in ${task.followUpDays}d</span>` : '';
  const dueChip = dueText ? `<span class="${dueClass}">${escHtml(dueText)}</span>` : '';

  item.innerHTML = `
    <div class="check-circle${task.done ? ' is-done' : ''}" role="checkbox" aria-checked="${task.done}"></div>
    <div class="task-body">
      <div class="task-title">${escHtml(task.title)}</div>
      <div class="task-chips">
        ${dueChip}
        <span class="prio-chip ${task.priority}">${task.priority}</span>
        ${followupChip}
      </div>
    </div>
    <button class="task-menu-btn" aria-label="Edit task">···</button>
  `;

  item.querySelector('.check-circle').addEventListener('click', () => toggleTask(task.id));
  item.querySelector('.task-menu-btn').addEventListener('click', () => openTaskModal(task));
  return item;
}

// ── Task Toggle ───────────────────────────────────────────────────────────────

function toggleTask(taskId) {
  const state = getState();
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;

  task.done = !task.done;
  if (task.done) {
    task.doneDate = todayISO();
    if (task.followUpDays) {
      const d = new Date();
      d.setDate(d.getDate() + parseInt(task.followUpDays));
      task.followUpDate = d.toISOString().slice(0, 10);
    }
  } else {
    task.doneDate = null;
    task.followUpDate = null;
  }

  saveState(state);

  if (currentView === 'project') renderProjectTasks();
  renderTodayTasks();
  renderNudges();
  renderProjectCards();
}

// ── Task Modal ────────────────────────────────────────────────────────────────

let _editingTaskId = null;

function openTaskModal(existingTask = null) {
  _editingTaskId = existingTask?.id || null;
  el('modal-title-text').textContent = existingTask ? 'Edit Task' : 'New Task';
  el('task-title-input').value = existingTask?.title || '';
  el('task-date-input').value = existingTask?.dueDate || '';
  el('task-priority-input').value = existingTask?.priority || 'medium';
  el('task-followup-days').value = existingTask?.followUpDays || '';
  el('task-followup-note').value = existingTask?.followUpNote || '';
  el('modal-task').classList.remove('hidden');
  setTimeout(() => el('task-title-input').focus(), 80);
}

function saveTask() {
  const title = el('task-title-input').value.trim();
  if (!title) { el('task-title-input').focus(); return; }

  const state = getState();
  const followUpDays = parseInt(el('task-followup-days').value) || null;

  if (_editingTaskId) {
    const task = state.tasks.find(t => t.id === _editingTaskId);
    if (task) {
      task.title        = title;
      task.dueDate      = el('task-date-input').value;
      task.priority     = el('task-priority-input').value;
      task.followUpDays = followUpDays;
      task.followUpNote = el('task-followup-note').value.trim();
    }
  } else {
    state.tasks.push({
      id: uid(),
      projectId:    currentProjectId,
      title,
      dueDate:      el('task-date-input').value,
      priority:     el('task-priority-input').value,
      done:         false,
      doneDate:     null,
      followUpDays,
      followUpNote: el('task-followup-note').value.trim(),
      followUpDate: null,
      createdAt:    new Date().toISOString(),
    });
  }

  saveState(state);
  closeModal('modal-task');
  if (currentView === 'project') renderProjectTasks();
  renderProjectCards();
}

function deleteTask() {
  if (!_editingTaskId) return;
  if (!confirm('Delete this task?')) return;
  const state = getState();
  state.tasks = state.tasks.filter(t => t.id !== _editingTaskId);
  state.todayTaskIds = state.todayTaskIds.filter(id => id !== _editingTaskId);
  saveState(state);
  closeModal('modal-task');
  if (currentView === 'project') renderProjectTasks();
  renderProjectCards();
  renderTodayTasks();
}

function closeModal(id) {
  el(id).classList.add('hidden');
  _editingTaskId = null;
}

// ── Today Picker ──────────────────────────────────────────────────────────────

let _selectedToday = [];

function openTodayPicker() {
  const state = getState();
  _selectedToday = [...state.todayTaskIds];

  const list = el('today-picker-list');
  list.innerHTML = '';

  const pending = state.tasks.filter(t => !t.done);
  if (pending.length === 0) {
    list.innerHTML = '<div class="empty-state">No open tasks yet.<br>Add tasks to your projects first.</div>';
  }

  pending.forEach(task => {
    const proj = state.projects.find(p => p.id === task.projectId);
    const isSelected = _selectedToday.includes(task.id);
    const item = document.createElement('div');
    item.className = 'picker-item';
    item.innerHTML = `
      <div class="picker-box${isSelected ? ' selected' : ''}" data-id="${task.id}"></div>
      <div class="picker-info">
        <div class="picker-task-name">${escHtml(task.title)}</div>
        <div class="picker-task-project">${escHtml(proj?.name || '')}</div>
      </div>
    `;
    item.addEventListener('click', () => {
      const id = task.id;
      if (_selectedToday.includes(id)) {
        _selectedToday = _selectedToday.filter(x => x !== id);
      } else if (_selectedToday.length < 3) {
        _selectedToday.push(id);
      }
      list.querySelectorAll('.picker-box').forEach(box => {
        box.classList.toggle('selected', _selectedToday.includes(box.dataset.id));
      });
      el('today-count').textContent = _selectedToday.length;
    });
    list.appendChild(item);
  });

  el('today-count').textContent = _selectedToday.length;
  el('modal-today').classList.remove('hidden');
}

function saveTodayPicker() {
  const state = getState();
  state.todayTaskIds = _selectedToday;
  saveState(state);
  closeModal('modal-today');
  renderTodayTasks();
}

// ── Exam View ─────────────────────────────────────────────────────────────────

function renderExamView() {
  const { exams } = getState();
  const container = el('exam-manage-list');
  container.innerHTML = '';

  const sorted = [...exams].sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length === 0) {
    container.innerHTML = '<div class="empty-state">No exams added yet.<br>Add one below.</div>';
  }

  sorted.forEach(exam => {
    const days = daysUntil(exam.date);
    let color = '';
    if (days !== null && days <= 7)  color = '#EF4444';
    else if (days !== null && days <= 21) color = '#F59E0B';

    const item = document.createElement('div');
    item.className = 'exam-manage-item';
    item.innerHTML = `
      <div>
        <div class="exam-manage-days" style="${color ? 'color:' + color : ''}">${days !== null ? days : '?'}</div>
        <div class="exam-manage-days-unit">days</div>
      </div>
      <div class="exam-manage-info">
        <div class="exam-manage-name">${escHtml(exam.name)}</div>
        <div class="exam-manage-date">${fmtDate(exam.date)}</div>
      </div>
      <button class="exam-delete-btn" aria-label="Delete exam">×</button>
    `;
    item.querySelector('.exam-delete-btn').addEventListener('click', () => {
      const s = getState();
      s.exams = s.exams.filter(e => e.id !== exam.id);
      saveState(s);
      renderExamView();
      renderExamStrip();
    });
    container.appendChild(item);
  });
}

function addExam() {
  const name = el('exam-name-input').value.trim();
  const date = el('exam-date-input').value;
  if (!name || !date) return;

  const state = getState();
  state.exams.push({ id: uid(), name, date });
  saveState(state);

  el('exam-name-input').value = '';
  el('exam-date-input').value = '';

  renderExamView();
  renderExamStrip();
}

// ── Notifications ─────────────────────────────────────────────────────────────

function requestNotifications() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function maybeFireMorningNudge() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const lastNudge = localStorage.getItem('last_nudge');
  const todayStr = todayISO();
  if (lastNudge === todayStr) return;

  const h = new Date().getHours();
  if (h < 7 || h >= 11) return;

  localStorage.setItem('last_nudge', todayStr);
  const state = getState();
  const tasks = state.todayTaskIds
    .map(id => state.tasks.find(t => t.id === id))
    .filter(t => t && !t.done);

  const body = tasks.length > 0
    ? tasks.map(t => '• ' + t.title).join('\n')
    : 'No tasks pinned for today yet.';

  new Notification("Today's plan", { body });
}

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initState();

  // Nav
  el('nav-home').addEventListener('click', () => showView('home'));
  el('nav-exams').addEventListener('click', () => showView('exams'));

  // Back
  el('back-btn').addEventListener('click', () => showView('home'));

  // Add task (project detail)
  el('add-task-btn').addEventListener('click', () => openTaskModal());

  // Today
  el('edit-today-btn').addEventListener('click', openTodayPicker);
  el('today-cancel-btn').addEventListener('click', () => closeModal('modal-today'));
  el('today-save-btn').addEventListener('click', saveTodayPicker);

  // Task modal
  el('task-cancel-btn').addEventListener('click', () => closeModal('modal-task'));
  el('task-save-btn').addEventListener('click', saveTask);
  el('task-delete-btn').addEventListener('click', deleteTask);
  el('task-title-input').addEventListener('keydown', e => { if (e.key === 'Enter') saveTask(); });

  // Exam
  el('exam-add-btn').addEventListener('click', addExam);
  el('exam-name-input').addEventListener('keydown', e => { if (e.key === 'Enter') addExam(); });

  // Backdrop closes
  document.querySelectorAll('.modal-backdrop').forEach(bd => {
    bd.addEventListener('click', () => {
      document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    });
  });

  // Notifications
  requestNotifications();
  maybeFireMorningNudge();

  // Boot
  showView('home');
});
