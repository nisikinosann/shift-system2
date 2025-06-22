let shiftData = [];

const helpContent = {
    job: {
        title: "業務設定について",
        content: `<p><strong>業務名:</strong> シフトで行う業務の名前。</p><p><strong>所属グループ:</strong> 事前に作成したグループを選択。</p><p><strong>業務ごとの間隔:</strong> この業務を一度行うと、次に同じ業務ができるまでの最短日数。</p><p><strong>必要人数/日:</strong> その業務を1日に行う人数。</p>`
    },
    group: {
        title: "グループ設定について",
        content: `<p>関連業務をまとめる機能。</p><p><strong>グループ名:</strong> 例：キッチン、ホール。</p><p><strong>グループの間隔:</strong> このグループの業務を一度行うと、次にこのグループの<strong>いずれかの</strong>業務ができるまでの最短日数。</p>`
    },
    holiday: {
        title: "休業日設定について",
        content: `<p>会社全体が休業となる日。MM-DD形式で、複数はカンマ区切り。休業日にはシフトは組まれません。</p>`
    },
    employee: {
        title: "従業員設定について",
        content: `<p><strong>Aモード:</strong> 従業員の名前と、休暇希望日（MM-DD形式、カンマ区切り）を入力。</p><p><strong>Bモード:</strong> 従業員の名前をカンマか読点で区切って一括入力。休暇希望は名前の直後に()で囲って入力します。例: 池田(01-15, 01-20), 佐藤</p>`
    },
    date: {
        title: "シフト期間設定について",
        content: `<p>シフト表を作成する期間を設定します。</p>`
    }
};

function saveSettings() {
    const settings = {
        mode: document.querySelector('input[name="input-mode"]:checked').value,
        jobsA: collectJobData(true),
        employeesA: collectEmployeeData(true),
        jobsB: document.getElementById('bulk-jobs').value,
        employeesB: document.getElementById('bulk-employees').value,
        groups: collectGroupData(),
        holidays: document.getElementById('holidays').value,
        startDate: document.getElementById('start-date').value,
        endDate: document.getElementById('end-date').value,
    };
    localStorage.setItem('shiftGeneratorSettings', JSON.stringify(settings));
    const saveBtn = document.getElementById('save-settings-btn');
    saveBtn.textContent = '💾 保存しました!';
    setTimeout(() => { saveBtn.textContent = '💾 現在の設定を保存'; }, 2000);
}

function loadSettings() {
    const savedSettings = localStorage.getItem('shiftGeneratorSettings');
    if (!savedSettings) {
        // デフォルトで1行ずつ追加
        createGroupRow();
        createJobRow();
        addEmployee();
        return;
    }
    const settings = JSON.parse(savedSettings);

    if (settings.mode) {
        const radio = document.querySelector(`input[name="input-mode"][value="${settings.mode}"]`);
        if(radio) radio.checked = true;
        toggleMode(settings.mode || 'a');
    }
    
    if (settings.groups && settings.groups.length > 0) {
        document.getElementById('group-list').innerHTML = '';
        settings.groups.forEach(group => createGroupRow(group));
    } else {
        createGroupRow();
    }

    if (settings.jobsA && settings.jobsA.length > 0) {
        document.getElementById('job-list').innerHTML = '';
        settings.jobsA.forEach(job => createJobRow(job));
    } else {
        createJobRow();
    }
    
    if (settings.employeesA && settings.employeesA.length > 0) {
        document.getElementById('employee-list').innerHTML = '';
        settings.employeesA.forEach(emp => addEmployee(emp));
    } else {
        addEmployee();
    }
    
    document.getElementById('bulk-jobs').value = settings.jobsB || '';
    document.getElementById('bulk-employees').value = settings.employeesB || '';
    document.getElementById('holidays').value = settings.holidays || '';
    document.getElementById('start-date').value = settings.startDate || '';
    document.getElementById('end-date').value = settings.endDate || '';
    
    updateJobGroupDropdowns();
}

function setupNotepad() {
    const notepad = document.getElementById('notepad');
    notepad.value = localStorage.getItem('shiftNotepad') || '';
    let debounceTimer;
    notepad.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            localStorage.setItem('shiftNotepad', notepad.value);
        }, 500);
    });
}

function toggleMode(mode) {
    document.getElementById('mode-a-job-section').style.display = mode === 'a' ? 'block' : 'none';
    document.getElementById('mode-b-job-section').style.display = mode === 'b' ? 'block' : 'none';
    document.getElementById('mode-a-employee-section').style.display = mode === 'a' ? 'block' : 'none';
    document.getElementById('mode-b-employee-section').style.display = mode === 'b' ? 'block' : 'none';
}

