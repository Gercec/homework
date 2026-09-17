const studentsList = [
  "Буряк Александр Дмитриевич",
  "Выходцев Александр Павлович",
  "Егоров Глеб Александрович",
  "Ершов Михаил Сергеевич",
  "Иванова Анастасия Ивановна",
  "Иванова Елена Алексеевна",
  "Ильин Фёдор Антонович",
  "Казанджян Кристина Оганесовна",
  "Князева Мария Владимировна",
  "Корольков Дмитрий Николаевич",
  "Купчиков Артём Александрович",
  "Макитрин Алексей Андреевич",
  "Максимов Роман Станиславович",
  "Николаев Дмитрий Дмитриевич",
  "Павликов Матвей Алексеевич",
  "Сорокин Илья Павлович",
  "Сосина Анна Константиновна",
  "Торопов Вячеслав Васильевич",
  "Усуфджанова Малика Зафаровна",
  "Филимонов Сергей Алексеевич",
  "Филиппова Василиса Денисовна",
  "Фуркулицэ Михаил Михайлович",
  "Фуфлыгина Екатерина Алексеевна",
  "Чернышев Никита Алексеевич",
  "Чуева Мария Евгеньевна",
  "Щукин Никита Павлович"
];

let studentPasswords = JSON.parse(localStorage.getItem('student_passwords') || '{}');
studentsList.forEach(name => {
  if (!studentPasswords[name]) {
    studentPasswords[name] = "123";
  }
});

let pendingPasswordChangeStudent = null;
let currentLoggedInStudent = localStorage.getItem('logged_student') || null;

window.addEventListener('DOMContentLoaded', () => {
  initStudentSelect();
  checkAuth();
  renderTeacherList();
});

function switchTab(tab) {
  const isStudent = tab === 'student';
  document.getElementById('tabStudentBtn').classList.toggle('active', isStudent);
  document.getElementById('tabTeacherBtn').classList.toggle('active', !isStudent);
  
  document.getElementById('studentTabSection').classList.toggle('hidden', !isStudent);
  document.getElementById('teacherTabSection').classList.toggle('hidden', isStudent);

  if (!isStudent) {
    renderTeacherList();
  }
}

function initStudentSelect() {
  const select = document.getElementById('studentSelect');
  select.innerHTML = '<option value="">-- Выберите студента --</option>';
  studentsList.forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);
  });
}

function checkAuth() {
  if (currentLoggedInStudent) {
    document.getElementById('loginCard').classList.add('hidden');
    document.getElementById('studentDashboard').classList.remove('hidden');
    document.getElementById('studentGreeting').textContent = `ЛИЧНЫЙ КАБИНЕТ: ${currentLoggedInStudent}`;
    renderStudentFiles();
  } else {
    document.getElementById('loginCard').classList.remove('hidden');
    document.getElementById('studentDashboard').classList.add('hidden');
  }
}

function studentLogin() {
  const name = document.getElementById('studentSelect').value;
  const pass = document.getElementById('studentPassword').value;
  const errEl = document.getElementById('loginError');

  if (!name) {
    errEl.textContent = 'Выберите имя из списка!';
    errEl.style.display = 'block';
    return;
  }

  if (studentPasswords[name] === pass) {
    errEl.style.display = 'none';
    document.getElementById('studentPassword').value = '';

    if (pass === "123") {
      pendingPasswordChangeStudent = name;
      document.getElementById('newPasswordInput').value = '';
      document.getElementById('passwordError').style.display = 'none';
      document.getElementById('changePasswordModal').classList.add('active');
      return;
    }

    currentLoggedInStudent = name;
    localStorage.setItem('logged_student', name);
    checkAuth();
  } else {
    errEl.textContent = 'Неверный пароль!';
    errEl.style.display = 'block';
  }
}

function saveNewPassword() {
  const newPass = document.getElementById('newPasswordInput').value.trim();
  const errEl = document.getElementById('passwordError');

  if (newPass.length < 3) {
    errEl.textContent = 'Пароль должен содержать хотя бы 3 символа!';
    errEl.style.display = 'block';
    return;
  }

  if (newPass === "123") {
    errEl.textContent = 'Новый пароль не должен совпадать со стандартным!';
    errEl.style.display = 'block';
    return;
  }

  studentPasswords[pendingPasswordChangeStudent] = newPass;
  localStorage.setItem('student_passwords', JSON.stringify(studentPasswords));

  document.getElementById('changePasswordModal').classList.remove('active');
  currentLoggedInStudent = pendingPasswordChangeStudent;
  localStorage.setItem('logged_student', currentLoggedInStudent);
  pendingPasswordChangeStudent = null;

  alert('Пароль успешно изменен!');
  checkAuth();
}

function studentLogout() {
  currentLoggedInStudent = null;
  localStorage.removeItem('logged_student');
  checkAuth();
}

function getAllSubmissions() {
  return JSON.parse(localStorage.getItem('homework_submissions') || '{}');
}

function saveAllSubmissions(data) {
  localStorage.setItem('homework_submissions', JSON.stringify(data));
}

function uploadHomework() {
  const fileInput = document.getElementById('homeworkFile');
  if (fileInput.files.length === 0) {
    alert('Выберите файл для загрузки!');
    return;
  }

  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = function(e) {
    const base64Data = e.target.result;
    const uploadTime = new Date().toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    const submissions = getAllSubmissions();
    if (!submissions[currentLoggedInStudent]) {
      submissions[currentLoggedInStudent] = [];
    }

    submissions[currentLoggedInStudent].push({
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      time: uploadTime,
      data: base64Data
    });

    saveAllSubmissions(submissions);
    fileInput.value = '';
    renderStudentFiles();
    alert('Работа успешно загружена!');
  };

  reader.readAsDataURL(file);
}

