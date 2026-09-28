const STORAGE_KEY = 'orbita-demo-v1';
const members = [
  { id: 'jorge', name: 'Jorge', role: 'Diseño de producto', initials: 'J', tint: 'lime' },
  { id: 'edison', name: 'Edision', role: 'Investigación', initials: 'E', tint: 'mint' },
  { id: 'antony', name: 'Antony', role: 'Operaciones', initials: 'A', tint: 'orange' }
];
const today = new Date();
today.setHours(0, 0, 0, 0);
const dateKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const shiftDate = (date, offset) => { const next = new Date(date); next.setDate(next.getDate() + offset); return next; };
const prettyDate = (date, options = { weekday: 'long', day: 'numeric', month: 'long' }) => new Intl.DateTimeFormat('es-ES', options).format(date);
const clone = value => JSON.parse(JSON.stringify(value));

function initialState() {
  const start = dateKey(today);
  const daysAgo = dateKey(shiftDate(today, -1));
  const dayBefore = dateKey(shiftDate(today, -2));
  return {
    activeId: 'jorge',
    users: {
      jorge: {
        tasks: [
          { id: 's1', title: 'Revisar flujo de incorporación', time: '09:30', minutes: 60, tag: 'DISEÑO', done: true, date: start },
          { id: 's2', title: 'Prototipo de vista semanal', time: '11:00', minutes: 90, tag: 'FOCO', done: false, date: start },
          { id: 's3', title: 'Sincronización con el equipo', time: '14:30', minutes: 30, tag: 'REUNIÓN', done: false, date: start },
          { id: 's4', title: 'Notas de investigación', time: '16:00', minutes: 45, tag: 'PERSONAL', done: false, date: start },
          { id: 's5', title: 'Lectura y referencias', time: '10:00', minutes: 45, tag: 'FOCO', done: true, date: daysAgo },
          { id: 's6', title: 'Preparar retrospectiva', time: '13:00', minutes: 60, tag: 'EQUIPO', done: true, date: daysAgo },
          { id: 's7', title: 'Plan semanal', time: '09:00', minutes: 30, tag: 'PERSONAL', done: true, date: dayBefore }
        ],
        logs: [
          { id: 'l1', date: daysAgo, time: '17:42', title: 'Un ritmo más claro', text: 'La mañana rindió mejor cuando dejé una sola prioridad visible. El prototipo avanzó sin saltar entre tareas; repetir ese margen de concentración mañana.', mood: 'En calma' },
          { id: 'l2', date: dayBefore, time: '18:15', title: 'Pequeños avances', text: 'Conversación útil con el equipo. Salgo con dos preguntas concretas para validar antes de seguir diseñando.', mood: 'Con energía' }
        ]
      },
      edison: {
        tasks: [
          { id: 'l3', title: 'Síntesis de entrevistas', time: '09:00', minutes: 90, tag: 'INVESTIGACIÓN', done: true, date: start },
          { id: 'l4', title: 'Revisión de hallazgos', time: '11:30', minutes: 60, tag: 'EQUIPO', done: true, date: start },
          { id: 'l5', title: 'Mapa de oportunidades', time: '14:00', minutes: 90, tag: 'FOCO', done: false, date: start },
          { id: 'l6', title: 'Lectura de estudios', time: '10:00', minutes: 120, tag: 'INVESTIGACIÓN', done: true, date: daysAgo }
        ], logs: [{ id: 'l7', date: daysAgo, time: '18:05', title: 'Cierre del día', text: 'Las entrevistas abrieron líneas nuevas de trabajo.', mood: 'Curioso' }]
      },
      antony: {
        tasks: [
          { id: 'm1', title: 'Plan de lanzamiento', time: '09:30', minutes: 60, tag: 'PLANIFICACIÓN', done: true, date: start },
          { id: 'm2', title: 'Alinear dependencias', time: '12:00', minutes: 45, tag: 'EQUIPO', done: true, date: start },
          { id: 'm3', title: 'Actualizar cronograma', time: '15:00', minutes: 60, tag: 'OPERACIONES', done: false, date: start },
          { id: 'm4', title: 'Seguimiento de hitos', time: '10:00', minutes: 90, tag: 'OPERACIONES', done: true, date: daysAgo }
        ], logs: [{ id: 'm5', date: daysAgo, time: '17:30', title: 'Buen cierre', text: 'Los hitos de esta semana ya están más claros.', mood: 'Enfocada' }]
      }
    }
  };
}

