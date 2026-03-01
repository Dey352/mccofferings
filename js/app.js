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
        const ref = await offeringsCollection.add(data);
        data.id = ref.id;
        offeringsCache.unshift(data);
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
        const i = offeringsCache.findIndex(o => o.id === id);
        if (i !== -1) offeringsCache[i] = { ...offeringsCache[i], ...data };
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
        offeringsCache = offeringsCache.filter(o => o.id !== id);
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
        const ref = await expensesCollection.add(data);
        data.id = ref.id;
        expensesCache.unshift(data);
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
        const i = expensesCache.findIndex(o => o.id === id);
        if (i !== -1) expensesCache[i] = { ...expensesCache[i], ...data };
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
        expensesCache = expensesCache.filter(o => o.id !== id);
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

// ==================== NAVIGATION ====================

function navigateTo(page) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const nav = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (nav) nav.classList.add('active');

    document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
    const pg = document.getElementById(`page-${page}`);
    if (pg) { void pg.offsetWidth; pg.classList.add('active'); }

    const titles = {
        'dashboard': ['Dashboard', "Overview of this month's finances"],
        'add-offering': ['Add Offering', 'Record total Sunday service offering'],
        'add-expense': ['Add Expense', 'Record a church expense'],
        'reports': ['Monthly Reports', 'Offerings vs expenses per month'],
        'settings': ['Settings', 'Manage church information and data']
    };

    const [t, s] = titles[page] || ['', ''];
    document.getElementById('pageTitle').textContent = t;
    document.getElementById('pageSubtitle').textContent = s;
    document.getElementById('sidebar').classList.remove('open');

    if (page === 'dashboard') refreshDashboard();
    if (page === 'add-offering') refreshOfferingHistory();
    if (page === 'add-expense') refreshExpenseHistory();
    if (page === 'reports') refreshReports();
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

    showToast('Loading data...', 'info');
    await Promise.all([loadOfferings(), loadExpenses(), loadSettingsFromDB()]);
    showToast('Data loaded successfully!', 'success');

    refreshDashboard();
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

function getSundayLabel(dateStr) {
    const d = new Date(dateStr);
    const day = d.getDay(); // 0 = Sunday
    if (day !== 0) return null; // Not a Sunday

    const dayOfMonth = d.getDate();
    const nth = Math.ceil(dayOfMonth / 7);
    const suffixes = ['th', 'st', 'nd', 'rd', 'th'];
    const suffix = nth <= 3 ? suffixes[nth] : 'th';
    const monthName = d.toLocaleDateString('en-US', { month: 'long' });
    return `${nth}${suffix} Sunday of ${monthName}`;
}

