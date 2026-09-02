import { auth, authReady, db } from './firebase-config.js';
import { collection, doc, getDoc, getDocs, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';

const STORAGE_KEY = 'fitnessAppStateV1';
const CALENDAR_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

let currentEditActivity = null;

const state = loadState();
const elements = {
  navButtons: document.querySelectorAll('.nav-btn'),
  modePanels: document.querySelectorAll('.mode-panel'),
  planName: document.getElementById('plan-name'),
  planSelect: document.getElementById('plan-select'),
  sessionType: document.getElementById('session-type'),
  sessionName: document.getElementById('session-name'),
  sectionName: document.getElementById('section-name'),
  activityName: document.getElementById('activity-name'),
  activitySets: document.getElementById('activity-sets'),
  activityReps: document.getElementById('activity-reps'),
  activityRest: document.getElementById('activity-rest'),
  activityRpe: document.getElementById('activity-rpe'),
  activityLinks: document.getElementById('activity-links'),
  activityNotes: document.getElementById('activity-notes'),
  ptSessionSelect: document.getElementById('pt-session-select'),
  sectionSessionSelect: document.getElementById('section-session-select'),
  activitySectionSelect: document.getElementById('activity-section-select'),
  planOverview: document.getElementById('plan-overview'),
  saveCloudBtn: document.getElementById('save-cloud-btn'),
  saveNewCloudBtn: document.getElementById('save-new-cloud-btn'),
  loadCloudBtn: document.getElementById('load-cloud-btn'),
  cloudPlanSelect: document.getElementById('cloud-plan-select'),
  cloudNewPlanName: document.getElementById('cloud-new-plan-name'),
  cloudStatus: document.getElementById('cloud-status'),
  calendarSessionList: document.getElementById('calendar-session-list'),
  calendarDays: document.getElementById('calendar-days'),
  trainingPlanSelect: document.getElementById('training-plan-select'),
  trainingSessionSelect: document.getElementById('training-session-select'),
  trainingSessionDisplay: document.getElementById('training-session-display'),
  reportingOutput: document.getElementById('reporting-output'),
  createPlanBtn: document.getElementById('create-plan-btn'),
  deletePlanBtn: document.getElementById('delete-plan-btn'),
  createSessionBtn: document.getElementById('create-session-btn'),
  createSectionBtn: document.getElementById('create-section-btn'),
  addActivityBtn: document.getElementById('add-activity-btn'),
  cancelActivityEditBtn: document.getElementById('cancel-activity-edit-btn'),
  exportJsonPlan: document.getElementById('export-json-plan'),
  importJsonPlan: document.getElementById('import-json-plan'),
  exportCsvLogs: document.getElementById('export-csv-logs')
};

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function formatRestTime(totalSeconds) {
  const safeSeconds = Number(totalSeconds) || 0;
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function parseRestTime(value) {
  const raw = String(value || '').trim();
  if (!raw) return 0;

  if (/^\d+$/.test(raw)) {
    return Number(raw);
  }

  const [minutesText, secondsText = '0'] = raw.split(':');
  const minutes = Number(minutesText) || 0;
  const seconds = Number(secondsText) || 0;
  return minutes * 60 + seconds;
}

function createDefaultState() {
  const plan = {
    id: makeId('plan'),
    name: 'Strength Block',
    sessions: [
      {
        id: makeId('session'),
        name: 'Upper A',
        type: 'normal',
        sections: [
          {
            id: makeId('section'),
            name: 'Push',
            activities: [
              {
                id: makeId('activity'),
                name: 'Bench Press',
                sets: 5,
                reps: '5,5,5,5,5',
                restSec: 180,
                targetRpe: 8,
                notes: 'Controlled tempo and pause on chest.',
                links: 'https://example.com/bp-form'
              },
              {
                id: makeId('activity'),
                name: 'Overhead Press',
                sets: 4,
                reps: '8,8,6,6',
                restSec: 150,
                targetRpe: 8,
                notes: 'Keep ribs down.',
                links: ''
              }
            ]
          }
        ]
      },
      {
        id: makeId('session'),
        name: 'Deload Upper',
        type: 'deload',
        sections: [
          {
            id: makeId('section'),
            name: 'Low Intensity',
            activities: [
              {
                id: makeId('activity'),
                name: 'Bench Press',
                sets: 3,
                reps: '5,5,5',
                restSec: 120,
                targetRpe: 6,
                notes: 'Technique focused',
                links: ''
              }
            ]
          }
        ]
      }
    ]
  };

  const workoutLogs = [
    {
      id: makeId('log'),
      exercise: 'Bench Press',
      sessionName: 'Upper A',
      date: '2026-08-23',
      sets: [
        { weight: 80, reps: 5, rpe: 8, completed: true },
        { weight: 82.5, reps: 5, rpe: 8, completed: true },
        { weight: 85, reps: 5, rpe: 8, completed: true },
        { weight: 85, reps: 5, rpe: 8, completed: true },
        { weight: 85, reps: 5, rpe: 8, completed: true }
      ]
    },
    {
      id: makeId('log'),
      exercise: 'Bench Press',
      sessionName: 'Upper A',
      date: '2026-08-30',
      sets: [
        { weight: 82.5, reps: 5, rpe: 8, completed: true },
        { weight: 85, reps: 5, rpe: 8, completed: true },
        { weight: 87.5, reps: 5, rpe: 8, completed: true }
      ]
    },
    {
      id: makeId('log'),
      exercise: 'Overhead Press',
      sessionName: 'Upper A',
      date: '2026-08-23',
      sets: [
        { weight: 45, reps: 8, rpe: 8, completed: true },
        { weight: 45, reps: 8, rpe: 8, completed: true },
        { weight: 47.5, reps: 6, rpe: 8, completed: true },
        { weight: 47.5, reps: 6, rpe: 8, completed: true }
      ]
    }
  ];

  return {
    plans: [plan],
    activePlanId: plan.id,
    selectedPtSessionId: plan.sessions[0]?.id || null,
    workoutLogs
  };
}

function importPlanData(parsedPlan, { replaceCurrent = false } = {}) {
  if (!parsedPlan || !parsedPlan.name || !Array.isArray(parsedPlan.sessions)) {
    return false;
  }

  const cleanedPlan = {
    ...parsedPlan,
    id: parsedPlan.id || makeId('plan'),
    sessions: parsedPlan.sessions.map((session) => ({
      ...session,
      id: session.id || makeId('session'),
      sections: Array.isArray(session.sections) ? session.sections.map((section) => ({
        ...section,
        id: section.id || makeId('section'),
        activities: Array.isArray(section.activities) ? section.activities.map((activity) => ({
          ...activity,
          id: activity.id || makeId('activity')
        })) : []
      })) : []
    }))
  };

  if (replaceCurrent) {
    state.plans = [cleanedPlan];
    state.activePlanId = cleanedPlan.id;
    saveState();
    refreshAll();
    return true;
  }

  state.plans.push(cleanedPlan);
  state.activePlanId = cleanedPlan.id;
  saveState();
  refreshAll();
  return true;
}

function loadRepoPlan() {
  const repoPlanPath = './plan.json';

  fetch(repoPlanPath)
    .then((response) => {
      if (!response.ok) return;
      return response.json();
    })
    .then((parsedPlan) => {
      if (!parsedPlan) return;

      const existingPlan = state.plans.find((plan) => plan.name === parsedPlan.name);
      if (existingPlan) {
        state.activePlanId = existingPlan.id;
        saveState();
        refreshAll();
        return;
      }

      importPlanData(parsedPlan, { replaceCurrent: false });
    })
    .catch(() => {
      // No repo-based plan file present; keep the default app state.
    });
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (error) {
    console.warn('Could not parse saved state', error);
  }
  const defaultState = createDefaultState();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState));
  return defaultState;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function setCloudStatus(message, isError = false) {
  elements.cloudStatus.textContent = message;
  elements.cloudStatus.classList.toggle('error-note', isError);
}

async function getCloudUser() {
  await authReady;
  if (!auth.currentUser) throw new Error('Cloud sign-in is unavailable.');
  return auth.currentUser;
}

function getCloudPlanRef(user, planId) {
  return doc(db, 'users', user.uid, 'plans', planId);
}

async function getCloudPlans() {
  const user = await getCloudUser();
  const snapshot = await getDocs(collection(db, 'users', user.uid, 'plans'));
  return snapshot.docs.map((planDoc) => ({ id: planDoc.id, ...planDoc.data() }));
}

function renderCloudPlanOptions(plans, selectedId = '') {
  elements.cloudPlanSelect.innerHTML = '';
  if (!plans.length) {
    elements.cloudPlanSelect.innerHTML = '<option value="">No cloud plans found</option>';
    return;
  }

  plans.forEach((plan) => {
    const option = document.createElement('option');
    option.value = plan.id;
    option.textContent = plan.name;
    option.selected = plan.id === selectedId;
    elements.cloudPlanSelect.appendChild(option);
  });
}

async function loadCloudPlanList() {
  setCloudStatus('Loading cloud plans...');
  try {
    const plans = await getCloudPlans();
    renderCloudPlanOptions(plans);
    setCloudStatus(plans.length ? 'Select a cloud plan, then click Load from Cloud.' : 'No cloud plans found.', !plans.length);
  } catch (error) {
    console.error('Could not list cloud plans', error);
    setCloudStatus('Could not load cloud plans. Check Firebase setup.', true);
  }
}

async function savePlanDocument(planId, plan) {
  const user = await getCloudUser();
  await setDoc(getCloudPlanRef(user, planId), {
    ...plan,
    id: planId,
    updatedAt: serverTimestamp()
  });
}

async function savePlanToCloud() {
  const plan = getActivePlan();
  if (!plan) {
    setCloudStatus('Create or select a plan first.', true);
    return;
  }

  const cloudPlanId = elements.cloudPlanSelect.value;
  if (!cloudPlanId) {
    setCloudStatus('Load cloud plans and select a plan to overwrite.', true);
    return;
  }

  setCloudStatus('Saving...');
  try {
    await savePlanDocument(cloudPlanId, plan);
    setCloudStatus('Saved to cloud.');
  } catch (error) {
    console.error('Could not save plan to cloud', error);
    setCloudStatus('Cloud save failed. Check Firebase setup.', true);
  }
}

async function saveNewPlanToCloud() {
  const plan = getActivePlan();
  if (!plan) {
    setCloudStatus('Create or select a plan first.', true);
    return;
  }

  const newName = elements.cloudNewPlanName.value.trim() || plan.name.trim();
  if (!newName) {
    setCloudStatus('Enter a name for the new cloud plan.', true);
    return;
  }

  setCloudStatus('Checking cloud plan names...');
  try {
    const cloudPlans = await getCloudPlans();
    if (cloudPlans.some((cloudPlan) => cloudPlan.name.trim().toLowerCase() === newName.toLowerCase())) {
      setCloudStatus('A cloud plan already has that name. Choose a different name.', true);
      return;
    }

    const newPlanId = makeId('plan');
    await savePlanDocument(newPlanId, { ...plan, id: newPlanId, name: newName });
    elements.cloudNewPlanName.value = '';
    await loadCloudPlanList();
    elements.cloudPlanSelect.value = newPlanId;
    setCloudStatus('New plan saved to cloud.');
  } catch (error) {
    console.error('Could not save new plan to cloud', error);
    setCloudStatus('Cloud save failed. Check Firebase setup.', true);
  }
}

async function loadPlanFromCloud() {
  if (!elements.cloudPlanSelect.value) {
    await loadCloudPlanList();
    return;
  }

  setCloudStatus('Loading...');
  try {
    const user = await getCloudUser();
    const snapshot = await getDoc(getCloudPlanRef(user, elements.cloudPlanSelect.value));
    if (!snapshot.exists()) {
      setCloudStatus('That cloud plan no longer exists. Reload the cloud plan list.', true);
      return;
    }

    const cloudPlan = snapshot.data();
    const localPlan = { ...cloudPlan, id: snapshot.id };
    const planIndex = state.plans.findIndex((item) => item.id === state.activePlanId);
    if (planIndex === -1) {
      state.plans.push(localPlan);
    } else {
      state.plans[planIndex] = localPlan;
    }
    state.activePlanId = localPlan.id;
    saveState();
    refreshAll();
    setCloudStatus('Loaded from cloud.');
  } catch (error) {
    console.error('Could not load plan from cloud', error);
    setCloudStatus('Cloud load failed. Check Firebase setup.', true);
  }
}

function getActivePlan() {
  return state.plans.find((plan) => plan.id === state.activePlanId) || state.plans[0];
}

function setActiveMode(mode) {
  document.querySelectorAll('.nav-btn').forEach((button) => {
    button.classList.toggle('active', button.dataset.mode === mode);
  });

  document.querySelectorAll('.mode-panel').forEach((panel) => {
    panel.classList.toggle('active', panel.id === `${mode}-mode`);
  });
}

function renderPlanSelector() {
  const plan = getActivePlan();
  elements.planSelect.innerHTML = '';
  elements.ptSessionSelect.innerHTML = '';
  elements.sectionSessionSelect.innerHTML = '';
  elements.trainingPlanSelect.innerHTML = '';

  state.plans.forEach((item) => {
    const option1 = document.createElement('option');
    option1.value = item.id;
    option1.textContent = item.name;
    if (plan && item.id === plan.id) option1.selected = true;
    elements.planSelect.appendChild(option1);

    const option2 = document.createElement('option');
    option2.value = item.id;
    option2.textContent = item.name;
    if (plan && item.id === plan.id) option2.selected = true;
    elements.trainingPlanSelect.appendChild(option2);
  });

  elements.planSelect.value = plan ? plan.id : '';
  elements.trainingPlanSelect.value = plan ? plan.id : '';

  if (!plan || !plan.sessions.length) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No sessions';
    elements.ptSessionSelect.appendChild(option);
    elements.sectionSessionSelect.appendChild(option.cloneNode(true));
    elements.ptSessionSelect.value = '';
    elements.sectionSessionSelect.value = '';
    state.selectedPtSessionId = null;
    return;
  }

  const savedSessionId = plan.sessions.some((session) => session.id === state.selectedPtSessionId)
    ? state.selectedPtSessionId
    : plan.sessions[0].id;
  state.selectedPtSessionId = savedSessionId;

  plan.sessions.forEach((session) => {
    const option1 = document.createElement('option');
    option1.value = session.id;
    option1.textContent = session.name;
    if (session.id === savedSessionId) option1.selected = true;
    elements.ptSessionSelect.appendChild(option1);

    const option2 = document.createElement('option');
    option2.value = session.id;
    option2.textContent = session.name;
    if (session.id === savedSessionId) option2.selected = true;
    elements.sectionSessionSelect.appendChild(option2);
  });

  elements.ptSessionSelect.value = savedSessionId;
  elements.sectionSessionSelect.value = savedSessionId;
}