const legacyAccountIds = { sofia: 'jorge', leo: 'edison', mara: 'antony' };
const adminId = 'admin';
let state;
try {
  const storedState = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  const seedState = initialState();
  const storedUsers = storedState.users || {};
  const users = { ...seedState.users };
  members.forEach((member, index) => {
    const legacyId = ['sofia', 'leo', 'mara'][index];
    users[member.id] = storedUsers[member.id] || storedUsers[legacyId] || seedState.users[member.id];
  });
  const storedActiveId = legacyAccountIds[storedState.activeId] || storedState.activeId;
  state = {
    ...seedState,
    ...storedState,
    activeId: storedActiveId === adminId || members.some(member => member.id === storedActiveId) ? storedActiveId : 'jorge',
    users
  };
} catch { state = initialState(); }
let currentView = 'hoy';
let selectedDate = new Date(today);
let toastTimer;
const root = document.querySelector('#app-view');
const activeMember = () => members.find(member => member.id === state.activeId);
const userData = id => state.users[id];
const persist = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const sortedTasks = tasks => [...tasks].sort((a, b) => a.time.localeCompare(b.time));
const humanDuration = minutes => minutes >= 60 ? `${Math.floor(minutes / 60)} h${minutes % 60 ? ` ${minutes % 60} min` : ''}` : `${minutes} min`;

function allMetrics() {
  const allTasks = members.flatMap(member => userData(member.id).tasks);
  const weekStart = new Date(today);
  const weekday = (weekStart.getDay() + 6) % 7;
  weekStart.setDate(weekStart.getDate() - weekday);
  const weekStartKey = dateKey(weekStart);
  const weekEndKey = dateKey(shiftDate(weekStart, 6));
  const weekTasks = allTasks.filter(task => task.date >= weekStartKey && task.date <= weekEndKey);
  const completed = weekTasks.filter(task => task.done).length;
  const totalMinutes = weekTasks.filter(task => task.done).reduce((sum, task) => sum + task.minutes, 0);
  return { allTasks, weekTasks, totalMinutes, completed, completion: weekTasks.length ? Math.round(completed / weekTasks.length * 100) : 0 };
}