function createJobRow(job = {}) {
    const jobList = document.getElementById('job-list');
    const jobConfig = document.createElement('div');
    jobConfig.className = 'job-config';
    const groups = collectGroupData();
    let groupOptions = '<option value="">なし</option>';
    groups.forEach(group => {
        groupOptions += `<option value="${group.name}" ${job.group === group.name ? 'selected' : ''}>${group.name}</option>`;
    });
    jobConfig.innerHTML = `
        <div class="form-group" style="flex: 2;"><label>業務名</label><input type="text" placeholder="例: 皿洗い" class="job-name" value="${job.name || ''}"></div>
        <div class="form-group" style="flex: 1;"><label>所属グループ</label><select class="job-group">${groupOptions}</select></div>
        <div class="form-group" style="flex: 1;"><label>間隔(日)</label><input type="number" min="0" class="job-interval" value="${job.interval || 0}"></div>
        <div class="form-group" style="flex: 1;"><label>必要人数/日</label><input type="number" min="1" class="job-people" value="${job.people || 1}"></div>
        <button class="remove-btn" data-action="remove-job">削除</button>`;
    jobList.appendChild(jobConfig);
}

function createGroupRow(group = {}) {
    const groupList = document.getElementById('group-list');
    const groupConfig = document.createElement('div');
    groupConfig.className = 'job-config';
    groupConfig.innerHTML = `
        <div class="form-group" style="flex: 2;"><label>グループ名</label><input type="text" placeholder="例: キッチン" class="group-name" value="${group.name || ''}"></div>
        <div class="form-group" style="flex: 1;"><label>グループの間隔(日)</label><input type="number" min="0" class="group-interval" value="${group.interval || 0}"></div>
        <button class="remove-btn" data-action="remove-group">削除</button>`;
    groupList.appendChild(groupConfig);
}

function addEmployee(employee = {}) {
    const employeeList = document.getElementById('employee-list');
    const employeeRow = document.createElement('div');
    employeeRow.className = 'employee-row';
    employeeRow.innerHTML = `
        <div class="form-group" style="flex: 1;"><label>氏名</label><input type="text" placeholder="例: 池田" class="employee-name" value="${employee.name || ''}"></div>
        <div class="form-group" style="flex: 2;"><label>休暇希望日</label><input type="text" placeholder="例: 01-02, 01-15" class="vacation-dates" value="${(employee.vacationDates || []).join(', ')}"></div>
        <button class="remove-btn" data-action="remove-employee">削除</button>`;
    employeeList.appendChild(employeeRow);
}