function renderSectionOptions() {
  const plan = getActivePlan();
  const sessionId = elements.ptSessionSelect.value || plan?.sessions?.[0]?.id || '';
  const selectedSession = plan?.sessions?.find((session) => session.id === sessionId) || plan?.sessions?.[0];
  const sections = selectedSession?.sections || [];
  elements.activitySectionSelect.innerHTML = '';

  if (!sections.length) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No sections available';
    elements.activitySectionSelect.appendChild(option);
    return;
  }

  sections.forEach((section) => {
    const option = document.createElement('option');
    option.value = section.id;
    option.textContent = section.name;
    elements.activitySectionSelect.appendChild(option);
  });

  const currentSectionId = elements.activitySectionSelect.value || sections[0].id;
  elements.activitySectionSelect.value = sections.some((section) => section.id === currentSectionId)
    ? currentSectionId
    : sections[0].id;
}

function findSessionById(sessionId) {
  for (const plan of state.plans) {
    const session = plan.sessions.find((item) => item.id === sessionId);
    if (session) return { plan, session };
  }
  return null;
}

function findSectionById(sessionId, sectionId) {
  const sessionResult = findSessionById(sessionId);
  if (!sessionResult) return null;
  const section = sessionResult.session.sections.find((item) => item.id === sectionId);
  if (!section) return null;
  return { ...sessionResult, section };
}