function syncShell() {
  const admin = state.activeId === adminId;
  document.querySelectorAll('.nav-item').forEach(button => button.classList.toggle('active', button.dataset.view === currentView));
  document.querySelector('#top-context').textContent = admin ? 'PANEL DE ADMINISTRACIÓN' : currentView === 'hoy' ? 'MI DÍA' : currentView === 'calendario' ? 'CALENDARIO' : 'BITÁCORA';
  document.querySelector('#today-stamp').textContent = prettyDate(today, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
  document.querySelector('#account-name').textContent = admin ? 'Administración' : activeMember().name;
  document.querySelector('#account-role').textContent = admin ? 'Métricas globales' : 'Mi espacio privado';
  document.querySelector('#account-avatar').textContent = admin ? 'A' : activeMember().initials;
  document.querySelector('#account-avatar').style.background = admin ? '#30413b' : '';
  const hours = allMetrics().totalMinutes / 60;
  document.querySelector('#sidebar-hours').innerHTML = `${hours.toFixed(1)}<small> h</small>`;
  const menu = document.querySelector('#account-menu');
  menu.innerHTML = `${members.map(member => `<button class="account-option ${state.activeId === member.id ? 'selected' : ''}" data-account="${member.id}"><span class="user-avatar">${member.initials}</span>${member.name}<span>CUENTA</span></button>`).join('')}<button class="account-option ${admin ? 'selected' : ''}" data-account="admin"><span class="user-avatar">A</span>Administración<span>ADMIN</span></button>`;
}

function heading(eyebrow, title, subtitle, actions = '') {
  return `<div class="page-heading"><div><div class="section-eyebrow"><span class="eyebrow-dot"></span>${eyebrow}</div><h1>${title}</h1><p class="heading-subtitle">${subtitle}</p></div>${actions ? `<div class="heading-actions">${actions}</div>` : ''}</div>`;
}

function weekTasksForUser() {
  const start = new Date(today);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const from = dateKey(start), to = dateKey(shiftDate(start, 6));
  return userData(state.activeId).tasks.filter(task => task.date >= from && task.date <= to);
}

function renderToday() {
  const dayKey = dateKey(selectedDate);
  const tasks = sortedTasks(userData(state.activeId).tasks.filter(task => task.date === dayKey));
  const done = tasks.filter(task => task.done).length;
  const minutes = tasks.reduce((sum, task) => sum + task.minutes, 0);
  const completeMinutes = tasks.filter(task => task.done).reduce((sum, task) => sum + task.minutes, 0);
  const headingActions = `<div class="date-controls"><button class="arrow-button" data-date-shift="-1" aria-label="Día anterior">‹</button><span>${escapeHtml(prettyDate(selectedDate, { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase())}</span><button class="arrow-button" data-date-shift="1" aria-label="Día siguiente">›</button></div><button class="button primary" data-action="add-task"><span class="button-icon">+</span>Nueva tarea</button>`;
  const taskRows = tasks.length ? tasks.map(task => `<div class="task-row ${task.done ? 'done' : ''}"><button class="check-task" data-toggle-task="${task.id}" aria-label="${task.done ? 'Marcar pendiente' : 'Completar'}: ${escapeHtml(task.title)}">${task.done ? '✓' : ''}</button><div class="task-copy"><div class="task-name">${escapeHtml(task.title)}</div><div class="task-meta"><span>${escapeHtml(task.time)}</span><span>·</span><span class="task-tag ${task.tag === 'REUNIÓN' ? 'orange' : task.tag === 'PERSONAL' ? 'blue' : ''}">${escapeHtml(task.tag)}</span></div></div><span class="task-duration">${humanDuration(task.minutes)}</span></div>`).join('') : '<div class="empty-state"><span>◷</span>No hay tareas para este día.<br>Deja espacio para lo que importa.</div>';
  const currentWeek = weekTasksForUser();
  const completedWeek = currentWeek.filter(task => task.done).length;
  const todayTimeline = tasks.slice(0, 4).map(task => `<div class="time-row"><span class="time-label">${escapeHtml(task.time)}</span><div class="time-event">${escapeHtml(task.title)}<small>${humanDuration(task.minutes)} · ${escapeHtml(task.tag.toLowerCase())}</small></div></div>`).join('') || '<div class="empty-state">Tu agenda está abierta.</div>';
  root.innerHTML = `${heading('LUNES, UNA COSA A LA VEZ', `Hola, ${escapeHtml(activeMember().name.split(' ')[0])}<em>.</em>`, 'Un buen día empieza dejando espacio para pensar.', headingActions)}
    <div class="dashboard-grid"><section class="panel"><div class="panel-head"><h2 class="panel-title"><span class="eyebrow-dot"></span>Tareas del día</h2><span class="panel-count">${done} / ${tasks.length} LISTAS</span></div><div class="task-progress"><span style="width:${tasks.length ? done / tasks.length * 100 : 0}%"></span></div><div class="task-list">${taskRows}</div><div class="panel-foot"><span class="panel-foot-note">${tasks.length ? `${humanDuration(completeMinutes)} completados · ${humanDuration(Math.max(minutes - completeMinutes, 0))} por delante` : 'Añade tareas para dar forma a tu día'}</span><button class="button small" data-view="calendario">Ver calendario ↗</button></div></section>
    <div class="side-stack"><section class="panel day-summary"><div class="summary-top"><div><div class="summary-date">${escapeHtml(prettyDate(selectedDate, { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase())}</div><div class="summary-focus">Tiempo reservado hoy</div></div><span class="eyebrow-dot"></span></div><div class="summary-hours">${(minutes / 60).toFixed(1)}<small> h</small></div><div class="summary-bottom"><span>Progreso semanal</span><b>${currentWeek.length ? Math.round(completedWeek / currentWeek.length * 100) : 0}%</b></div></section><section class="panel timeline-panel"><div class="panel-head"><h2 class="panel-title">En tu agenda</h2><span class="panel-count">${tasks.length} BLOQUES</span></div><div class="timeline">${todayTimeline}</div></section></div></div>`;
}

function mondayOf(date) { const result = new Date(date); result.setDate(result.getDate() - ((result.getDay() + 6) % 7)); return result; }
function renderCalendar() {
  const weekStart = mondayOf(selectedDate);
  const weekEnd = shiftDate(weekStart, 6);
  const weekNames = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
  const weekStrip = weekNames.map((name, index) => {
    const date = shiftDate(weekStart, index), key = dateKey(date);
    const count = userData(state.activeId).tasks.filter(task => task.date === key).length;
    return `<button class="week-day ${key === dateKey(selectedDate) ? 'selected' : ''}" data-select-date="${key}"><span class="week-day-label">${name}</span><div class="week-day-number">${date.getDate()}</div><span class="week-day-dots">${Array.from({ length: Math.min(count, 3) }, () => '<i></i>').join('')}</span></button>`;
  }).join('');
  const tasks = sortedTasks(userData(state.activeId).tasks.filter(task => task.date === dateKey(selectedDate)));
  const dateLabel = prettyDate(selectedDate, { weekday: 'long', day: 'numeric', month: 'long' });
  const taskMarkup = tasks.length ? tasks.map(task => `<div class="calendar-task ${task.done ? 'done' : ''}"><button class="check-task" data-toggle-task="${task.id}" aria-label="${task.done ? 'Marcar pendiente' : 'Completar'}: ${escapeHtml(task.title)}">${task.done ? '✓' : ''}</button><span class="task-duration">${escapeHtml(task.time)}</span><div class="task-copy"><div class="task-name">${escapeHtml(task.title)}</div><div class="task-meta"><span class="task-tag">${escapeHtml(task.tag)}</span></div></div><span class="task-duration">${humanDuration(task.minutes)}</span></div>`).join('') : '<div class="empty-state"><span>▦</span>Sin tareas para esta fecha.</div>';
  root.innerHTML = `${heading('PLANIFICA CON PERSPECTIVA', 'Tu calendario<em>.</em>', 'Una semana a la vista, un día a la vez.', `<div class="date-controls"><button class="arrow-button" data-week-shift="-7" aria-label="Semana anterior">‹</button><span>${escapeHtml(prettyDate(weekStart, { day: 'numeric', month: 'short' }).toUpperCase())} — ${escapeHtml(prettyDate(weekEnd, { day: 'numeric', month: 'short' }).toUpperCase())}</span><button class="arrow-button" data-week-shift="7" aria-label="Semana siguiente">›</button></div><button class="button primary" data-action="add-task"><span class="button-icon">+</span>Nueva tarea</button>`)}<div class="week-strip">${weekStrip}</div><div class="calendar-layout"><section class="panel"><div class="panel-head"><h2 class="panel-title">${escapeHtml(dateLabel)}</h2><span class="panel-count">${tasks.length} TAREAS</span></div><div class="calendar-list">${taskMarkup}</div><div class="panel-foot"><span class="panel-foot-note">Las tareas y sus tiempos son tuyos.</span><span class="panel-count">${humanDuration(tasks.reduce((sum, task) => sum + task.minutes, 0))} RESERVADOS</span></div></section><aside class="panel calendar-side"><h3>Semana en perspectiva</h3><p>Los puntos marcan los días con actividad. Selecciona una fecha para revisar o completar tus tareas.</p><div class="privacy-callout"><b>Privacidad por diseño.</b><br>Tus notas personales nunca aparecen en informes globales.</div></aside></div>`;
}

function renderLogbook() {
  const logs = [...userData(state.activeId).logs].sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
  const entries = logs.length ? logs.map(log => `<article class="log-entry"><div class="log-entry-meta"><span>${escapeHtml(prettyDate(new Date(`${log.date}T12:00:00`), { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase())} · ${escapeHtml(log.time)}</span><span class="private-badge">▣ PRIVADO</span></div><h3>${escapeHtml(log.title)}</h3><p>${escapeHtml(log.text)}</p><div class="task-meta"><span class="task-tag blue">${escapeHtml(log.mood)}</span></div></article>`).join('') : '<div class="empty-state"><span>≡</span>Aún no hay entradas.<br>Este espacio es solo tuyo.</div>';
  root.innerHTML = `${heading('UN ESPACIO SOLO TUYO', 'Bitácora<em>.</em>', 'Guarda lo que no cabe en una lista de tareas.')}<div class="logbook-layout"><section class="panel"><div class="panel-head"><h2 class="panel-title">Tus entradas</h2><span class="panel-count">${logs.length} REGISTROS</span></div><div class="log-entries">${entries}</div></section><form class="panel compose-panel" id="log-form"><h2>Una pausa para registrar</h2><p>Escribe una reflexión, un aprendizaje o aquello que quieras recordar.</p><label class="field-label" for="log-title">TÍTULO</label><input class="field-input" id="log-title" name="title" placeholder="¿Qué te gustaría recordar?" maxlength="80" required><label class="field-label" for="log-text">ENTRADA</label><textarea class="field-textarea" id="log-text" name="text" placeholder="Empieza por lo que tienes en mente..." maxlength="1200" required></textarea><label class="field-label" for="log-mood">¿CÓMO TE SIENTES?</label><select class="field-select" id="log-mood" name="mood"><option>En calma</option><option>Con energía</option><option>Enfocada</option><option>Curioso</option><option>Reflexiva</option><option>Otro</option></select><div class="compose-footer"><span class="compose-hint">Solo visible en tu cuenta</span><button class="button primary" type="submit">Guardar entrada <span>↗</span></button></div><div class="privacy-callout"><b>Datos locales de demostración.</b><br>Las entradas se separan por cuenta en este navegador y no se incluyen en métricas. Esto no sustituye el aislamiento seguro de un servidor.</div></form></div>`;
}

function renderAdmin() {
  const metrics = allMetrics();
  const hours = metrics.totalMinutes / 60;
  const daily = Array.from({ length: 7 }, (_, index) => {
    const date = shiftDate(mondayOf(today), index), key = dateKey(date);
    return { label: ['L', 'M', 'X', 'J', 'V', 'S', 'D'][index], hours: metrics.weekTasks.filter(task => task.date === key && task.done).reduce((sum, task) => sum + task.minutes, 0) / 60 };
  });
  const max = Math.max(1, ...daily.map(item => item.hours));
  const points = daily.map((item, index) => `${26 + index * 88},${142 - item.hours / max * 115}`).join(' ');
  const areaPoints = `26,150 ${points} 554,150`;
  const roster = members.map(member => {
    const tasks = metrics.weekTasks.filter(task => userData(member.id).tasks.includes(task));
    const done = tasks.filter(task => task.done).length;
    const minutes = tasks.filter(task => task.done).reduce((sum, task) => sum + task.minutes, 0);
    const rate = tasks.length ? Math.round(done / tasks.length * 100) : 0;
    return `<div class="roster-row"><div class="user-cell"><span class="user-avatar">${member.initials}</span><span><b>${member.name}</b><small>${member.role}</small></span></div><div class="roster-stats">${rate}%<small>${(minutes / 60).toFixed(1)} h · ${done}/${tasks.length}</small></div></div>`;
  }).join('');
  root.innerHTML = `${heading('VISIÓN DE EQUIPO', 'Rendimiento<em>.</em>', 'Métricas agregadas de esta semana, sin acceso al contenido personal.')}<div class="admin-banner"><div><div class="admin-banner-title">Vista de administración <span class="private-badge">SOLO AGREGADOS</span></div><p>Las entradas de bitácora y los textos de las tareas no se muestran aquí. Las horas son estimaciones según la duración de tareas completadas.</p></div><span class="admin-shield">⌑</span></div><div class="metrics-grid"><article class="metric-card"><div class="metric-label">TAREAS COMPLETADAS <span>↗</span></div><div class="metric-value">${metrics.completion}<small style="font-size:13px;color:#a3afa4">%</small></div><div class="metric-caption">${metrics.completed} de ${metrics.weekTasks.length} tareas</div></article><article class="metric-card"><div class="metric-label">HORAS COMPLETADAS <span>◷</span></div><div class="metric-value">${hours.toFixed(1)}<small style="font-size:13px;color:#a3afa4"> h</small></div><div class="metric-caption">duración estimada · ${members.length} cuentas</div></article><article class="metric-card"><div class="metric-label">TAREAS EN CURSO <span>◎</span></div><div class="metric-value">${metrics.weekTasks.length - metrics.completed}</div><div class="metric-caption">en la semana actual</div></article><article class="metric-card"><div class="metric-label">PROMEDIO COMPLETADO / PERSONA <span>⌁</span></div><div class="metric-value">${(hours / members.length).toFixed(1)}<small style="font-size:13px;color:#a3afa4"> h</small></div><div class="metric-caption">horas estimadas completadas</div></article></div><div class="admin-grid"><section class="panel chart-panel"><div class="chart-header"><div><h2>Actividad del equipo</h2><p>Horas estimadas en tareas completadas · semana actual</p></div><span class="chart-total">${hours.toFixed(1)} H TOTAL</span></div><div class="chart"><svg viewBox="0 0 580 160" preserveAspectRatio="none" role="img" aria-label="Gráfico de horas estimadas de tareas completadas por día"><defs><linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#cbf36a" stop-opacity=".22"/><stop offset="1" stop-color="#cbf36a" stop-opacity="0"/></linearGradient></defs><polygon points="${areaPoints}" fill="url(#chart-fill)"/><polyline points="${points}" fill="none" stroke="#cbf36a" stroke-width="2" vector-effect="non-scaling-stroke"/>${daily.map((item, index) => `<circle cx="${26 + index * 88}" cy="${142 - item.hours / max * 115}" r="3" fill="#cbf36a"/>`).join('')}</svg></div><div class="chart-labels">${daily.map(item => `<span>${item.label}</span>`).join('')}</div></section><section class="panel roster-panel"><h2>Por cuenta</h2><p>Resumen individual · solo cifras</p>${roster}<div class="privacy-footer"><b>Privacidad preservada.</b> El panel no puede consultar bitácoras, títulos ni textos de tareas.</div></section></div>`;
}

function render() {
  syncShell();
  if (state.activeId === adminId) renderAdmin();
  else if (currentView === 'hoy') renderToday();
  else if (currentView === 'calendario') renderCalendar();
  else renderLogbook();
}

function showToast(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2400);
}