function renderStudentFiles() {
  const container = document.getElementById('studentFilesList');
  const submissions = getAllSubmissions();
  const myFiles = submissions[currentLoggedInStudent] || [];

  if (myFiles.length === 0) {
    container.innerHTML = '<div style="font-size: 0.7rem; color: var(--text-muted);">Вы еще не загрузили ни одной работы.</div>';
    return;
  }

  container.innerHTML = myFiles.map((file, index) => `
    <div class="student-row-card">
      <div>
        <div style="font-weight: bold; color: var(--text-main);">${file.name}</div>
        <div style="font-size: 0.65rem; color: var(--text-sub);">Загружено: ${file.time} (${file.size})</div>
      </div>
      <div style="display: flex; gap: 6px;">
        <a href="${file.data}" download="${file.name}" class="semester-btn" style="padding: 4px 8px; text-decoration:none;">СКАЧАТЬ</a>
        <button class="semester-btn" style="padding: 4px 8px; color: var(--nothing-red); border-color: var(--nothing-red);" onclick="deleteStudentFile(${index})">УДАЛИТЬ</button>
      </div>
    </div>
  `).join('');
}

function deleteStudentFile(index) {
  if (!confirm('Точно удалить этот файл?')) return;
  const submissions = getAllSubmissions();
  if (submissions[currentLoggedInStudent]) {
    submissions[currentLoggedInStudent].splice(index, 1);
    saveAllSubmissions(submissions);
    renderStudentFiles();
  }
}

function renderTeacherList() {
  const container = document.getElementById('teacherStudentsList');
  const submissions = getAllSubmissions();

  container.innerHTML = studentsList.map((studentName, idx) => {
    const studentFiles = submissions[studentName] || [];
    const hasFiles = studentFiles.length > 0;

    let filesHtml = '';
    if (hasFiles) {
      filesHtml = studentFiles.map((f, fIdx) => `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; padding-top: 6px; border-top: 1px dashed var(--border-color);">
          <span style="font-size: 0.7rem; color: var(--text-main);">${f.name} <i style="color:var(--text-muted)">(${f.time})</i></span>
          <div style="display: flex; gap: 4px;">
            <button class="semester-btn" style="padding: 2px 6px; font-size: 0.6rem;" onclick="previewFile('${studentName}', ${fIdx})">ПРОСМОТР</button>
            <a href="${f.data}" download="${f.name}" class="semester-btn" style="padding: 2px 6px; font-size: 0.6rem; text-decoration:none;">СКАЧАТЬ</a>
            <button class="semester-btn" style="padding: 2px 6px; font-size: 0.6rem; color:var(--nothing-red);" onclick="teacherDeleteFile('${studentName}', ${fIdx})">УДАЛИТЬ</button>
          </div>
        </div>
      `).join('');
    } else {
      filesHtml = `<div style="font-size: 0.65rem; color: var(--text-muted); margin-top: 4px;">Работ нет</div>`;
    }

    return `
      <div class="student-row-card" style="flex-direction: column; align-items: stretch;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: bold; font-size: 0.75rem;">${idx + 1}. ${studentName}</span>
          <span style="font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; background: ${hasFiles ? 'rgba(46, 204, 113, 0.2); color: #2ecc71;' : 'rgba(215, 25, 33, 0.2); color: var(--nothing-red);'}">
            ${hasFiles ? 'Сдал (' + studentFiles.length + ')' : 'Нет'}
          </span>
        </div>
        ${filesHtml}
      </div>
    `;
  }).join('');
}

function previewFile(studentName, fileIndex) {
  const submissions = getAllSubmissions();
  const file = submissions[studentName][fileIndex];
  const modal = document.getElementById('previewModal');
  const title = document.getElementById('previewModalTitle');
  const content = document.getElementById('previewContent');

  title.textContent = `${studentName} — ${file.name}`;
  
  if (file.name.match(/\.(txt|html|js|css|json|md)$/i)) {
    try {
      const base64Content = file.data.split(',')[1];
      const decodedText = atob(base64Content);
      content.innerHTML = `<pre style="white-space: pre-wrap; font-family: monospace;">${escapeHtml(decodedText)}</pre>`;
    } catch (e) {
      content.innerHTML = `<p>Не удалось отобразить текст. Скачайте файл.</p>`;
    }
  } else if (file.name.match(/\.(png|jpg|jpeg|gif|svg)$/i)) {
    content.innerHTML = `<div style="text-align: center;"><img src="${file.data}" style="max-width: 100%; max-height: 300px; border-radius: 6px;"></div>`;
  } else {
    content.innerHTML = `<p style="text-align: center; padding: 20px;">Предпросмотр для данного формата недоступен. Пожалуйста, скачайте файл.</p>`;
  }

  modal.classList.add('active');
}

function closePreview() {
  document.getElementById('previewModal').classList.remove('active');
}

function teacherDeleteFile(studentName, fileIndex) {
  if (!confirm(`Удалить работу студента ${studentName}?`)) return;
  const submissions = getAllSubmissions();
  if (submissions[studentName]) {
    submissions[studentName].splice(fileIndex, 1);
    saveAllSubmissions(submissions);
    renderTeacherList();
  }
}

function resetAllData() {
  if (confirm('Сбросить все загруженные работы и пользовательские пароли студентов?')) {
    localStorage.removeItem('homework_submissions');
    localStorage.removeItem('student_passwords');
    location.reload();
  }
}

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}