function findActivityById(activityId) {
  for (const plan of state.plans) {
    for (const session of plan.sessions) {
      for (const section of session.sections) {
        const activity = section.activities.find((item) => item.id === activityId);
        if (activity) return { plan, session, section, activity };
      }
    }
  }
  return null;
}

function toggleSessionVisibility(sessionId) {
  const result = findSessionById(sessionId);
  if (!result) return;

  result.session.hidden = !Boolean(result.session.hidden);
  saveState();
  refreshAll();
}

function toggleSectionVisibility(sessionId, sectionId) {
  const result = findSectionById(sessionId, sectionId);
  if (!result) return;

  result.section.hidden = !Boolean(result.section.hidden);
  saveState();
  refreshAll();
}

function deleteSession(sessionId) {
  const plan = getActivePlan();
  if (!plan) return;

  const session = plan.sessions.find((item) => item.id === sessionId);
  if (!session) return;

  const confirmed = window.confirm(`Delete session "${session.name}"? This will also remove all sections and activities in it.`);
  if (!confirmed) return;

  plan.sessions = plan.sessions.filter((item) => item.id !== sessionId);
  if (state.selectedPtSessionId === sessionId) {
    state.selectedPtSessionId = plan.sessions[0]?.id || null;
  }
  saveState();
  refreshAll();
}

