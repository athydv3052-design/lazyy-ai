const $ = (id) => document.getElementById(id);
let tasks = [];
let toastTimer;

function showToast(message) {
  const toast = $('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}

function renderTasks() {
  const list = $('taskList');
  list.replaceChildren();
  if (!tasks.length) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'No tasks yet. Add one small step above.';
    list.appendChild(empty);
  }

  tasks.forEach(task => {
    const row = document.createElement('div');
    row.className = 'task-item' + (task.done ? ' done' : '');
    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = task.done;
    check.setAttribute('aria-label', 'Complete ' + task.text);
    check.addEventListener('change', () => {
      task.done = check.checked;
      renderTasks();
    });
    const text = document.createElement('span');
    text.className = 'task-text';
    text.textContent = task.text;
    const del = document.createElement('button');
    del.className = 'delete-btn';
    del.textContent = '×';
    del.setAttribute('aria-label', 'Delete task');
    del.addEventListener('click', () => {
      tasks = tasks.filter(t => t.id !== task.id);
      renderTasks();
      showToast('Task removed');
    });
    row.append(check, text, del);
    list.appendChild(row);
  });

  const completed = tasks.filter(t => t.done).length;
  const remaining = tasks.length - completed;
  const pct = tasks.length ? Math.round(completed / tasks.length * 100) : 0;
  $('completedCount').textContent = completed;
  $('remainingCount').textContent = remaining;
  $('progressPercent').textContent = pct + '%';
  $('progressBar').style.width = pct + '%';
  $('progressText').textContent = `${completed} of ${tasks.length} completed`;
  $('progressCaption').textContent = pct + '%';
  updateReport();
}

$('taskForm').addEventListener('submit', event => {
  event.preventDefault();
  const text = $('taskInput').value.trim();
  if (!text) return;
  tasks.push({ id: Date.now() + Math.random(), text, done: false });
  $('taskInput').value = '';
  renderTasks();
  showToast('A small step added ✨');
});

$('organizeBtn').addEventListener('click', () => {
  const raw = $('notesInput').value.trim();
  if (!raw) {
    showToast('Add a few notes first.');
    $('notesInput').focus();
    return;
  }
  const lines = [...new Set(raw.split(/\n|(?<=[.!?])\s+/).map(s => s.replace(/^[-•*]\s*/, '').trim()).filter(Boolean))];
  const out = $('notesOutput');
  out.replaceChildren();
  const title = document.createElement('h4');
  title.textContent = 'Your organized notes';
  const summary = document.createElement('p');
  summary.textContent = `Found ${lines.length} action item${lines.length === 1 ? '' : 's'}. Review them, then add them to your task list.`;
  const ul = document.createElement('ul');
  lines.forEach(line => {
    const li = document.createElement('li');
    li.textContent = line;
    ul.appendChild(li);
  });
  const actions = document.createElement('div');
  actions.className = 'result-actions';
  const add = document.createElement('button');
  add.className = 'button primary';
  add.textContent = 'Add all to my tasks';
  add.addEventListener('click', () => {
    lines.forEach(text => tasks.push({ id: Date.now() + Math.random(), text, done: false }));
    renderTasks();
    out.classList.add('hidden');
    $('tasks').scrollIntoView({ behavior: 'smooth' });
    showToast('Notes added to your tasks');
  });
  actions.appendChild(add);
  out.append(title, summary, ul, actions);
  out.classList.remove('hidden');
});

$('clearBtn').addEventListener('click', () => {
  $('notesInput').value = '';
  $('notesOutput').replaceChildren();
  $('notesOutput').classList.add('hidden');
});

function categoryFor(name) {
  const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : '';
  if (['jpg','jpeg','png','gif','webp','svg','heic'].includes(ext)) return 'Images';
  if (['pdf','doc','docx','txt','ppt','pptx','xls','xlsx','csv'].includes(ext)) return 'Documents';
  if (['mp3','wav','mp4','mov','mkv','avi'].includes(ext)) return 'Media';
  if (['zip','rar','7z','tar','gz'].includes(ext)) return 'Archives';
  if (['js','html','css','py','java','c','cpp','json'].includes(ext)) return 'Code';
  return 'Other files';
}

function renderFiles(files) {
  const output = $('fileOutput');
  output.replaceChildren();
  if (!files.length) {
    const p = document.createElement('p');
    p.className = 'empty';
    p.textContent = 'Your suggested folders will appear here.';
    output.appendChild(p);
    return;
  }
  const groups = {};
  files.forEach(file => {
    const category = categoryFor(file.name);
    (groups[category] ||= []).push(file.name);
  });
  Object.entries(groups).forEach(([category, names]) => {
    const card = document.createElement('div');
    card.className = 'file-group';
    const h = document.createElement('h4');
    h.textContent = `📁 ${category} · ${names.length}`;
    const p = document.createElement('p');
    p.textContent = names.join(' · ');
    card.append(h, p);
    output.appendChild(card);
  });
  const note = document.createElement('p');
  note.className = 'fine-print';
  note.textContent = 'Preview only: files have not been moved, renamed, or uploaded.';
  output.appendChild(note);
}
$('fileInput').addEventListener('change', e => renderFiles(Array.from(e.target.files)));

const dropZone = $('dropZone');
dropZone.addEventListener('dragover', e => {
  e.preventDefault();
  dropZone.classList.add('dragging');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragging'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('dragging');
  renderFiles(Array.from(e.dataTransfer.files || []));
});

function updateReport() {
  const pending = tasks.filter(t => !t.done);
  const focus = $('focusList');
  focus.replaceChildren();
  if (!pending.length) {
    const li = document.createElement('li');
    li.textContent = tasks.length ? 'You are all caught up. Take a break!' : 'Add a task to get started.';
    focus.appendChild(li);
  } else {
    pending.slice(0, 3).forEach(task => {
      const li = document.createElement('li');
      li.textContent = task.text;
      focus.appendChild(li);
    });
  }
  $('waitText').textContent = pending.length > 3
    ? `${pending.length - 3} other task(s) can wait until you finish your first priorities.`
    : 'Not everything needs to happen right now.';
}
$('refreshReport').addEventListener('click', () => {
  updateReport();
  showToast('Your daily report is refreshed 🌿');
});

$('themeToggle').addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const dark = document.body.classList.contains('dark');
  $('themeToggle').textContent = dark ? '☀' : '☾';
  $('themeToggle').setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
});

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    document.querySelectorAll('.nav-link').forEach(item => item.classList.remove('active'));
    link.classList.add('active');
  });
});

renderTasks();