function openTaskModal() {
  if (document.querySelector('.modal-backdrop')) return;
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `<form class="modal" id="task-form"><div class="modal-head"><h2>Nueva tarea</h2><button type="button" class="modal-close" data-close-modal aria-label="Cerrar">×</button></div><div class="modal-body"><label class="field-label" for="task-title">TÍTULO</label><input class="field-input" id="task-title" name="title" placeholder="¿Qué quieres avanzar?" maxlength="100" required autofocus><label class="field-label" for="task-time">HORA</label><input class="field-input" id="task-time" name="time" type="time" value="10:00" required><label class="field-label" for="task-minutes">TIEMPO RESERVADO</label><select class="field-select" id="task-minutes" name="minutes"><option value="15">15 minutos</option><option value="30">30 minutos</option><option value="45">45 minutos</option><option value="60" selected>1 hora</option><option value="90">1 hora 30 min</option><option value="120">2 horas</option></select><label class="field-label" for="task-tag">CATEGORÍA</label><select class="field-select" id="task-tag" name="tag"><option>FOCO</option><option>PERSONAL</option><option>REUNIÓN</option><option>EQUIPO</option><option>OTRO</option></select><div class="modal-actions"><button type="button" class="button" data-close-modal>Cancelar</button><button class="button primary" type="submit">Añadir tarea</button></div></div></form>`;
  document.body.append(backdrop);
  backdrop.querySelector('#task-title').focus();
}