function deleteSection(sessionId, sectionId) {
  const session = findSessionById(sessionId);
  if (!session) return;

  const section = session.session.sections.find((item) => item.id === sectionId);
  if (!section) return;

  const confirmed = window.confirm(`Delete section "${section.name}"? This will remove all activities in it.`);
  if (!confirmed) return;

  session.session.sections = session.session.sections.filter((item) => item.id !== sectionId);
  saveState();
  refreshAll();
}

function resetActivityForm() {
  currentEditActivity = null;
  elements.addActivityBtn.textContent = 'Add Activity';
  elements.cancelActivityEditBtn.style.display = 'none';
  elements.activityName.value = '';
  elements.activitySets.value = '';
  elements.activityReps.value = '';
  elements.activityRest.value = '';
  elements.activityRpe.value = '';
  elements.activityLinks.value = '';
  elements.activityNotes.value = '';
}

function startActivityEdit(activityId) {
  const result = findActivityById(activityId);
  if (!result) return;

  currentEditActivity = {
    planId: result.plan.id,
    sessionId: result.session.id,
    sectionId: result.section.id,
    activityId: result.activity.id
  };

  elements.activityName.value = result.activity.name;
  elements.activitySets.value = String(result.activity.sets);
  elements.activityReps.value = result.activity.reps;
  elements.activityRest.value = formatRestTime(result.activity.restSec);
  elements.activityRpe.value = result.activity.targetRpe;
  elements.activityLinks.value = result.activity.links || '';
  elements.activityNotes.value = result.activity.notes || '';
  elements.activitySectionSelect.value = result.section.id;
  elements.ptSessionSelect.value = result.session.id;
  elements.sectionSessionSelect.value = result.session.id;
  state.selectedPtSessionId = result.session.id;
  elements.trainingSessionSelect.value = result.session.id;
  elements.addActivityBtn.textContent = 'Update Activity';
  elements.cancelActivityEditBtn.style.display = 'inline-block';
}

