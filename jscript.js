/* ==========================================================================
   IKUKA 個人介紹網站 — jscript.js
   負責處理：深淺色主題切換、GitHub 學習里程碑互動、模擬 Git 終端機、專案彈窗與留言板
   ========================================================================== */

(function () {
  // 預設 GitHub 學習里程碑資料
  const defaultMilestones = [
    { id: 'm1', title: '註冊 GitHub 帳號並建立個人 Profile 介紹', category: '基礎設定', completed: true },
    { id: 'm2', title: '熟悉本地端版本控制：git init、git add 與 git commit', category: '核心指令', completed: true },
    { id: 'm3', title: '連結遠端儲存庫：git remote add origin 與 git push', category: '遠端同步', completed: true },
    { id: 'm4', title: '學習分支開發與合併：git branch、git switch -c 與 git merge', category: '分支管理', completed: false },
    { id: 'm5', title: '練習開源協作流程：Fork、Pull Request (PR) 與 Issue 追蹤', category: '開源協作', completed: false },
    { id: 'm6', title: '透過 GitHub Pages 部署 IKUKA 個人網站 (index.html / style.css / jscript.js)', category: '網站部署', completed: false }
  ];

  // 預設 Git 指令速查清單
  const gitCommands = [
    { cmd: 'git init', desc: '在當前資料夾初始化全新的 Git 本地儲存庫' },
    { cmd: 'git status', desc: '查看目前工作目錄與暫存區 (Staging Area) 的檔案變更狀態' },
    { cmd: 'git add .', desc: '將所有修改與新增的檔案加入暫存區準備提交' },
    { cmd: 'git commit -m "feat: 新增個人介紹頁面"', desc: '建立版本紀錄快照並附上清楚的提交說明' },
    { cmd: 'git branch -M main', desc: '將主分支名稱設定為 main' },
    { cmd: 'git push -u origin main', desc: '將本地端 main 分支推送至 GitHub 遠端儲存庫' }
  ];

  // 專案詳情資料
  const projectDetails = {
    portfolio: {
      title: 'IKUKA 個人介紹網站 (HTML / CSS / JS)',
      tech: 'HTML5 · CSS3 · Vanilla JavaScript · GitHub Pages',
      body: '這是我的第一個完整個人品牌網站，採用語意化 HTML 架構、自訂深淺色主題變數與無框架原生 JavaScript 打造，可直接上傳至 GitHub 儲存庫並透過 Settings > Pages 一鍵發布上線。'
    },
    notes: {
      title: 'Git & GitHub 實戰學習筆記庫',
      tech: 'Markdown · Git CLI · 版本控制流程',
      body: '整理我從零開始學習 Git 的常見問題與解決方案，包含如何撰寫語意化 Commit Message、如何使用 .gitignore 忽略不必要檔案，以及遇到合併衝突 (Merge Conflict) 時的排解步驟。'
    },
    deploy: {
      title: 'GitHub Pages 靜態網站自動部署練習',
      tech: 'GitHub Pages · 分支管理 · Web Hosting',
      body: '練習將 index.html、style.css 與 jscript.js 三個核心檔案推送到 username.github.io 儲存庫，驗證跨裝置響應式排版與瀏覽器相容性。'
    }
  };

  // 狀態變數
  let milestones = [...defaultMilestones];
  let currentFilter = 'all';
  let commitCount = 28;

  // Toast 訊息提示
  function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    if (window._toastTimer) clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2600);
  }

  // 複製文字工具 (支援 Canvas iframe fallback)
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('已複製指令：' + text);
      }).catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showToast('已複製指令：' + text);
    } catch (e) {
      showToast('請手動選取複製：' + text);
    }
    document.body.removeChild(textarea);
  }

  // 1. 深淺色主題切換
  function initTheme() {
    const themeBtn = document.getElementById('theme-toggle');
    if (!themeBtn) return;
    let savedTheme = 'dark';
    try {
      savedTheme = localStorage.getItem('ikuka_theme') || 'dark';
    } catch (e) {
      savedTheme = 'dark';
    }
    applyTheme(savedTheme);

    themeBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      const next = current === 'light' ? 'dark' : 'light';
      applyTheme(next);
      try {
        localStorage.setItem('ikuka_theme', next);
      } catch (e) {}
      showToast(next === 'light' ? '已切換為淺色主題 ☀️' : '已切換為 GitHub 深色主題 🌙');
    });
  }

  function applyTheme(theme) {
    const themeBtn = document.getElementById('theme-toggle');
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      if (themeBtn) themeBtn.textContent = '🌙 切換深色';
    } else {
      document.documentElement.removeAttribute('data-theme');
      if (themeBtn) themeBtn.textContent = '☀️ 切換淺色';
    }
  }

  // 2. GitHub 貢獻綠色方格產生器
  function initContribGrid() {
    const grid = document.getElementById('contrib-grid');
    const statCommits = document.getElementById('stat-commits');
    if (!grid) return;

    const levels = [1, 2, 3, 2, 4, 1, 3, 4, 2, 3, 4, 2, 1, 3, 2, 4, 3, 4, 2, 1, 3, 4, 3, 4];
    grid.innerHTML = '';
    levels.forEach((lvl, idx) => {
      const cell = document.createElement('div');
      cell.className = 'contrib-cell';
      cell.setAttribute('data-level', String(lvl));
      cell.title = '第 ' + (idx + 1) + ' 天學習紀錄 (點擊增加一次練習 Commit)';
      cell.addEventListener('click', () => {
        const nextLvl = (parseInt(cell.getAttribute('data-level') || '1', 10) % 4) + 1;
        cell.setAttribute('data-level', String(nextLvl));
        commitCount += 1;
        if (statCommits) statCommits.textContent = String(commitCount);
        showToast('🎉 新增 1 次 GitHub 學習紀錄！累計 ' + commitCount + ' 次 Commits');
      });
      grid.appendChild(cell);
    });
  }

  // 3. 渲染 GitHub 學習里程碑與進度條
  function renderMilestones() {
    const listEl = document.getElementById('milestone-list');
    const progressFill = document.getElementById('progress-bar-fill');
    const progressText = document.getElementById('progress-summary');
    const statProgress = document.getElementById('stat-progress');
    if (!listEl) return;

    const total = milestones.length;
    const doneCount = milestones.filter(m => m.completed).length;
    const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

    if (progressFill) progressFill.style.width = pct + '%';
    if (progressText) progressText.textContent = '已完成 ' + doneCount + ' / ' + total + ' 項目標 (' + pct + '%)';
    if (statProgress) statProgress.textContent = pct + '%';

    const filtered = milestones.filter(m => {
      if (currentFilter === 'done') return m.completed;
      if (currentFilter === 'todo') return !m.completed;
      return true;
    });

    listEl.innerHTML = '';
    filtered.forEach(item => {
      const row = document.createElement('div');
      row.className = 'milestone-item' + (item.completed ? ' completed' : '');
      row.innerHTML =
        '<div class="milestone-left">' +
          '<div class="check-circle">' + (item.completed ? '✓' : '') + '</div>' +
          '<div>' +
            '<div class="milestone-title">' + escapeHtml(item.title) + '</div>' +
          '</div>' +
        '</div>' +
        '<span class="milestone-badge ' + (item.completed ? 'badge-done' : 'badge-todo') + '">' +
          (item.completed ? '已完成' : escapeHtml(item.category)) +
        '</span>';

      row.addEventListener('click', () => {
        item.completed = !item.completed;
        renderMilestones();
        showToast(item.completed ? '✅ 已標記完成：' + item.title : '🔄 已改回學習中：' + item.title);
      });
      listEl.appendChild(row);
    });
  }

  function initMilestoneControls() {
    const filterBtns = document.querySelectorAll('.filter-tab-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.getAttribute('data-filter') || 'all';
        renderMilestones();
      });
    });

    const addBtn = document.getElementById('add-goal-btn');
    const inputEl = document.getElementById('new-goal-input');
    if (addBtn && inputEl) {
      const handleAdd = () => {
        const val = inputEl.value.trim();
        if (!val) {
          showToast('請先輸入想新增的 GitHub 學習目標！');
          return;
        }
        milestones.push({
          id: 'm_' + Date.now(),
          title: val,
          category: '自訂目標',
          completed: false
        });
        inputEl.value = '';
        renderMilestones();
        showToast('✨ 已新增學習目標：' + val);
      };
      addBtn.addEventListener('click', handleAdd);
      inputEl.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAdd();
        }
      });
    }
  }

  // 4. Git 指令速查與互動式終端機
  function initPlayground() {
    const cmdListEl = document.getElementById('cmd-list');
    if (cmdListEl) {
      cmdListEl.innerHTML = '';
      gitCommands.forEach(item => {
        const card = document.createElement('div');
        card.className = 'cmd-card';
        card.innerHTML =
          '<div>' +
            '<code class="cmd-code">$ ' + escapeHtml(item.cmd) + '</code>' +
            '<span class="cmd-desc">' + escapeHtml(item.desc) + '</span>' +
          '</div>' +
          '<div class="cmd-actions">' +
            '<button type="button" class="mini-btn copy-cmd-btn">複製</button>' +
            '<button type="button" class="mini-btn run-cmd-btn">執行</button>' +
          '</div>';

        const copyBtn = card.querySelector('.copy-cmd-btn');
        const runBtn = card.querySelector('.run-cmd-btn');
        if (copyBtn) copyBtn.addEventListener('click', () => copyText(item.cmd));
        if (runBtn) runBtn.addEventListener('click', () => executeTerminalCommand(item.cmd));
        cmdListEl.appendChild(card);
      });
    }

    const termInput = document.getElementById('terminal-input');
    const termRunBtn = document.getElementById('terminal-run-btn');
    const termClearBtn = document.getElementById('terminal-clear-btn');

    if (termRunBtn && termInput) {
      const triggerRun = () => {
        const raw = termInput.value.trim();
        if (!raw) return;
        executeTerminalCommand(raw);
        termInput.value = '';
      };
      termRunBtn.addEventListener('click', triggerRun);
      termInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          triggerRun();
        }
      });
    }

    if (termClearBtn) {
      termClearBtn.addEventListener('click', () => {
        const out = document.getElementById('terminal-output');
        if (out) out.innerHTML = '';
        appendTerminalLine('system', '終端機畫面已清除。輸入 help 查看可用指令。');
      });
    }
  }

  function executeTerminalCommand(rawCmd) {
    const cmd = rawCmd.trim();
    appendTerminalLine('user', cmd);

    const lower = cmd.toLowerCase();
    let response = '';

    if (lower === 'help') {
      response = '可用指令：git init | git status | git add . | git commit -m "..." | git branch | git push | whoami | clear';
    } else if (lower === 'whoami') {
      response = 'IKUKA — 正在積極學習 Git 與 GitHub 的網頁開發者 🚀';
    } else if (lower === 'clear') {
      const out = document.getElementById('terminal-output');
      if (out) out.innerHTML = '';
      return;
    } else if (lower.startsWith('git init')) {
      response = 'Initialized empty Git repository in /Users/ikuka/portfolio/.git/';
    } else if (lower.startsWith('git status')) {
      response = 'On branch main\nChanges to be committed:\n  modified:   index.html\n  modified:   style.css\n  modified:   jscript.js';
    } else if (lower.startsWith('git add')) {
      response = '已將 index.html, style.css, jscript.js 加入暫存區 (Staging Area)。';
    } else if (lower.startsWith('git commit')) {
      commitCount += 1;
      const statCommits = document.getElementById('stat-commits');
      if (statCommits) statCommits.textContent = String(commitCount);
      response = '[main 8f4a2c1] ' + cmd + '\n 3 files changed, 420 insertions(+)\n🎉 成功建立一個新的 Commit！';
    } else if (lower.startsWith('git branch')) {
      response = '* main\n  feature/github-learning';
    } else if (lower.startsWith('git push')) {
      response = 'Enumerating objects: 5, done.\nWriting objects: 100% (5/5), 4.82 KiB | 4.82 MiB/s, done.\nTo https://github.com/ikuka/ikuka.github.io.git\n   3a1b9e0..8f4a2c1  main -> main\n🚀 網站已成功推送至 GitHub 遠端儲存庫！';
    } else {
      response = '已模擬執行指令：' + cmd + ' (輸入 help 可查看所有支援的 Git 練習指令)';
    }

    appendTerminalLine('output', response);
  }

  function appendTerminalLine(type, text) {
    const out = document.getElementById('terminal-output');
    if (!out) return;
    const line = document.createElement('div');
    line.className = 'term-line';
    if (type === 'user') {
      line.innerHTML = '<span class="term-prompt">ikuka@github-learn:~/site$</span> ' + escapeHtml(text);
    } else {
      line.innerHTML = '<div class="term-output">' + escapeHtml(text) + '</div>';
    }
    out.appendChild(line);
    out.scrollTop = out.scrollHeight;
  }

  // 5. 專案彈窗互動
  function initProjectModals() {
    const modal = document.getElementById('project-modal');
    const titleEl = document.getElementById('modal-title');
    const techEl = document.getElementById('modal-tech');
    const bodyEl = document.getElementById('modal-body');
    const closeBtn = document.getElementById('modal-close-btn');

    document.querySelectorAll('.open-project-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-project') || 'portfolio';
        const info = projectDetails[key] || projectDetails.portfolio;
        if (titleEl) titleEl.textContent = info.title;
        if (techEl) techEl.textContent = info.tech;
        if (bodyEl) bodyEl.textContent = info.body;
        if (modal) modal.classList.add('open');
      });
    });

    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => modal.classList.remove('open'));
      modal.addEventListener('click', e => {
        if (e.target === modal) modal.classList.remove('open');
      });
    }
  }

  // 6. 鼓勵留言板互動
  function initGuestbook() {
    const form = document.getElementById('guestbook-form');
    const nameInput = document.getElementById('visitor-name');
    const msgInput = document.getElementById('visitor-message');
    const list = document.getElementById('guestbook-list');

    if (!form || !list) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const name = (nameInput && nameInput.value.trim()) || 'GitHub 夥伴';
      const msg = (msgInput && msgInput.value.trim()) || '';
      if (!msg) {
        showToast('請輸入給 IKUKA 的留言或鼓勵內容！');
        return;
      }
      const card = document.createElement('div');
      card.className = 'guest-card';
      card.innerHTML =
        '<div class="guest-card-header">' +
          '<span class="guest-author">@' + escapeHtml(name) + '</span>' +
          '<span style="color: var(--text-secondary);">剛剛</span>' +
        '</div>' +
        '<p style="font-size: 0.92rem;">' + escapeHtml(msg) + '</p>';
      list.prepend(card);
      if (nameInput) nameInput.value = '';
      if (msgInput) msgInput.value = '';
      showToast('💬 感謝你的留言！已新增至留言板');
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // 初始化所有模組
  function initAll() {
    initTheme();
    initContribGrid();
    renderMilestones();
    initMilestoneControls();
    initPlayground();
    initProjectModals();
    initGuestbook();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
