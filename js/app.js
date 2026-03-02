/* =====================================================
   OFFERINGS MANAGEMENT SYSTEM v2
   Malauli Christian Church
   ===================================================== */

// ==================== DATA LAYER ====================

let offeringsCache = [];
let expensesCache = [];
let settingsCache = {
    churchName: '',
    churchAddress: '',
    pastorName: '',
    treasurerName: '',
    currency: '₱'
};

// Collection references (from firebase-config.js)
const expensesCollection = db.collection('expenses');

// --- Load Data ---
async function loadOfferings() {
    try {
        const snap = await offeringsCollection.orderBy('date', 'desc').get();
        offeringsCache = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
        console.error('Error loading offerings:', err);
        showToast('Failed to load offerings.', 'error');
    }
    return offeringsCache;
}

async function loadExpenses() {
    try {
        const snap = await expensesCollection.orderBy('date', 'desc').get();
        expensesCache = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
        console.error('Error loading expenses:', err);
        showToast('Failed to load expenses.', 'error');
    }
    return expensesCache;
}

async function loadSettingsFromDB() {
    try {
        const doc = await settingsDoc.get();
        if (doc.exists) settingsCache = { ...settingsCache, ...doc.data() };
    } catch (err) {
        console.error('Error loading settings:', err);
    }
    return settingsCache;
}

function getSettings() { return settingsCache; }

async function saveSettingsToDB(settings) {
    try {
        settingsCache = { ...settingsCache, ...settings };
        await settingsDoc.set(settingsCache, { merge: true });
        showToast('Settings saved!', 'success');
    } catch (err) {
        console.error('Error saving settings:', err);
        showToast('Failed to save settings.', 'error');
    }
}

// --- CRUD: Offerings ---
async function addOfferingToDB(data) {
    try {
        await offeringsCollection.add(data);
        showToast('Offering saved!', 'success');
        return true;
    } catch (err) {
        console.error('Error adding offering:', err);
        showToast('Failed to save offering.', 'error');
        return false;
    }
}

async function updateOfferingInDB(id, data) {
    try {
        await offeringsCollection.doc(id).update(data);
        showToast('Offering updated!', 'success');
        return true;
    } catch (err) {
        console.error('Error updating offering:', err);
        showToast('Failed to update.', 'error');
        return false;
    }
}

async function deleteOfferingFromDB(id) {
    try {
        await offeringsCollection.doc(id).delete();
        showToast('Offering deleted.', 'info');
        return true;
    } catch (err) {
        console.error('Error deleting offering:', err);
        showToast('Failed to delete.', 'error');
        return false;
    }
}

// --- CRUD: Expenses ---
async function addExpenseToDB(data) {
    try {
        await expensesCollection.add(data);
        showToast('Expense saved!', 'success');
        return true;
    } catch (err) {
        console.error('Error adding expense:', err);
        showToast('Failed to save expense.', 'error');
        return false;
    }
}

async function updateExpenseInDB(id, data) {
    try {
        await expensesCollection.doc(id).update(data);
        showToast('Expense updated!', 'success');
        return true;
    } catch (err) {
        console.error('Error updating expense:', err);
        showToast('Failed to update.', 'error');
        return false;
    }
}

async function deleteExpenseFromDB(id) {
    try {
        await expensesCollection.doc(id).delete();
        showToast('Expense deleted.', 'info');
        return true;
    } catch (err) {
        console.error('Error deleting expense:', err);
        showToast('Failed to delete.', 'error');
        return false;
    }
}

// ==================== CURRENCY ====================