function showHelp(type) {
    const modal = document.getElementById('help-modal');
    if (!modal || !helpContent[type]) return;
    document.getElementById('help-title').textContent = helpContent[type].title;
    document.getElementById('help-content').innerHTML = helpContent[type].content;
    modal.style.display = 'flex';
}
function closeHelp() { document.getElementById('help-modal').style.display = 'none'; }
function collectGroupData() {
    const groups = [];
    document.querySelectorAll('#group-list .job-config').forEach(row => {
        const name = row.querySelector('.group-name').value.trim();
        const interval = parseInt(row.querySelector('.group-interval').value, 10) || 0;
        if (name) groups.push({ name, interval });
    });
    return groups;
}
function collectJobData(isForSave = false) {
    const mode = document.querySelector('input[name="input-mode"]:checked').value;
    if (mode === 'b' && !isForSave) {
        const text = document.getElementById('bulk-jobs').value;
        return text.split(/[,、]/).map(name => name.trim()).filter(name => name).map(name => ({ name, group: '', interval: 0, people: 1 }));
    }
    const jobs = [];
    document.querySelectorAll('#job-list .job-config').forEach(row => {
        const name = row.querySelector('.job-name').value.trim();
        const group = row.querySelector('.job-group').value;
        const interval = parseInt(row.querySelector('.job-interval').value, 10) || 0;
        const people = parseInt(row.querySelector('.job-people').value, 10) || 1;
        if (name) jobs.push({ name, group, interval, people });
    });
    return jobs;
}
function collectEmployeeData(isForSave = false) {
    const mode = document.querySelector('input[name="input-mode"]:checked').value;
    if (mode === 'b' && !isForSave) {
        const text = document.getElementById('bulk-employees').value;
        if (!text) return [];
        const employeeEntries = text.split(/[,、]/).map(e => e.trim()).filter(e => e);
        return employeeEntries.map(entry => {
            const match = entry.match(/(.+?)\s*\((.*)\)/);
            if (match) {
                const name = match[1].trim();
                const vacationStr = match[2];
                const vacationDates = vacationStr ? vacationStr.split(/[,、]/).map(d => d.trim()).filter(d => d) : [];
                return { name, vacationDates };
            } else {
                return { name: entry.trim(), vacationDates: [] };
            }
        });
    }
    const employees = [];
    document.querySelectorAll('#employee-list .employee-row').forEach(row => {
        const name = row.querySelector('.employee-name').value.trim();
        const vacationDatesStr = row.querySelector('.vacation-dates').value.trim();
        if (name) {
            const vacationDates = vacationDatesStr ? vacationDatesStr.split(/[,、]/).map(d => d.trim()).filter(d => d) : [];
            employees.push({ name, vacationDates });
        }
    });
    return employees;
}
function collectHolidays() {
    const holidaysStr = document.getElementById('holidays').value.trim();
    return holidaysStr ? holidaysStr.split(/[,、]/).map(d => d.trim()).filter(d => d) : [];
}
function generateShift() {
    const jobs = collectJobData();
    const employees = collectEmployeeData();
    const groups = collectGroupData();
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const holidays = collectHolidays();
    if (!validateInput(jobs, employees, startDate, endDate)) return;
    shiftData = generateShiftSchedule(jobs, employees, startDate, endDate, holidays, groups);
    displayShiftTable(shiftData, startDate, endDate, employees, holidays);
    document.getElementById('export-btn').style.display = 'inline-block';
    document.getElementById('shift-result').style.display = 'block';
}
function validateInput(jobs, employees, startDate, endDate) {
    if (jobs.length === 0) { alert('業務を少なくとも1つ設定してください'); return false; }
    if (employees.length === 0) { alert('従業員を少なくとも1人登録してください'); return false; }
    if (!startDate || !endDate) { alert('シフト期間を設定してください'); return false; }
    if (new Date(startDate) >= new Date(endDate)) { alert('終了日は開始日より後の日付を設定してください'); return false; }
    return true;
}
function generateShiftSchedule(jobs, employees, startDate, endDate, holidays, groups) {
    const schedule = {};
    const employeeLastJob = {};
    employees.forEach(emp => { employeeLastJob[emp.name] = { jobs: {}, groups: {} }; });
    const dates = generateDateRange(startDate, endDate);
    dates.forEach(date => {
        schedule[date] = {};
        const dateStrMMDD = formatDateForCheck(date);
        if (holidays.includes(dateStrMMDD)) {
            employees.forEach(emp => { schedule[date][emp.name] = '休業日'; });
            return;
        }
        let availableForAnyJob = [...employees];
        jobs.forEach(job => {
            let assignedCount = 0;
            const shuffledEmployees = [...availableForAnyJob].sort(() => Math.random() - 0.5);
            shuffledEmployees.forEach(emp => {
                if (assignedCount >= job.people) return;
                if (checkAvailability(emp, job, date, employeeLastJob, groups)) {
                    if (!schedule[date][emp.name]) schedule[date][emp.name] = [];
                    schedule[date][emp.name].push(job.name);
                    availableForAnyJob = availableForAnyJob.filter(e => e.name !== emp.name);
                    employeeLastJob[emp.name].jobs[job.name] = date;
                    if (job.group) employeeLastJob[emp.name].groups[job.group] = date;
                    assignedCount++;
                }
            });
        });
        employees.forEach(emp => {
            if (!schedule[date][emp.name]) {
                const vacationDates = emp.vacationDates.map(vd => formatVacationDate(vd, date));
                schedule[date][emp.name] = vacationDates.includes(date) ? '休暇' : '休';
            }
        });
    });
    return schedule;
}
function checkAvailability(employee, job, date, employeeLastJob, groups) {
    const vacationDates = employee.vacationDates.map(vd => formatVacationDate(vd, date));
    if (vacationDates.includes(date)) return false;
    const lastJobRecords = employeeLastJob[employee.name];
    const currentDate = new Date(date);
    const lastJobDateForJob = lastJobRecords.jobs[job.name];
    if (lastJobDateForJob && job.interval > 0) {
        if ((currentDate - new Date(lastJobDateForJob)) / 86400000 < job.interval) return false;
    }
    if (job.group) {
        const group = groups.find(g => g.name === job.group);
        if (group && group.interval > 0) {
            const lastJobDateForGroup = lastJobRecords.groups[job.group];
            if (lastJobDateForGroup) {
                if ((currentDate - new Date(lastJobDateForGroup)) / 86400000 < group.interval) return false;
            }
        }
    }
    return true;
}
function displayShiftTable(schedule, startDate, endDate, employees, holidays) {
    const dates = generateDateRange(startDate, endDate);
    const container = document.getElementById('shift-table-container');
    let html = '<table class="shift-table"><thead><tr><th>氏名</th>';
    dates.forEach(date => {
        const d = new Date(date + 'T00:00:00');
        const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()];
        html += `<th>${d.getMonth() + 1}/${d.getDate()}<br>(${dayOfWeek})</th>`;
    });
    html += '</tr></thead><tbody>';
    employees.forEach(emp => {
        html += `<tr><td><strong>${emp.name}</strong></td>`;
        dates.forEach(date => {
            const d = new Date(date + 'T00:00:00');
            const dayOfWeek = d.getDay();
            const dateStrMMDD = formatDateForCheck(date);
            let cellClass = (dayOfWeek === 0 || holidays.includes(dateStrMMDD)) ? 'holiday' : '';
            const shift = schedule[date]?.[emp.name];
            const cellContent = Array.isArray(shift) ? shift.join('<br>') : (shift || '休');
            if (cellContent === '休暇') cellClass = 'vacation';
            html += `<td class="${cellClass}">${cellContent}</td>`;
        });
        html += '</tr>';
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}
function generateDateRange(startDate, endDate) {
    const dates = [];
    let current = new Date(new Date(startDate).setUTCHours(0,0,0,0));
    const end = new Date(new Date(endDate).setUTCHours(0,0,0,0));
    while (current <= end) {
        dates.push(current.toISOString().slice(0, 10));
        current.setDate(current.getDate() + 1);
    }
    return dates;
}
function formatDateForCheck(date) { return date.slice(5); }
function formatVacationDate(vacationDate, currentDate) { const year = new Date(currentDate).getFullYear(); return `${year}-${vacationDate}`; }
function exportToExcel() {
    if (Object.keys(shiftData).length === 0) { alert('エクスポートするデータがありません。'); return; }
    const employees = collectEmployeeData(true); // Aモードのデータを正としてエクスポート
    const data = [];
    const dates = generateDateRange(document.getElementById('start-date').value, document.getElementById('end-date').value);
    const headerRow = ['氏名', ...dates.map(date => {
        const d = new Date(date + 'T00:00:00');
        const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()];
        return `${d.getMonth() + 1}/${d.getDate()} (${dayOfWeek})`;
    })];
    data.push(headerRow);
    employees.forEach(emp => {
        const row = [emp.name];
        dates.forEach(date => {
            const shift = shiftData[date]?.[emp.name];
            row.push(Array.isArray(shift) ? shift.join(', ') : (shift || '休'));
        });
        data.push(row);
    });
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'シフト表');
    XLSX.writeFile(workbook, `シフト表_${document.getElementById('start-date').value}.xlsx`);
}
function updateJobGroupDropdowns() {
    const groups = collectGroupData();
    let groupOptions = '<option value="">なし</option>';
    groups.forEach(group => { groupOptions += `<option value="${group.name}">${group.name}</option>`; });
    document.querySelectorAll('.job-group').forEach(select => {
        const selectedValue = select.value;
        select.innerHTML = groupOptions;
        if (groups.find(g => g.name === selectedValue)) select.value = selectedValue;
    });
}
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('input[name="input-mode"]').forEach(radio => radio.addEventListener('change', e => toggleMode(e.target.value)));
    document.getElementById('add-job-btn').addEventListener('click', createJobRow);
    document.getElementById('add-group-btn').addEventListener('click', () => { createGroupRow(); updateJobGroupDropdowns(); });
    document.getElementById('add-employee-btn').addEventListener('click', addEmployee);
    document.getElementById('generate-btn').addEventListener('click', generateShift);
    document.getElementById('save-settings-btn').addEventListener('click', saveSettings);
    document.getElementById('help-close').addEventListener('click', closeHelp);
    document.getElementById('export-btn').addEventListener('click', exportToExcel);
    document.body.addEventListener('click', e => {
        if (e.target.classList.contains('help-btn')) showHelp(e.target.dataset.help);
        if (e.target.matches('[data-action]')) e.target.parentElement.remove();
        if (e.target.matches('[data-action="remove-group"]')) setTimeout(updateJobGroupDropdowns, 100);
    });
    document.getElementById('group-list').addEventListener('input', e => {
        if (e.target.classList.contains('group-name')) updateJobGroupDropdowns();
    });
    window.addEventListener('click', e => { if (e.target === document.getElementById('help-modal')) closeHelp(); });
    
    setupNotepad();
    loadSettings();
});