function updateSundayIndicator(dateStr) {
    const indicator = document.getElementById('sundayIndicator');
    const label = document.getElementById('sundayLabel');
    if (!dateStr) { label.textContent = '—'; return; }

    const sundayText = getSundayLabel(dateStr);
    if (sundayText) {
        label.textContent = sundayText;
        indicator.classList.remove('not-sunday');
    } else {
        const dayName = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' });
        label.textContent = `Not a Sunday (${dayName})`;
        indicator.classList.add('not-sunday');
    }
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
            navigateTo(item.dataset.page);
            // Close sidebar on mobile after nav click
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
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

    // Recent Offerings (last 5)
    const recentOff = [...offeringsCache].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    const offBody = document.getElementById('dashOfferingsBody');
    const offEmpty = document.getElementById('dashOfferingsEmpty');

    if (recentOff.length === 0) {
        offBody.innerHTML = '';
        offEmpty.style.display = 'block';
    } else {
        offEmpty.style.display = 'none';
        offBody.innerHTML = recentOff.map(o => `
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

    // Recent Expenses (last 5)
    const recentExp = [...expensesCache].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    const expBody = document.getElementById('dashExpensesBody');
    const expEmpty = document.getElementById('dashExpensesEmpty');

    if (recentExp.length === 0) {
        expBody.innerHTML = '';
        expEmpty.style.display = 'block';
    } else {
        expEmpty.style.display = 'none';
        expBody.innerHTML = recentExp.map(o => `
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

// ==================== ADD OFFERING ====================

function initOfferingForm() {
    // Sunday indicator: update on date change
    document.getElementById('offeringDate').addEventListener('change', e => {
        updateSundayIndicator(e.target.value);
    });

    document.getElementById('offeringForm').addEventListener('submit', async e => {
        e.preventDefault();
        const btn = document.getElementById('saveOfferingBtn');
        btn.disabled = true;
        btn.textContent = 'Saving...';

        const dateVal = document.getElementById('offeringDate').value;
        const amountVal = document.getElementById('offeringAmount').value;

        if (!dateVal || !amountVal || parseFloat(amountVal) <= 0) {
            showToast('Please fill in date and amount.', 'error');
            resetBtn(btn, 'Save Offering');
            return;
        }

        const sundayText = getSundayLabel(dateVal);

        const data = {
            date: dateVal,
            amount: parseFloat(amountVal),
            sundayLabel: sundayText || '',
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
        }
    });
}

function refreshOfferingHistory() {
    const sorted = [...offeringsCache].sort((a, b) => new Date(b.date) - new Date(a.date));
    const body = document.getElementById('offeringHistoryBody');
    const empty = document.getElementById('offeringHistoryEmpty');

    if (sorted.length === 0) {
        body.innerHTML = '';
        empty.style.display = 'block';
    } else {
        empty.style.display = 'none';
        body.innerHTML = sorted.map(o => `
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

// ==================== ADD EXPENSE ====================

function initExpenseForm() {
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
        }
    });
}

function refreshExpenseHistory() {
    const sorted = [...expensesCache].sort((a, b) => new Date(b.date) - new Date(a.date));
    const body = document.getElementById('expenseHistoryBody');
    const empty = document.getElementById('expenseHistoryEmpty');

    if (sorted.length === 0) {
        body.innerHTML = '';
        empty.style.display = 'block';
    } else {
        empty.style.display = 'none';
        body.innerHTML = sorted.map(o => `
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

    const totalOff = mOff.reduce((s, o) => s + parseFloat(o.amount), 0);
    const totalExp = mExp.reduce((s, o) => s + parseFloat(o.amount), 0);
    const remaining = totalOff - totalExp;

    // Update summary cards
    document.getElementById('reportTotalOfferings').textContent = formatCurrency(totalOff);
    document.getElementById('reportTotalExpenses').textContent = formatCurrency(totalExp);

    const remEl = document.getElementById('reportRemaining');
    remEl.textContent = formatCurrency(remaining);
    remEl.style.color = remaining >= 0 ? 'var(--balance-green)' : 'var(--accent-red)';

    // Update detail card title
    document.getElementById('monthDetailTitle').textContent = monthLabel;

    // Offerings table
    const offBody = document.getElementById('monthDetailOfferings');
    offBody.innerHTML = mOff.length === 0
        ? '<tr><td colspan="3" style="text-align:center;color:var(--text-muted);">No offerings recorded this month</td></tr>'
        : mOff.map(o => `
            <tr>
                <td>${formatDate(o.date)}</td>
                <td class="amount-cell">${formatCurrency(o.amount)}</td>
                <td style="color:var(--text-muted);">${o.notes || '—'}</td>
            </tr>
        `).join('');

    document.getElementById('monthDetailOfferingsTotal').textContent = formatCurrency(totalOff);

    // Expenses table
    const expBody = document.getElementById('monthDetailExpenses');
    expBody.innerHTML = mExp.length === 0
        ? '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);">No expenses recorded this month</td></tr>'
        : mExp.map(o => `
            <tr>
                <td>${formatDate(o.date)}</td>
                <td>${o.description}</td>
                <td style="color:var(--text-muted);">${o.category || ''}</td>
                <td class="expense-cell">${formatCurrency(o.amount)}</td>
            </tr>
        `).join('');

    document.getElementById('monthDetailExpensesTotal').textContent = formatCurrency(totalExp);

    // Summary footer
    document.getElementById('monthSummaryOfferings').textContent = formatCurrency(totalOff);
    document.getElementById('monthSummaryExpenses').textContent = formatCurrency(totalExp);

    const sumRemEl = document.getElementById('monthSummaryRemaining');
    sumRemEl.textContent = formatCurrency(remaining);
    sumRemEl.className = remaining >= 0 ? 'balance-cell' : 'balance-cell negative';
}

function exportReportCSV() {
    const selected = document.getElementById('reportMonthSelect').value;
    if (!selected) return;

    const [year, month] = selected.split('-').map(Number);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const mOff = offeringsCache.filter(o => { const d = new Date(o.date); return d.getMonth() === month - 1 && d.getFullYear() === year; });
    const mExp = expensesCache.filter(o => { const d = new Date(o.date); return d.getMonth() === month - 1 && d.getFullYear() === year; });

    const rows = [['Type', 'Date', 'Description', 'Category', 'Amount']];
    mOff.forEach(o => rows.push(['Offering', o.date, o.notes || '', '', parseFloat(o.amount).toFixed(2)]));
    mExp.forEach(o => rows.push(['Expense', o.date, o.description, o.category || '', parseFloat(o.amount).toFixed(2)]));

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
    document.getElementById('editOfferingDate').value = o.date;
    document.getElementById('editOfferingAmount').value = o.amount;
    document.getElementById('editOfferingNotes').value = o.notes || '';
    document.getElementById('editOfferingModal').classList.add('active');
}

function openEditExpense(id) {
    const o = expensesCache.find(x => x.id === id);
    if (!o) return;
    document.getElementById('editExpenseId').value = id;
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