document.querySelectorAll('.nav-item').forEach(button => button.addEventListener('click', () => {
  if (state.activeId === adminId) { state.activeId = 'sofia'; persist(); }
  currentView = button.dataset.view;
  render();
}));
root.addEventListener('click', event => {
  const viewButton = event.target.closest('[data-view]');
  if (viewButton) { currentView = viewButton.dataset.view; render(); return; }
  const toggle = event.target.closest('[data-toggle-task]');
  if (toggle) {
    const task = userData(state.activeId).tasks.find(item => item.id === toggle.dataset.toggleTask);
    if (task) { task.done = !task.done; persist(); render(); }
    return;
  }
  const shift = event.target.closest('[data-date-shift]');
  if (shift) { selectedDate = shiftDate(selectedDate, Number(shift.dataset.dateShift)); render(); return; }
  const weekShift = event.target.closest('[data-week-shift]');
  if (weekShift) { selectedDate = shiftDate(selectedDate, Number(weekShift.dataset.weekShift)); render(); return; }
  const selectDate = event.target.closest('[data-select-date]');
  if (selectDate) { selectedDate = new Date(`${selectDate.dataset.selectDate}T12:00:00`); render(); return; }
  if (event.target.closest('[data-action="add-task"]')) openTaskModal();
});
document.querySelector('#account-switch').addEventListener('click', () => {
  const menu = document.querySelector('#account-menu');
  const open = menu.hidden;
  menu.hidden = !open;
  document.querySelector('#account-switch').setAttribute('aria-expanded', String(open));
});
document.querySelector('#account-menu').addEventListener('click', event => {
  const option = event.target.closest('[data-account]');
  if (!option) return;
  state.activeId = option.dataset.account;
  currentView = 'hoy';
  document.querySelector('#account-menu').hidden = true;
  document.querySelector('#account-switch').setAttribute('aria-expanded', 'false');
  persist(); render();
});
document.addEventListener('click', event => {
  const backdrop = event.target.closest('.modal-backdrop');
  if (event.target.closest('[data-close-modal]') || (backdrop && event.target === backdrop)) backdrop?.remove();
});
document.addEventListener('submit', event => {
  if (event.target.id === 'task-form') {
    event.preventDefault();
    const form = new FormData(event.target);
    const task = { id: `task-${Date.now()}`, title: String(form.get('title')).trim(), time: String(form.get('time')), minutes: Number(form.get('minutes')), tag: String(form.get('tag')), done: false, date: dateKey(selectedDate) };
    userData(state.activeId).tasks.push(task);
    persist(); document.querySelector('.modal-backdrop').remove(); render(); showToast('Tarea añadida a tu día.');
  }
  if (event.target.id === 'log-form') {
    event.preventDefault();
    const form = new FormData(event.target);
    userData(state.activeId).logs.push({ id: `log-${Date.now()}`, date: dateKey(today), time: new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(new Date()), title: String(form.get('title')).trim(), text: String(form.get('text')).trim(), mood: String(form.get('mood')) });
    persist(); render(); showToast('Entrada guardada en tu bitácora privada.');
  }
});
document.querySelector('#help-button').addEventListener('click', () => {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `<section class="modal"><div class="modal-head"><h2>Privacidad y datos</h2><button class="modal-close" data-close-modal aria-label="Cerrar">×</button></div><div class="help-content"><b>En esta demo</b>, las cuentas y sus datos se guardan en el almacenamiento local de este navegador. La vista de administración calcula totales y no renderiza textos personales.<br><br>Para uso real multiusuario, hacen falta autenticación, autorización en servidor y almacenamiento aislado por usuario. El navegador local no es una frontera de seguridad.</div></section>`;
  document.body.append(backdrop);
});
render();