function formatCurrency(amount) {
    const s = getSettings();
    return `${s.currency}${parseFloat(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getOrdinalDay(dateStr) {
    const d = new Date(dateStr);
    const dayOfMonth = d.getDate();
    const nth = Math.ceil(dayOfMonth / 7);
    const suffixes = ['th', 'st', 'nd', 'rd', 'th'];
    const suffix = nth <= 3 ? suffixes[nth] : 'th';
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
    return `${nth}${suffix} ${dayName}`;
}

function getServiceBadge(serviceType) {
    if (serviceType === 'General Funds' || serviceType === 'Prayer Meeting') {
        return '<span style="background:#00c9a7;color:#fff;padding:2px 8px;border-radius:12px;font-size:0.75em;white-space:nowrap;"><i class="fas fa-wallet"></i> General Funds</span>';
    }
    return '<span style="background:#6c63ff;color:#fff;padding:2px 8px;border-radius:12px;font-size:0.75em;white-space:nowrap;"><i class="fas fa-church"></i> Missionary</span>';
}

// ==================== NAVIGATION ====================

function navigateTo(page) {
    if (page === 'logout') {
        sessionStorage.removeItem('mcc_auth');
        window.location.replace('login.html');
        return;
    }

    if (page === 'settings') {
        const pwd = prompt('Enter password to access Settings:');
        if (pwd !== 'mccadmin') {
            showToast('Incorrect password.', 'error');
            return;
        }
    }

    if (page === 'reports') {
        const dropdown = document.getElementById('reportsDropdown');
        const icon = document.querySelector('#nav-reports .dropdown-icon');
        if (dropdown && (dropdown.style.display === 'none' || dropdown.style.display === '')) {
            dropdown.style.display = 'flex';
            if (icon) icon.style.transform = 'rotate(180deg)';
        } else if (dropdown) {
            dropdown.style.display = 'none';
            if (icon) icon.style.transform = 'rotate(0deg)';
        }
        return; // Just toggle dropdown, do not attempt to navigate
    }

    localStorage.setItem('currentPage', page);
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const nav = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (nav) nav.classList.add('active');

    if (page.startsWith('reports-')) {
        const parentNav = document.getElementById('nav-reports');
        if (parentNav) parentNav.classList.add('active');
        const dropdown = document.getElementById('reportsDropdown');
        const icon = document.querySelector('#nav-reports .dropdown-icon');
        if (dropdown) dropdown.style.display = 'flex';
        if (icon) icon.style.transform = 'rotate(180deg)';
    } else {
        const dropdown = document.getElementById('reportsDropdown');
        const icon = document.querySelector('#nav-reports .dropdown-icon');
        if (dropdown) dropdown.style.display = 'none';
        if (icon) icon.style.transform = 'rotate(0deg)';
    }

    document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
    const actualPageId = page.startsWith('reports-') ? 'reports' : page;
    const pg = document.getElementById(`page-${actualPageId}`);
    if (pg) { void pg.offsetWidth; pg.classList.add('active'); }

    const titles = {
        'dashboard': ['Dashboard', "Overview of this month's finances"],
        'add-offering': ['Add Offering', 'Record total Sunday service offering'],
        'add-expense': ['Expenses', 'Record a church expense'],
        'reports-missionary': ['Missionary Monthly Reports', 'Offerings vs expenses per month'],
        'reports-general': ['General Fund Monthly Reports', 'Offerings vs expenses per month'],
        'reports-building': ['Building Fund Monthly Reports', 'Offerings vs expenses per month'],
        'settings': ['Settings', 'Manage church information and data']
    };

    const [t, s] = titles[page] || ['', ''];
    if (t) document.getElementById('pageTitle').textContent = t;
    if (s) document.getElementById('pageSubtitle').textContent = s;
    const sb = document.getElementById('sidebar');
    if (sb) sb.classList.remove('open');

    if (page === 'dashboard') refreshDashboard();
    if (page === 'add-offering') refreshOfferingHistory();
    if (page === 'add-expense') refreshExpenseHistory();
    if (page.startsWith('reports-')) refreshReports();
    if (page === 'settings') loadSettingsUI();
}

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', async () => {
    initThemeToggle();
    initParticles();
    initNavigation();
    initOfferingForm();
    initExpenseForm();
    initReports();
    initSettingsEvents();
    initModals();
    setCurrentDate();
    setDefaultDates();

    // Restore page state early on refresh to avoid flashing the dashboard
    let savedPage = localStorage.getItem('currentPage') || 'dashboard';
    if (savedPage === 'reports') savedPage = 'reports-missionary'; // migrate old layout
    navigateTo(savedPage);

    showToast('Loading data...', 'info');
    await Promise.all([loadOfferings(), loadExpenses(), loadSettingsFromDB()]);
    showToast('Data loaded successfully!', 'success');

    refreshDashboard();
    refreshCurrentPage();
    setupRealtimeListeners();
});

function setupRealtimeListeners() {
    offeringsCollection.onSnapshot(snap => {
        offeringsCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        refreshCurrentPage();
    });
    expensesCollection.onSnapshot(snap => {
        expensesCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        refreshCurrentPage();
    });
}

function refreshCurrentPage() {
    const active = document.querySelector('.page.active');
    if (!active) return;
    const id = active.id.replace('page-', '');
    if (id === 'dashboard') refreshDashboard();
    if (id === 'add-offering') refreshOfferingHistory();
    if (id === 'add-expense') refreshExpenseHistory();
    if (id === 'reports') refreshReports();
}

function setCurrentDate() {
    document.getElementById('currentDate').textContent =
        new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('offeringDate').value = today;
    document.getElementById('expenseDate').value = today;
    updateSundayIndicator(today);
}

function getServiceLabel(dateStr, serviceType) {
    const d = new Date(dateStr);
    const day = d.getDay();
    const dayOfMonth = d.getDate();
    const nth = Math.ceil(dayOfMonth / 7);
    const suffixes = ['th', 'st', 'nd', 'rd', 'th'];
    const suffix = nth <= 3 ? suffixes[nth] : 'th';
    const monthName = d.toLocaleDateString('en-US', { month: 'long' });
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
    return `${dayName}, ${monthName} ${d.getDate()}, ${d.getFullYear()}`;
}

// Keep backward compatibility
function getSundayLabel(dateStr) {
    return getServiceLabel(dateStr, 'Missionary Funds');
}

function updateDayIndicator(dateStr, serviceType) {
    const indicator = document.getElementById('sundayIndicator');
    const label = document.getElementById('sundayLabel');
    if (!dateStr) { label.textContent = '\u2014'; return; }

    const serviceLabel = getServiceLabel(dateStr, serviceType || 'Missionary Funds');
    label.textContent = serviceLabel;
    indicator.classList.remove('not-sunday');
}

function updateSundayIndicator(dateStr) {
    const serviceType = document.getElementById('offeringType')?.value || 'Missionary Funds';
    updateDayIndicator(dateStr, serviceType);
}

// ==================== THEME TOGGLE ====================

function initThemeToggle() {
    const toggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');
    const html = document.documentElement;

    // Load saved preference
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);

    toggleBtn.addEventListener('click', () => {
        const current = html.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        localStorage.setItem('theme', next);

        // Animate the icon
        themeIcon.style.transform = 'rotate(360deg) scale(0)';
        setTimeout(() => {
            themeIcon.style.transform = 'rotate(0deg) scale(1)';
        }, 200);
    });

    function applyTheme(theme) {
        if (theme === 'light') {
            html.setAttribute('data-theme', 'light');
            themeIcon.className = 'fas fa-sun';
            toggleBtn.classList.add('light-active');
        } else {
            html.removeAttribute('data-theme');
            themeIcon.className = 'fas fa-moon';
            toggleBtn.classList.remove('light-active');
        }
    }
}

// ==================== PARTICLES ====================

function initParticles() {
    const c = document.getElementById('bgParticles');
    const colors = ['#6c63ff', '#00c9a7', '#ff6b9d', '#ffc107'];
    for (let i = 0; i < 20; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        const sz = Math.random() * 6 + 2;
        p.style.cssText = `width:${sz}px;height:${sz}px;background:${colors[Math.floor(Math.random() * 4)]};left:${Math.random() * 100}%;animation-duration:${Math.random() * 20 + 15}s;animation-delay:${Math.random() * 10}s;`;
        c.appendChild(p);
    }
}

// ==================== NAVIGATION SETUP ====================

function initNavigation() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', e => {
            e.preventDefault();
            const page = item.dataset.page;
            navigateTo(page);

            // Close sidebar on mobile after nav click, UNLESS it's just toggling the dropdown
            if (page !== 'reports') {
                sidebar.classList.remove('open');
                overlay.classList.remove('active');
            }
        });
    });

    const quickAddBtn = document.getElementById('quickAddBtn');
    if (quickAddBtn) quickAddBtn.addEventListener('click', () => navigateTo('add-offering'));

    document.getElementById('mobileMenuBtn').addEventListener('click', () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
    });

    // Close sidebar when tapping overlay
    overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    });
}

// ==================== DASHBOARD ====================

function refreshDashboard() {
    const now = new Date();
    const mo = now.getMonth();
    const yr = now.getFullYear();

    document.getElementById('dashboardMonthLabel').textContent =
        now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const monthOfferings = offeringsCache.filter(o => { const d = new Date(o.date); return d.getMonth() === mo && d.getFullYear() === yr; });
    const monthExpenses = expensesCache.filter(o => { const d = new Date(o.date); return d.getMonth() === mo && d.getFullYear() === yr; });

    const totalOff = monthOfferings.reduce((s, o) => s + parseFloat(o.amount), 0);
    const totalExp = monthExpenses.reduce((s, o) => s + parseFloat(o.amount), 0);
    const remaining = totalOff - totalExp;

    document.getElementById('dashTotalOfferings').textContent = formatCurrency(totalOff);
    document.getElementById('dashTotalExpenses').textContent = formatCurrency(totalExp);

    const remEl = document.getElementById('dashRemaining');
    remEl.textContent = formatCurrency(remaining);
    remEl.style.color = remaining >= 0 ? 'var(--balance-green)' : 'var(--accent-red)';

    // Split offerings by fund type
    const allOffSorted = [...offeringsCache].sort((a, b) => new Date(b.date) - new Date(a.date));
    const missionaryOff = allOffSorted.filter(o => o.serviceType !== 'General Funds' && o.serviceType !== 'Prayer Meeting' && o.serviceType !== 'Building Fund').slice(0, 5);
    const generalOff = allOffSorted.filter(o => o.serviceType === 'General Funds' || o.serviceType === 'Prayer Meeting').slice(0, 5);
    const buildingOff = allOffSorted.filter(o => o.serviceType === 'Building Fund').slice(0, 5);

    // Split expenses by fund type
    const allExpSorted = [...expensesCache].sort((a, b) => new Date(b.date) - new Date(a.date));
    const missionaryExp = allExpSorted.filter(o => o.serviceType !== 'General Funds' && o.serviceType !== 'Prayer Meeting' && o.serviceType !== 'Building Fund').slice(0, 5);
    const generalExp = allExpSorted.filter(o => o.serviceType === 'General Funds' || o.serviceType === 'Prayer Meeting').slice(0, 5);
    const buildingExp = allExpSorted.filter(o => o.serviceType === 'Building Fund').slice(0, 5);

    // Render offering rows (no Service column needed since they're separated)
    function renderOfferingRows(items, bodyId, emptyId, editFn) {
        const body = document.getElementById(bodyId);
        const empty = document.getElementById(emptyId);
        if (items.length === 0) {
            body.innerHTML = '';
            empty.style.display = 'block';
        } else {
            empty.style.display = 'none';
            body.innerHTML = items.map(o => `
                <tr>
                    <td>${formatDate(o.date)}</td>
                    <td class="amount-cell">${formatCurrency(o.amount)}</td>
                    <td>
                        <div class="action-btns">
                            <button class="action-btn edit" onclick="openEditOffering('${o.id}')" title="Edit"><i class="fas fa-pen"></i></button>
                            <button class="action-btn delete" onclick="confirmDelete('offering','${o.id}')" title="Delete"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    }

    function renderExpenseRows(items, bodyId, emptyId) {
        const body = document.getElementById(bodyId);
        const empty = document.getElementById(emptyId);
        if (items.length === 0) {
            body.innerHTML = '';
            empty.style.display = 'block';
        } else {
            empty.style.display = 'none';
            body.innerHTML = items.map(o => `
                <tr>
                    <td>${formatDate(o.date)}</td>
                    <td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${o.description}">${o.description}</td>
                    <td class="expense-cell">${formatCurrency(o.amount)}</td>
                    <td>
                        <div class="action-btns">
                            <button class="action-btn edit" onclick="openEditExpense('${o.id}')" title="Edit"><i class="fas fa-pen"></i></button>
                            <button class="action-btn delete" onclick="confirmDelete('expense','${o.id}')" title="Delete"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    }

    // Missionary
    renderOfferingRows(missionaryOff, 'dashMissionaryOfferingsBody', 'dashMissionaryOfferingsEmpty');
    renderExpenseRows(missionaryExp, 'dashMissionaryExpensesBody', 'dashMissionaryExpensesEmpty');

    // General
    renderOfferingRows(generalOff, 'dashGeneralOfferingsBody', 'dashGeneralOfferingsEmpty');
    renderExpenseRows(generalExp, 'dashGeneralExpensesBody', 'dashGeneralExpensesEmpty');

    // Building
    renderOfferingRows(buildingOff, 'dashBuildingOfferingsBody', 'dashBuildingOfferingsEmpty');
    renderExpenseRows(buildingExp, 'dashBuildingExpensesBody', 'dashBuildingExpensesEmpty');
}

// ==================== ADD OFFERING ====================

function populateHistoryMonthDropdown(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    const currentVal = select.value;

    // Collect only months that have actual data
    const monthsSet = new Set();
    offeringsCache.forEach(o => {
        const d = new Date(o.date);
        monthsSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });
    expensesCache.forEach(o => {
        const d = new Date(o.date);
        monthsSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });

    const sorted = [...monthsSet].sort().reverse();

    let html = '<option value="all">All Time</option>';
    html += sorted.map(m => {
        const [y, mo] = m.split('-');
        const label = new Date(y, mo - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        return `<option value="${m}">${label}</option>`;
    }).join('');

    select.innerHTML = html;

    if (currentVal && (sorted.includes(currentVal) || currentVal === 'all')) {
        select.value = currentVal;
    } else {
        select.value = 'all';
    }
}

function initOfferingForm() {
    // Day indicator: update on date or type change
    document.getElementById('offeringDate').addEventListener('change', e => {
        updateSundayIndicator(e.target.value);
    });
    document.getElementById('offeringType').addEventListener('change', () => {
        const dateVal = document.getElementById('offeringDate').value;
        if (dateVal) updateSundayIndicator(dateVal);
    });

    document.getElementById('offeringHistoryMonth').addEventListener('change', refreshOfferingHistory);

    document.getElementById('offeringForm').addEventListener('submit', async e => {
        e.preventDefault();
        const btn = document.getElementById('saveOfferingBtn');
        btn.disabled = true;
        btn.textContent = 'Saving...';

        const dateVal = document.getElementById('offeringDate').value;
        const amountVal = document.getElementById('offeringAmount').value;
        const serviceType = document.getElementById('offeringType').value;

        if (!dateVal || !amountVal || parseFloat(amountVal) <= 0) {
            showToast('Please fill in date and amount.', 'error');
            resetBtn(btn, 'Save Offering');
            return;
        }

        const serviceLabel = getServiceLabel(dateVal, serviceType);

        const data = {
            date: dateVal,
            amount: parseFloat(amountVal),
            serviceType: serviceType,
            sundayLabel: serviceLabel || '',
            notes: document.getElementById('offeringNotes').value.trim(),
            createdAt: new Date().toISOString()
        };

        const ok = await addOfferingToDB(data);
        resetBtn(btn, 'Save Offering');
        if (ok) {
            document.getElementById('offeringForm').reset();
            setDefaultDates();
            refreshOfferingHistory();
            refreshDashboard();
            closeModal('addOfferingModal');
        }
    });
}

function refreshOfferingHistory() {
    populateHistoryMonthDropdown('offeringHistoryMonth');
    let sorted = [...offeringsCache].sort((a, b) => new Date(b.date) - new Date(a.date));

    const selectedMonth = document.getElementById('offeringHistoryMonth').value;
    if (selectedMonth && selectedMonth !== 'all') {
        const [y, m] = selectedMonth.split('-');
        sorted = sorted.filter(o => {
            const d = new Date(o.date);
            return d.getFullYear() === parseInt(y) && (d.getMonth() + 1) === parseInt(m);
        });
    }

    const missionary = sorted.filter(o => o.serviceType !== 'General Funds' && o.serviceType !== 'Prayer Meeting' && o.serviceType !== 'Building Fund');
    const general = sorted.filter(o => o.serviceType === 'General Funds' || o.serviceType === 'Prayer Meeting');
    const building = sorted.filter(o => o.serviceType === 'Building Fund');

    function renderList(items, bodyId, emptyId) {
        const body = document.getElementById(bodyId);
        const empty = document.getElementById(emptyId);
        if (items.length === 0) {
            body.innerHTML = '';
            empty.style.display = 'block';
        } else {
            empty.style.display = 'none';
            body.innerHTML = items.map(o => `
                <tr>
                    <td>${formatDate(o.date)}</td>
                    <td class="amount-cell">${formatCurrency(o.amount)}</td>
                    <td>
                        <div class="action-btns">
                            <button class="action-btn edit" onclick="openEditOffering('${o.id}')" title="Edit"><i class="fas fa-pen"></i></button>
                            <button class="action-btn delete" onclick="confirmDelete('offering','${o.id}')" title="Delete"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    }

    renderList(missionary, 'missionaryOfferingHistoryBody', 'missionaryOfferingHistoryEmpty');
    renderList(general, 'generalOfferingHistoryBody', 'generalOfferingHistoryEmpty');
    renderList(building, 'buildingOfferingHistoryBody', 'buildingOfferingHistoryEmpty');
}

// ==================== ADD EXPENSE ====================

function initExpenseForm() {
    document.getElementById('expenseHistoryMonth').addEventListener('change', refreshExpenseHistory);

    document.getElementById('expenseForm').addEventListener('submit', async e => {
        e.preventDefault();
        const btn = document.getElementById('saveExpenseBtn');
        btn.disabled = true;
        btn.textContent = 'Saving...';

        const data = {
            date: document.getElementById('expenseDate').value,
            amount: parseFloat(document.getElementById('expenseAmount').value),
            description: document.getElementById('expenseDescription').value.trim(),
            category: document.getElementById('expenseCategory').value,
            serviceType: document.getElementById('expenseServiceType').value,
            notes: document.getElementById('expenseNotes').value.trim(),
            createdAt: new Date().toISOString()
        };

        if (!data.date || !data.amount || !data.description) {
            showToast('Please fill in all required fields.', 'error');
            resetBtn(btn, 'Save Expense');
            return;
        }

        const ok = await addExpenseToDB(data);
        resetBtn(btn, 'Save Expense');
        if (ok) {
            document.getElementById('expenseForm').reset();
            setDefaultDates();
            refreshExpenseHistory();
            refreshDashboard();
            closeModal('addExpenseModal');
        }
    });
}

function refreshExpenseHistory() {
    populateHistoryMonthDropdown('expenseHistoryMonth');
    let sorted = [...expensesCache].sort((a, b) => new Date(b.date) - new Date(a.date));

    const selectedMonth = document.getElementById('expenseHistoryMonth').value;
    if (selectedMonth && selectedMonth !== 'all') {
        const [y, m] = selectedMonth.split('-');
        sorted = sorted.filter(o => {
            const d = new Date(o.date);
            return d.getFullYear() === parseInt(y) && (d.getMonth() + 1) === parseInt(m);
        });
    }

    const missionary = sorted.filter(o => o.serviceType !== 'General Funds' && o.serviceType !== 'Prayer Meeting' && o.serviceType !== 'Building Fund');
    const general = sorted.filter(o => o.serviceType === 'General Funds' || o.serviceType === 'Prayer Meeting');
    const building = sorted.filter(o => o.serviceType === 'Building Fund');

    function renderList(items, bodyId, emptyId) {
        const body = document.getElementById(bodyId);
        const empty = document.getElementById(emptyId);
        if (items.length === 0) {
            body.innerHTML = '';
            empty.style.display = 'block';
        } else {
            empty.style.display = 'none';
            body.innerHTML = items.map(o => `
                <tr>
                    <td>${formatDate(o.date)}</td>
                    <td style="max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${o.description}">${o.description}</td>
                    <td class="expense-cell">${formatCurrency(o.amount)}</td>
                    <td>
                        <div class="action-btns">
                            <button class="action-btn edit" onclick="openEditExpense('${o.id}')" title="Edit"><i class="fas fa-pen"></i></button>
                            <button class="action-btn delete" onclick="confirmDelete('expense','${o.id}')" title="Delete"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    }

    renderList(missionary, 'missionaryExpenseHistoryBody', 'missionaryExpenseHistoryEmpty');
    renderList(general, 'generalExpenseHistoryBody', 'generalExpenseHistoryEmpty');
    renderList(building, 'buildingExpenseHistoryBody', 'buildingExpenseHistoryEmpty');
}

// ==================== MONTHLY REPORTS ====================

function initReports() {
    document.getElementById('reportMonthSelect').addEventListener('change', refreshReports);
    document.getElementById('exportReportBtn').addEventListener('click', exportReportCSV);
    document.getElementById('printReportBtn').addEventListener('click', () => { refreshReports(); setTimeout(() => window.print(), 300); });
}

function populateMonthDropdown() {
    const select = document.getElementById('reportMonthSelect');
    const currentVal = select.value;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Collect all years that have data
    const yearsSet = new Set([currentYear]);
    offeringsCache.forEach(o => yearsSet.add(new Date(o.date).getFullYear()));
    expensesCache.forEach(o => yearsSet.add(new Date(o.date).getFullYear()));

    // Build all 12 months for each year
    const allMonths = [];
    [...yearsSet].sort((a, b) => b - a).forEach(year => {
        for (let m = 12; m >= 1; m--) {
            allMonths.push(`${year}-${String(m).padStart(2, '0')}`);
        }
    });

    // Remove duplicates and sort descending
    const sorted = [...new Set(allMonths)].sort().reverse();

    select.innerHTML = sorted.map(m => {
        const [y, mo] = m.split('-');
        const label = new Date(y, mo - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        return `<option value="${m}">${label}</option>`;
    }).join('');

    // Restore previous selection or default to current month
    if (currentVal && sorted.includes(currentVal)) {
        select.value = currentVal;
    } else {
        select.value = currentMonth;
    }
}

function refreshReports() {
    populateMonthDropdown();

    const selected = document.getElementById('reportMonthSelect').value;
    if (!selected) return;

    const [year, month] = selected.split('-').map(Number);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthLabel = `${monthNames[month - 1]} ${year}`;

    // Filter data for selected month
    const mOff = offeringsCache
        .filter(o => { const d = new Date(o.date); return d.getMonth() === month - 1 && d.getFullYear() === year; })
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    const mExp = expensesCache
        .filter(o => { const d = new Date(o.date); return d.getMonth() === month - 1 && d.getFullYear() === year; })
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Split by service type
    const sunOff = mOff.filter(o => o.serviceType !== 'General Funds' && o.serviceType !== 'Prayer Meeting' && o.serviceType !== 'Building Fund');
    const prayOff = mOff.filter(o => o.serviceType === 'General Funds' || o.serviceType === 'Prayer Meeting');
    const buildOff = mOff.filter(o => o.serviceType === 'Building Fund');

    const sunExp = mExp.filter(o => o.serviceType !== 'General Funds' && o.serviceType !== 'Prayer Meeting' && o.serviceType !== 'Building Fund');
    const prayExp = mExp.filter(o => o.serviceType === 'General Funds' || o.serviceType === 'Prayer Meeting');
    const buildExp = mExp.filter(o => o.serviceType === 'Building Fund');

    const baseTotalSunOff = sunOff.reduce((s, o) => s + parseFloat(o.amount), 0);
    const buildingAllocation = baseTotalSunOff * 0.20;
    const totalSunOff = baseTotalSunOff - buildingAllocation;
    const totalSunExp = sunExp.reduce((s, o) => s + parseFloat(o.amount), 0);

    const totalPrayOff = prayOff.reduce((s, o) => s + parseFloat(o.amount), 0);
    const totalPrayExp = prayExp.reduce((s, o) => s + parseFloat(o.amount), 0);

    const baseTotalBuildOff = buildOff.reduce((s, o) => s + parseFloat(o.amount), 0);
    const totalBuildOff = baseTotalBuildOff + buildingAllocation;
    const totalBuildExp = buildExp.reduce((s, o) => s + parseFloat(o.amount), 0);

    // Filter Previous months
    const prevOff = offeringsCache.filter(o => {
        const d = new Date(o.date);
        return d.getFullYear() < year || (d.getFullYear() === year && d.getMonth() < month - 1);
    });
    const prevExp = expensesCache.filter(o => {
        const d = new Date(o.date);
        return d.getFullYear() < year || (d.getFullYear() === year && d.getMonth() < month - 1);
    });

    // Previous Balances
    const prevSunOffBase = prevOff.filter(o => o.serviceType !== 'General Funds' && o.serviceType !== 'Prayer Meeting' && o.serviceType !== 'Building Fund').reduce((s, o) => s + parseFloat(o.amount), 0);
    const prevSunAllocation = prevSunOffBase * 0.20;
    const prevSunExp = prevExp.filter(o => o.serviceType !== 'General Funds' && o.serviceType !== 'Prayer Meeting' && o.serviceType !== 'Building Fund').reduce((s, o) => s + parseFloat(o.amount), 0);
    const previousSunBalance = (prevSunOffBase - prevSunAllocation) - prevSunExp;

    const prevPrayOff = prevOff.filter(o => o.serviceType === 'General Funds' || o.serviceType === 'Prayer Meeting').reduce((s, o) => s + parseFloat(o.amount), 0);
    const prevPrayExp = prevExp.filter(o => o.serviceType === 'General Funds' || o.serviceType === 'Prayer Meeting').reduce((s, o) => s + parseFloat(o.amount), 0);
    const previousPrayBalance = prevPrayOff - prevPrayExp;

    const prevBuildOffBase = prevOff.filter(o => o.serviceType === 'Building Fund').reduce((s, o) => s + parseFloat(o.amount), 0);
    const prevBuildExp = prevExp.filter(o => o.serviceType === 'Building Fund').reduce((s, o) => s + parseFloat(o.amount), 0);
    const previousBuildBalance = (prevBuildOffBase + prevSunAllocation) - prevBuildExp;

    // Totals + Balances
    const sunThisMonth = totalSunOff - totalSunExp;
    const sunRemaining = sunThisMonth + previousSunBalance;

    const prayThisMonth = totalPrayOff - totalPrayExp;
    const prayRemaining = prayThisMonth + previousPrayBalance;

    const buildThisMonth = totalBuildOff - totalBuildExp;
    const buildRemaining = buildThisMonth + previousBuildBalance;

    const totalOff = totalSunOff + totalPrayOff + totalBuildOff;
    const totalExp = totalSunExp + totalPrayExp + totalBuildExp;
    const remaining = totalOff - totalExp;

    const activePage = localStorage.getItem('currentPage') || 'reports-missionary';
    const isMissionary = activePage === 'reports-missionary';
    const isGeneral = activePage === 'reports-general';
    const isBuilding = activePage === 'reports-building';

    // Update top summary cards dynamically based on active report fund
    if (isMissionary) {
        document.getElementById('reportTotalOfferings').textContent = formatCurrency(totalSunOff);
        document.getElementById('reportTotalExpenses').textContent = formatCurrency(totalSunExp);
        const remEl = document.getElementById('reportRemaining');
        remEl.textContent = formatCurrency(sunRemaining);
        remEl.style.color = sunRemaining >= 0 ? 'var(--balance-green)' : 'var(--accent-red)';

        document.getElementById('sundayDetailCard').style.display = 'block';
        document.getElementById('prayerDetailCard').style.display = 'none';
        document.getElementById('buildingDetailCard').style.display = 'none';
    } else if (isGeneral) {
        document.getElementById('reportTotalOfferings').textContent = formatCurrency(totalPrayOff);
        document.getElementById('reportTotalExpenses').textContent = formatCurrency(totalPrayExp);
        const remEl = document.getElementById('reportRemaining');
        remEl.textContent = formatCurrency(prayRemaining);
        remEl.style.color = prayRemaining >= 0 ? 'var(--balance-green)' : 'var(--accent-red)';

        document.getElementById('sundayDetailCard').style.display = 'none';
        document.getElementById('prayerDetailCard').style.display = 'block';
        document.getElementById('buildingDetailCard').style.display = 'none';
    } else if (isBuilding) {
        document.getElementById('reportTotalOfferings').textContent = formatCurrency(totalBuildOff);
        document.getElementById('reportTotalExpenses').textContent = formatCurrency(totalBuildExp);
        const remEl = document.getElementById('reportRemaining');
        remEl.textContent = formatCurrency(buildRemaining);
        remEl.style.color = buildRemaining >= 0 ? 'var(--balance-green)' : 'var(--accent-red)';

        document.getElementById('sundayDetailCard').style.display = 'none';
        document.getElementById('prayerDetailCard').style.display = 'none';
        document.getElementById('buildingDetailCard').style.display = 'block';
    }

    // ---- SUNDAY SERVICE SECTION ----
    document.getElementById('sundayDetailTitle').textContent = monthLabel;

    const sunOffBody = document.getElementById('sundayDetailOfferings');
    sunOffBody.innerHTML = sunOff.length === 0
        ? '<tr><td colspan="3" style="text-align:center;color:var(--text-muted);">No Sunday offerings this month</td></tr>'
        : sunOff.map(o => `
            <tr>
                <td>${formatDate(o.date)}</td>
                <td class="amount-cell">${formatCurrency(o.amount)}</td>
                <td style="color:var(--text-muted);">${getOrdinalDay(o.date)}</td>
            </tr>
        `).join('');
    document.getElementById('sundayDetailOfferingsTotal').textContent = formatCurrency(baseTotalSunOff);

    const sunExpBody = document.getElementById('sundayDetailExpenses');
    sunExpBody.innerHTML = sunExp.length === 0
        ? '<tr><td colspan="3" style="text-align:center;color:var(--text-muted);">No Sunday expenses this month</td></tr>'
        : sunExp.map(o => `
            <tr>
                <td>${formatDate(o.date)}</td>
                <td>${o.description}</td>
                <td class="expense-cell">${formatCurrency(o.amount)}</td>
            </tr>
        `).join('');
    document.getElementById('sundayDetailExpensesTotal').textContent = formatCurrency(totalSunExp);

    if (document.getElementById('sundaySummaryBaseOfferings')) {
        document.getElementById('sundaySummaryBaseOfferings').textContent = formatCurrency(baseTotalSunOff);
        document.getElementById('sundaySummaryAllocation').textContent = `-${formatCurrency(buildingAllocation)}`;
    }
    document.getElementById('sundaySummaryOfferings').textContent = formatCurrency(totalSunOff);
    document.getElementById('sundaySummaryExpenses').textContent = formatCurrency(totalSunExp);
    document.getElementById('sundaySummaryThisMonth').textContent = formatCurrency(sunThisMonth);
    document.getElementById('sundaySummaryPrevious').textContent = formatCurrency(previousSunBalance);
    const sunRemEl = document.getElementById('sundaySummaryRemaining');
    sunRemEl.textContent = formatCurrency(sunRemaining);
    sunRemEl.className = sunRemaining >= 0 ? 'balance-cell' : 'balance-cell negative';

    // ---- PRAYER MEETING SECTION ----
    document.getElementById('prayerDetailTitle').textContent = monthLabel;

    const prayOffBody = document.getElementById('prayerDetailOfferings');
    prayOffBody.innerHTML = prayOff.length === 0
        ? '<tr><td colspan="3" style="text-align:center;color:var(--text-muted);">No general fund offerings this month</td></tr>'
        : prayOff.map(o => `
            <tr>
                <td>${formatDate(o.date)}</td>
                <td class="amount-cell">${formatCurrency(o.amount)}</td>
                <td style="color:var(--text-muted);">${getOrdinalDay(o.date)}</td>
            </tr>
        `).join('');
    document.getElementById('prayerDetailOfferingsTotal').textContent = formatCurrency(totalPrayOff);

    const prayExpBody = document.getElementById('prayerDetailExpenses');
    prayExpBody.innerHTML = prayExp.length === 0
        ? '<tr><td colspan="3" style="text-align:center;color:var(--text-muted);">No general fund expenses this month</td></tr>'
        : prayExp.map(o => `
            <tr>
                <td>${formatDate(o.date)}</td>
                <td>${o.description}</td>
                <td class="expense-cell">${formatCurrency(o.amount)}</td>
            </tr>
        `).join('');
    document.getElementById('prayerDetailExpensesTotal').textContent = formatCurrency(totalPrayExp);

    document.getElementById('prayerSummaryOfferings').textContent = formatCurrency(totalPrayOff);
    document.getElementById('prayerSummaryExpenses').textContent = formatCurrency(totalPrayExp);
    document.getElementById('prayerSummaryThisMonth').textContent = formatCurrency(prayThisMonth);
    document.getElementById('prayerSummaryPrevious').textContent = formatCurrency(previousPrayBalance);
    const prayRemEl = document.getElementById('prayerSummaryRemaining');
    prayRemEl.textContent = formatCurrency(prayRemaining);
    prayRemEl.className = prayRemaining >= 0 ? 'balance-cell' : 'balance-cell negative';

    // ---- BUILDING FUND SECTION ----
    document.getElementById('buildingDetailTitle').textContent = monthLabel;

    const buildOffBody = document.getElementById('buildingDetailOfferings');
    buildOffBody.innerHTML = buildOff.length === 0
        ? '<tr><td colspan="3" style="text-align:center;color:var(--text-muted);">No building fund offerings this month</td></tr>'
        : buildOff.map(o => `
            <tr>
                <td>${formatDate(o.date)}</td>
                <td class="amount-cell">${formatCurrency(o.amount)}</td>
                <td style="color:var(--text-muted);">${getOrdinalDay(o.date)}</td>
            </tr>
        `).join('');
    document.getElementById('buildingDetailOfferingsTotal').textContent = formatCurrency(baseTotalBuildOff);

    const buildExpBody = document.getElementById('buildingDetailExpenses');
    buildExpBody.innerHTML = buildExp.length === 0
        ? '<tr><td colspan="3" style="text-align:center;color:var(--text-muted);">No building fund expenses this month</td></tr>'
        : buildExp.map(o => `
            <tr>
                <td>${formatDate(o.date)}</td>
                <td>${o.description}</td>
                <td class="expense-cell">${formatCurrency(o.amount)}</td>
            </tr>
        `).join('');
    document.getElementById('buildingDetailExpensesTotal').textContent = formatCurrency(totalBuildExp);

    if (document.getElementById('buildingSummaryBaseOfferings')) {
        document.getElementById('buildingSummaryBaseOfferings').textContent = formatCurrency(baseTotalBuildOff);
        document.getElementById('buildingSummaryAllocation').textContent = `+${formatCurrency(buildingAllocation)}`;
    }
    document.getElementById('buildingSummaryOfferings').textContent = formatCurrency(totalBuildOff);
    document.getElementById('buildingSummaryExpenses').textContent = formatCurrency(totalBuildExp);
    document.getElementById('buildingSummaryThisMonth').textContent = formatCurrency(buildThisMonth);
    document.getElementById('buildingSummaryPrevious').textContent = formatCurrency(previousBuildBalance);
    const buildRemEl = document.getElementById('buildingSummaryRemaining');
    buildRemEl.textContent = formatCurrency(buildRemaining);
    buildRemEl.className = buildRemaining >= 0 ? 'balance-cell' : 'balance-cell negative';
}

function exportReportCSV() {
    const selected = document.getElementById('reportMonthSelect').value;
    if (!selected) return;

    const [year, month] = selected.split('-').map(Number);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const mOff = offeringsCache.filter(o => { const d = new Date(o.date); return d.getMonth() === month - 1 && d.getFullYear() === year; });
    const mExp = expensesCache.filter(o => { const d = new Date(o.date); return d.getMonth() === month - 1 && d.getFullYear() === year; });

    const rows = [['Type', 'Service', 'Date', 'Description', 'Category', 'Amount']];
    mOff.forEach(o => rows.push(['Offering', o.serviceType || 'Missionary Funds', o.date, o.notes || '', '', parseFloat(o.amount).toFixed(2)]));
    mExp.forEach(o => rows.push(['Expense', o.serviceType || 'Missionary Funds', o.date, o.description, o.category || '', parseFloat(o.amount).toFixed(2)]));

    const totalOff = mOff.reduce((s, o) => s + parseFloat(o.amount), 0);
    const totalExp = mExp.reduce((s, o) => s + parseFloat(o.amount), 0);
    rows.push([]);
    rows.push(['', '', '', 'Total Offerings', totalOff.toFixed(2)]);
    rows.push(['', '', '', 'Total Expenses', totalExp.toFixed(2)]);
    rows.push(['', '', '', 'Remaining', (totalOff - totalExp).toFixed(2)]);

    const csv = rows.map(r => r.join(',')).join('\n');
    downloadFile(csv, `offerings_${monthNames[month - 1]}_${year}.csv`, 'text/csv');
    showToast('Report exported!', 'success');
}

// ==================== EDIT MODALS ====================

function openEditOffering(id) {
    const o = offeringsCache.find(x => x.id === id);
    if (!o) return;
    document.getElementById('editOfferingId').value = id;
    document.getElementById('editOfferingType').value = o.serviceType || 'Missionary Funds';
    document.getElementById('editOfferingDate').value = o.date;
    document.getElementById('editOfferingAmount').value = o.amount;
    document.getElementById('editOfferingNotes').value = o.notes || '';
    document.getElementById('editOfferingModal').classList.add('active');
}

function openEditExpense(id) {
    const o = expensesCache.find(x => x.id === id);
    if (!o) return;
    document.getElementById('editExpenseId').value = id;
    document.getElementById('editExpenseServiceType').value = o.serviceType || 'Missionary Funds';
    document.getElementById('editExpenseDate').value = o.date;
    document.getElementById('editExpenseAmount2').value = o.amount;
    document.getElementById('editExpenseDesc').value = o.description;
    document.getElementById('editExpenseCat').value = o.category || 'Others';
    document.getElementById('editExpenseNotes2').value = o.notes || '';
    document.getElementById('editExpenseModal').classList.add('active');
}

function initModals() {
    // Edit Offering
    document.getElementById('editOfferingForm').addEventListener('submit', async e => {
        e.preventDefault();
        const id = document.getElementById('editOfferingId').value;
        const ok = await updateOfferingInDB(id, {
            serviceType: document.getElementById('editOfferingType').value,
            date: document.getElementById('editOfferingDate').value,
            amount: parseFloat(document.getElementById('editOfferingAmount').value),
            notes: document.getElementById('editOfferingNotes').value.trim(),
            updatedAt: new Date().toISOString()
        });
        if (ok) { closeModal('editOfferingModal'); refreshCurrentPage(); }
    });

    // Edit Expense
    document.getElementById('editExpenseForm').addEventListener('submit', async e => {
        e.preventDefault();
        const id = document.getElementById('editExpenseId').value;
        const ok = await updateExpenseInDB(id, {
            serviceType: document.getElementById('editExpenseServiceType').value,
            date: document.getElementById('editExpenseDate').value,
            amount: parseFloat(document.getElementById('editExpenseAmount2').value),
            description: document.getElementById('editExpenseDesc').value.trim(),
            category: document.getElementById('editExpenseCat').value,
            notes: document.getElementById('editExpenseNotes2').value.trim(),
            updatedAt: new Date().toISOString()
        });
        if (ok) { closeModal('editExpenseModal'); refreshCurrentPage(); }
    });

    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', e => {
            if (e.target === overlay) closeModal(overlay.id);
        });
    });
}

// Delete confirmation
let pendingDelete = { type: '', id: '' };

function confirmDelete(type, id) {
    pendingDelete = { type, id };
    document.getElementById('deleteModal').classList.add('active');
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
        const { type, id } = pendingDelete;
        let ok = false;
        if (type === 'offering') ok = await deleteOfferingFromDB(id);
        if (type === 'expense') ok = await deleteExpenseFromDB(id);
        if (ok) { closeModal('deleteModal'); refreshCurrentPage(); refreshDashboard(); }
    });
});

function openModal(id) {
    document.getElementById(id).classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

// ==================== SETTINGS ====================

function initSettingsEvents() {
    document.getElementById('churchInfoForm').addEventListener('submit', async e => {
        e.preventDefault();
        await saveSettingsToDB({
            churchName: document.getElementById('churchName').value.trim(),
            churchAddress: document.getElementById('churchAddress').value.trim(),
            pastorName: document.getElementById('pastorName').value.trim(),
            treasurerName: document.getElementById('treasurerName').value.trim()
        });
    });

    document.getElementById('exportDataBtn').addEventListener('click', () => {
        const data = { offerings: offeringsCache, expenses: expensesCache, settings: settingsCache, exportDate: new Date().toISOString() };
        downloadFile(JSON.stringify(data, null, 2), 'offerings_backup.json', 'application/json');
        showToast('Backup exported!', 'success');
    });

    document.getElementById('importFile').addEventListener('change', async e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async ev => {
            try {
                const data = JSON.parse(ev.target.result);
                showToast('Importing data...', 'info');

                if (data.offerings && Array.isArray(data.offerings)) {
                    for (const o of data.offerings) {
                        const { id, ...d } = o;
                        await offeringsCollection.add(d);
                    }
                }
                if (data.expenses && Array.isArray(data.expenses)) {
                    for (const o of data.expenses) {
                        const { id, ...d } = o;
                        await expensesCollection.add(d);
                    }
                }
                if (data.settings) await saveSettingsToDB(data.settings);

                await Promise.all([loadOfferings(), loadExpenses()]);
                showToast('Data imported!', 'success');
                refreshCurrentPage();
            } catch { showToast('Failed to import data.', 'error'); }
        };
        reader.readAsText(file);
        e.target.value = '';
    });

    document.getElementById('clearDataBtn').addEventListener('click', async () => {
        if (!confirm('Delete ALL offerings and expenses? This cannot be undone!')) return;
        try {
            showToast('Clearing data...', 'info');
            localStorage.removeItem('offerings');
            localStorage.removeItem('expenses');
            offeringsCache = [];
            expensesCache = [];
            showToast('All data cleared.', 'info');
            refreshCurrentPage();
            refreshDashboard();
        } catch { showToast('Failed to clear data.', 'error'); }
    });
}

function loadSettingsUI() {
    const s = getSettings();
    document.getElementById('churchName').value = s.churchName || '';
    document.getElementById('churchAddress').value = s.churchAddress || '';
    document.getElementById('pastorName').value = s.pastorName || '';
    document.getElementById('treasurerName').value = s.treasurerName || '';
}

// ==================== UTILITIES ====================

function resetBtn(btn, label) {
    btn.disabled = false;
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> ${label}`;
}

function showToast(message, type = 'info') {
    const c = document.getElementById('toastContainer');
    const icons = { success: '<i class="fas fa-check-circle"></i>', error: '<i class="fas fa-times-circle"></i>', info: '<i class="fas fa-info-circle"></i>' };
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${message}</span>`;
    c.appendChild(t);
    setTimeout(() => { if (t.parentNode) t.remove(); }, 3000);
}

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