function renderOverview() {
  const plan = getActivePlan();
  if (!plan) {
    elements.planOverview.innerHTML = '<p>No plan available yet.</p>';
    return;
  }

  const html = plan.sessions.map((session) => {
    const badgeClass = session.type === 'deload' ? 'badge deload' : 'badge';
    const sessionHidden = Boolean(session.hidden);
    const sessionSections = session.sections.map((section) => {
      const sectionHidden = Boolean(section.hidden);
      const activities = section.activities.map((activity, index) => `
        <div class="activity-item">
          <strong>${activity.name}</strong>
          <div class="small-note">Sets ${activity.sets} • Reps ${activity.reps} • Rest ${formatRestTime(activity.restSec)} • RPE ${activity.targetRpe}</div>
          ${activity.notes ? `<div class="small-note">${activity.notes}</div>` : ''}
          ${activity.links ? `<div class="small-note">${activity.links}</div>` : ''}
          <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:10px;">
            <button data-action="edit-activity" data-activity-id="${activity.id}">Edit</button>
            <button data-action="delete-activity" data-activity-id="${activity.id}" class="danger">Delete</button>
            <button data-action="move-activity-up" data-activity-id="${activity.id}" ${index === 0 ? 'disabled' : ''}>↑</button>
            <button data-action="move-activity-down" data-activity-id="${activity.id}" ${index === section.activities.length - 1 ? 'disabled' : ''}>↓</button>
          </div>
        </div>
      `).join('');

      return `
        <div class="section-item">
          <div class="toggle-row">
            <strong>${section.name}</strong>
            <div class="inline-actions">
              <button class="toggle-btn" data-toggle="section" data-session-id="${session.id}" data-section-id="${section.id}" aria-expanded="${!sectionHidden}">
                ${sectionHidden ? 'Show' : 'Hide'}
              </button>
              <button class="danger small-btn" data-action="delete-section" data-session-id="${session.id}" data-section-id="${section.id}">Delete</button>
            </div>
          </div>
          <div class="section-content" ${sectionHidden ? 'style="display:none;"' : ''}>
            <div class="activity-list">${activities}</div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="session-item">
        <div class="toggle-row">
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <strong>${session.name}</strong>
            <span class="${badgeClass}">${session.type}</span>
          </div>
          <div class="inline-actions">
            <button class="toggle-btn" data-toggle="session" data-session-id="${session.id}" aria-expanded="${!sessionHidden}">
              ${sessionHidden ? 'Show' : 'Hide'}
            </button>
            <button class="danger small-btn" data-action="delete-session" data-session-id="${session.id}">Delete</button>
          </div>
        </div>
        <div class="session-content" ${sessionHidden ? 'style="display:none;"' : ''}>
          <div class="section-list">${sessionSections || '<p>No sections yet.</p>'}</div>
        </div>
      </div>
    `;
  }).join('');

  elements.planOverview.innerHTML = html || '<p>No sessions in this plan.</p>';
}

function renderTrainingPlanOptions() {
  const activePlan = getActivePlan();
  const trainingPlan = state.plans.find((plan) => plan.id === elements.trainingPlanSelect.value) || activePlan;
  if (!trainingPlan) return;

  const sessionOptions = trainingPlan.sessions.map((session) => `
    <option value="${session.id}">${session.name} (${session.type})</option>
  `).join('');

  elements.trainingSessionSelect.innerHTML = sessionOptions || '<option value="">No sessions</option>';
  if (trainingPlan.sessions.length) {
    const selectedSession = trainingPlan.sessions[0];
    elements.trainingSessionSelect.value = selectedSession.id;
    renderTrainingSession(selectedSession.id);
  }
}

function formatActivityLinks(linksText) {
  const rawLinks = String(linksText || '')
    .split(',')
    .map((link) => link.trim())
    .filter(Boolean);

  if (!rawLinks.length) {
    return '<div class="small-note"><strong>Links:</strong> None</div>';
  }

  const links = rawLinks.map((link) => `
    <a href="${link}" target="_blank" rel="noopener noreferrer">${link}</a>
  `).join(', ');

  return `<div class="small-note"><strong>Links:</strong> ${links}</div>`;
}

function renderTrainingSession(sessionId) {
  const plan = getActivePlan();
  const session = plan?.sessions.find((item) => item.id === sessionId);
  if (!session) {
    elements.trainingSessionDisplay.innerHTML = '<p>No session selected.</p>';
    return;
  }

  const html = session.sections.map((section) => {
    const activities = section.activities.map((activity) => {
      const setCount = Number(activity.sets) || 1;
      const setRows = Array.from({ length: setCount }, (_, index) => `
        <div class="set-row">
          <label>Set ${index + 1}</label>
          <input data-activity-id="${activity.id}" data-set-index="${index}" data-field="weight" type="number" step="0.5" placeholder="kg" />
          <input data-activity-id="${activity.id}" data-set-index="${index}" data-field="reps" type="number" min="1" placeholder="reps" />
          <input data-activity-id="${activity.id}" data-set-index="${index}" data-field="rpe" type="number" min="1" max="10" step="0.5" placeholder="RPE" />
          <input data-activity-id="${activity.id}" data-set-index="${index}" data-field="completed" type="checkbox" />
        </div>
      `).join('');

      const detailsMarkup = `
        <div class="activity-details" hidden>
          <div class="small-note"><strong>Notes:</strong> ${activity.notes ? activity.notes : 'No notes added.'}</div>
          ${formatActivityLinks(activity.links)}
        </div>
      `;

      return `
        <div class="activity-log">
          <strong>${activity.name}</strong>
          <div class="small-note">${activity.reps} reps • Rest ${formatRestTime(activity.restSec)} • Target RPE ${activity.targetRpe}</div>
          <div style="margin-top:10px;">
            <button data-action="toggle-activity-details" data-activity-id="${activity.id}">View Details</button>
          </div>
          ${detailsMarkup}
          ${setRows}
          <div style="margin-top:10px;">
            <button data-log-activity-id="${activity.id}" class="save-log-btn">Save Activity Log</button>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="section-item">
        <strong>${section.name}</strong>
        <div class="activity-list">${activities}</div>
      </div>
    `;
  }).join('');

  elements.trainingSessionDisplay.innerHTML = html;
}

function renderCalendar() {
  const plan = getActivePlan();
  if (!plan) {
    elements.calendarSessionList.innerHTML = '<p>No plan available.</p>';
    elements.calendarDays.innerHTML = '';
    return;
  }

  const assignments = plan.calendarAssignments || {};
  const sessionCards = plan.sessions.map((session) => {
    const assignedDay = assignments[session.id];
    const dayLabel = assignedDay !== undefined ? CALENDAR_DAYS[assignedDay] : 'Unscheduled';
    return `
      <div class="calendar-session-card" draggable="true" data-session-id="${session.id}">
        <span>${session.name}</span>
        <small>${dayLabel}</small>
      </div>
    `;
  }).join('');

  const dayColumns = CALENDAR_DAYS.map((day, index) => {
    const assignedSessions = plan.sessions
      .filter((session) => assignments[session.id] === index)
      .map((session) => `
        <div class="calendar-day-session" draggable="true" data-session-id="${session.id}">
          ${session.name}
        </div>
      `)
      .join('');

    return `
      <div class="calendar-day" data-day-index="${index}">
        <h4>${day}</h4>
        ${assignedSessions || '<p class="empty-day">Drop session here</p>'}
      </div>
    `;
  }).join('');

  elements.calendarSessionList.innerHTML = sessionCards || '<p>No sessions in this plan.</p>';
  elements.calendarDays.innerHTML = dayColumns;
}

function moveSessionToDay(sessionId, dayIndex) {
  const plan = getActivePlan();
  if (!plan) return;
  if (!plan.sessions.some((session) => session.id === sessionId)) return;
  if (Number.isNaN(dayIndex) || dayIndex < 0 || dayIndex >= CALENDAR_DAYS.length) return;

  plan.calendarAssignments = plan.calendarAssignments || {};
  plan.calendarAssignments[sessionId] = dayIndex;
  saveState();
  refreshAll();
}

function renderReporting() {
  const logs = state.workoutLogs || [];

  if (!logs.length) {
    elements.reportingOutput.innerHTML = '<p>No workout data yet.</p>';
    return;
  }

  const grouped = logs.reduce((acc, log) => {
    if (!acc[log.exercise]) acc[log.exercise] = [];
    acc[log.exercise].push(log);
    return acc;
  }, {});

  const html = Object.entries(grouped).map(([exercise, entries]) => {
    const rows = entries.flatMap((entry) => {
      return entry.sets.map((set, index) => `
        <tr>
          <td>${entry.date}</td>
          <td>${entry.sessionName}</td>
          <td>${set.weight}</td>
          <td>${set.reps}</td>
          <td>${set.rpe}</td>
          <td>${index + 1}</td>
        </tr>
      `);
    }).join('');

    return `
      <div class="exercise-card">
        <h3>${exercise}</h3>
        <table class="history-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Session</th>
              <th>Weight</th>
              <th>Reps</th>
              <th>RPE</th>
              <th>Set</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }).join('');

  elements.reportingOutput.innerHTML = html;
}

function createPlan() {
  const name = elements.planName.value.trim();
  if (!name) {
    alert('Please enter a plan name.');
    return;
  }

  const newPlan = {
    id: makeId('plan'),
    name,
    sessions: [],
    calendarAssignments: {}
  };

  state.plans.push(newPlan);
  state.activePlanId = newPlan.id;
  elements.planName.value = '';
  saveState();
  refreshAll();
}

function deletePlan() {
  if (!state.plans.length) return;
  const selectedId = elements.planSelect.value;
  const index = state.plans.findIndex((plan) => plan.id === selectedId);
  if (index === -1) return;

  state.plans.splice(index, 1);
  state.activePlanId = state.plans[0]?.id || null;
  saveState();
  refreshAll();
}

function createSession() {
  const plan = getActivePlan();
  if (!plan) {
    alert('Create a plan first.');
    return;
  }

  const name = elements.sessionName.value.trim();
  if (!name) {
    alert('Please enter a session name.');
    return;
  }

  const newSession = {
    id: makeId('session'),
    name,
    type: elements.sessionType.value,
    hidden: false,
    sections: [{
      id: makeId('section'),
      name: 'Main',
      activities: [],
      hidden: false
    }]
  };

  plan.sessions.push(newSession);
  elements.sessionName.value = '';
  saveState();
  refreshAll();
}

function createSection() {
  const plan = getActivePlan();
  const sessionId = elements.sectionSessionSelect.value || elements.ptSessionSelect.value || elements.trainingSessionSelect.value || (plan?.sessions[0]?.id || null);
  const targetSession = plan?.sessions.find((session) => session.id === sessionId) || plan?.sessions[0];

  if (!targetSession) {
    alert('Create a session first.');
    return;
  }

  state.selectedPtSessionId = targetSession.id;

  const sectionName = elements.sectionName.value.trim();
  if (!sectionName) {
    alert('Please enter a section name.');
    return;
  }

  targetSession.sections.push({
    id: makeId('section'),
    name: sectionName,
    activities: [],
    hidden: false
  });

  elements.sectionName.value = '';
  saveState();
  refreshAll();
}

function addActivity() {
  const plan = getActivePlan();
  const sessionId = elements.ptSessionSelect.value || elements.trainingSessionSelect.value || (plan?.sessions[0]?.id || null);
  const targetSession = plan?.sessions.find((session) => session.id === sessionId) || plan?.sessions[0];
  const sectionId = elements.activitySectionSelect.value;

  if (!targetSession || !sectionId) {
    alert('Create a session and section before adding an activity.');
    return;
  }

  const name = elements.activityName.value.trim();
  const sets = Number(elements.activitySets.value);
  const reps = elements.activityReps.value.trim();
  const restSec = parseRestTime(elements.activityRest.value);
  const targetRpe = Number(elements.activityRpe.value) || 0;
  const notes = elements.activityNotes.value.trim();
  const links = elements.activityLinks.value.trim();

  if (!name || !sets || !reps) {
    alert('Exercise name, sets, and reps are required.');
    return;
  }

  const targetSection = targetSession.sections.find((section) => section.id === sectionId);
  if (!targetSection) {
    alert('Select a valid section.');
    return;
  }

  if (currentEditActivity && currentEditActivity.activityId) {
    const activity = targetSection.activities.find((item) => item.id === currentEditActivity.activityId);
    if (activity) {
      activity.name = name;
      activity.sets = sets;
      activity.reps = reps;
      activity.restSec = restSec;
      activity.targetRpe = targetRpe;
      activity.notes = notes;
      activity.links = links;
    }
  } else {
    targetSection.activities.push({
      id: makeId('activity'),
      name,
      sets,
      reps,
      restSec,
      targetRpe,
      notes,
      links
    });
  }

  resetActivityForm();
  saveState();
  refreshAll();
}

function deleteActivity(activityId) {
  const result = findActivityById(activityId);
  if (!result) return;
  result.section.activities = result.section.activities.filter((item) => item.id !== activityId);
  if (currentEditActivity?.activityId === activityId) {
    resetActivityForm();
  }
  saveState();
  refreshAll();
}

function moveActivity(activityId, direction) {
  const result = findActivityById(activityId);
  if (!result) return;

  const index = result.section.activities.findIndex((item) => item.id === activityId);
  if (index === -1) return;

  const newIndex = direction === 'up' ? index - 1 : index + 1;
  if (newIndex < 0 || newIndex >= result.section.activities.length) return;

  const [moved] = result.section.activities.splice(index, 1);
  result.section.activities.splice(newIndex, 0, moved);
  saveState();
  refreshAll();
}

function exportPlanJson() {
  const plan = getActivePlan();
  if (!plan) {
    alert('No plan to export.');
    return;
  }
  const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
  triggerDownload(blob, `${plan.name || 'plan'}.json`);
}

function importPlanJson(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      if (!parsed || !parsed.name || !Array.isArray(parsed.sessions)) {
        throw new Error('Invalid JSON plan format.');
      }
      state.plans.push({
        ...parsed,
        id: makeId('plan')
      });
      state.activePlanId = state.plans[state.plans.length - 1].id;
      saveState();
      refreshAll();
      alert('Plan imported successfully.');
    } catch (error) {
      alert(`Import failed: ${error.message}`);
    }
    event.target.value = '';
  };
  reader.readAsText(file);
}

function exportWorkoutCsv() {
  if (!state.workoutLogs.length) {
    alert('No workout data available to export.');
    return;
  }

  const rows = [
    ['date', 'session', 'exercise', 'set', 'weight', 'reps', 'rpe', 'completed']
  ];

  state.workoutLogs.forEach((log) => {
    log.sets.forEach((set, index) => {
      rows.push([
        log.date,
        log.sessionName,
        log.exercise,
        index + 1,
        set.weight,
        set.reps,
        set.rpe,
        set.completed ? 'yes' : 'no'
      ]);
    });
  });

  const csv = rows.map((row) => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, 'workout-logs.csv');
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function saveActivityLog(event) {
  const button = event.target.closest('[data-log-activity-id]');
  if (!button) return;

  const activityId = button.dataset.logActivityId;
  const plan = getActivePlan();
  const sessionId = elements.trainingSessionSelect.value;
  const session = plan?.sessions.find((item) => item.id === sessionId);

  if (!session) return;

  const activity = session.sections.flatMap((section) => section.activities).find((item) => item.id === activityId);
  if (!activity) return;

  const setInputs = document.querySelectorAll(`input[data-activity-id="${activityId}"]`);
  const sets = [];

  for (let index = 0; index < Number(activity.sets); index += 1) {
    const weightInput = document.querySelector(`input[data-activity-id="${activityId}"][data-set-index="${index}"][data-field="weight"]`);
    const repsInput = document.querySelector(`input[data-activity-id="${activityId}"][data-set-index="${index}"][data-field="reps"]`);
    const rpeInput = document.querySelector(`input[data-activity-id="${activityId}"][data-set-index="${index}"][data-field="rpe"]`);
    const completeInput = document.querySelector(`input[data-activity-id="${activityId}"][data-set-index="${index}"][data-field="completed"]`);

    const weight = Number(weightInput?.value || 0);
    const reps = Number(repsInput?.value || 0);
    const rpe = Number(rpeInput?.value || 0);
    const completed = Boolean(completeInput?.checked);

    if (completed) {
      sets.push({ weight, reps, rpe, completed: true });
    }
  }

  if (!sets.length) {
    alert('Please mark at least one successful set as completed before saving.');
    return;
  }

  state.workoutLogs.push({
    id: makeId('log'),
    exercise: activity.name,
    sessionName: session.name,
    date: new Date().toISOString().slice(0, 10),
    sets
  });

  saveState();
  renderReporting();
  alert(`Saved ${activity.name} log.`);
}

function refreshAll() {
  renderPlanSelector();
  renderOverview();
  renderSectionOptions();
  renderCalendar();
  renderTrainingPlanOptions();
  renderReporting();
}

function bindEvents() {
  document.querySelectorAll('.nav-btn').forEach((button) => {
    button.addEventListener('click', () => setActiveMode(button.dataset.mode));
  });

  elements.createPlanBtn.addEventListener('click', createPlan);
  elements.deletePlanBtn.addEventListener('click', deletePlan);
  elements.saveCloudBtn.addEventListener('click', savePlanToCloud);
  elements.saveNewCloudBtn.addEventListener('click', saveNewPlanToCloud);
  elements.loadCloudBtn.addEventListener('click', loadPlanFromCloud);
  elements.createSessionBtn.addEventListener('click', createSession);
  elements.createSectionBtn.addEventListener('click', createSection);
  elements.addActivityBtn.addEventListener('click', addActivity);
  elements.exportJsonPlan.addEventListener('click', exportPlanJson);
  elements.importJsonPlan.addEventListener('change', importPlanJson);
  elements.exportCsvLogs.addEventListener('click', exportWorkoutCsv);

  elements.planSelect.addEventListener('change', (event) => {
    state.activePlanId = event.target.value;
    saveState();
    refreshAll();
  });

  elements.ptSessionSelect.addEventListener('change', () => {
    state.selectedPtSessionId = elements.ptSessionSelect.value;
    elements.sectionSessionSelect.value = elements.ptSessionSelect.value;
    renderSectionOptions();
  });

  elements.sectionSessionSelect.addEventListener('change', () => {
    state.selectedPtSessionId = elements.sectionSessionSelect.value;
    elements.ptSessionSelect.value = elements.sectionSessionSelect.value;
    renderSectionOptions();
  });

  elements.trainingPlanSelect.addEventListener('change', () => {
    const targetPlan = state.plans.find((plan) => plan.id === elements.trainingPlanSelect.value) || getActivePlan();
    if (targetPlan) {
      state.activePlanId = targetPlan.id;
      saveState();
      renderTrainingPlanOptions();
    }
  });

  elements.trainingSessionSelect.addEventListener('change', (event) => {
    renderTrainingSession(event.target.value);
  });

  elements.cancelActivityEditBtn.addEventListener('click', resetActivityForm);

  document.addEventListener('dragstart', (event) => {
    const sessionCard = event.target.closest('.calendar-session-card, .calendar-day-session');
    if (!sessionCard) return;

    const sessionId = sessionCard.dataset.sessionId;
    if (!sessionId) return;

    event.dataTransfer?.setData('text/plain', sessionId);
    event.dataTransfer.effectAllowed = 'move';
  });

  document.addEventListener('dragover', (event) => {
    const day = event.target.closest('.calendar-day');
    if (!day) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  });

  document.addEventListener('drop', (event) => {
    const day = event.target.closest('.calendar-day');
    if (!day) return;
    event.preventDefault();

    const sessionId = event.dataTransfer?.getData('text/plain');
    if (!sessionId) return;

    moveSessionToDay(sessionId, Number(day.dataset.dayIndex));
  });

  document.addEventListener('click', (event) => {
    const toggleTarget = event.target.closest('[data-toggle]');
    if (toggleTarget) {
      const { toggle, sessionId, sectionId } = toggleTarget.dataset;
      if (toggle === 'session') {
        toggleSessionVisibility(sessionId);
      }
      if (toggle === 'section') {
        toggleSectionVisibility(sessionId, sectionId);
      }
      return;
    }

    const actionTarget = event.target.closest('[data-action]');
    if (actionTarget) {
      const { action, activityId, sessionId, sectionId } = actionTarget.dataset;
      if (action === 'edit-activity') {
        startActivityEdit(activityId);
      }
      if (action === 'delete-activity') {
        deleteActivity(activityId);
      }
      if (action === 'move-activity-up') {
        moveActivity(activityId, 'up');
      }
      if (action === 'move-activity-down') {
        moveActivity(activityId, 'down');
      }
      if (action === 'delete-session') {
        deleteSession(sessionId);
      }
      if (action === 'delete-section') {
        deleteSection(sessionId, sectionId);
      }
      if (action === 'toggle-activity-details') {
        const button = actionTarget;
        const wrapper = button.closest('.activity-log');
        const details = wrapper?.querySelector('.activity-details');
        if (!details) return;

        const isHidden = details.hasAttribute('hidden');
        details.toggleAttribute('hidden', !isHidden);
        button.textContent = isHidden ? 'Hide Details' : 'View Details';
      }
    }

    if (event.target.classList.contains('save-log-btn')) {
      saveActivityLog(event);
    }
  });
}

bindEvents();
setActiveMode('pt');
loadRepoPlan();
refreshAll();
