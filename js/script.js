// script.js - Working AI Chat with NVIDIA Nemotron via OpenRouter
(function() {
  const mainContent = document.getElementById('mainContent');
  const sidebarNavItems = document.querySelectorAll('.nav-item');
  const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
  const darkToggle = document.getElementById('darkModeToggle');
  const chatgptFloatBtn = document.getElementById('chatgptFloatBtn');
  const chatOverlay = document.getElementById('chatOverlay');
  const closeChat = document.getElementById('closeChat');
  const minimizeChat = document.getElementById('minimizeChat');
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const sendChatBtn = document.getElementById('sendChatBtn');

  let currentPage = 'home';
  let highSchoolClass = null;
  let universityDept = null;
  let isChatOpen = false;

  const OPENROUTER_API_KEY = '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';
  const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
  const MODEL_NAME = 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free';
  const SITE_URL = window.location.origin || 'http://localhost';
  const SITE_NAME = 'Edflix Learning Platform';

  // Google Drive Video IDs
  const HIGH_SCHOOL_DRIVE_ID = '1aHUAJ2dydw4jFyiYhlgT5jTcs8nFjoTV';
  const UNIVERSITY_DRIVE_ID = '1nfLvRnECX2mvu8YfSYh_qtyyn2H3YdJn';

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  window.copyCode = function(button) {
    const pre = button.parentElement;
    const code = pre.getAttribute('data-code');
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      button.innerHTML = '<i class="fas fa-check"></i> Copied!';
      button.classList.add('copied');
      setTimeout(() => {
        button.innerHTML = '<i class="fas fa-copy"></i> Copy';
        button.classList.remove('copied');
      }, 2000);
    });
  };

  function setActiveNav(page) {
    sidebarNavItems.forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-page') === page);
    });
    mobileNavItems.forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-page') === page);
    });
  }

  function addAIToSidebar() {
    const navMenu = document.getElementById('navMenu');
    if (!navMenu || document.querySelector('.ai-nav-item')) return;
    const aiNavItem = document.createElement('div');
    aiNavItem.className = 'ai-nav-item';
    aiNavItem.innerHTML = `<li class="nav-item" id="aiSidebarBtn"><div class="nav-icon-wrapper"><i class="fas fa-robot"></i></div><span>AI Assistant</span><div class="active-indicator"></div></li>`;
    navMenu.appendChild(aiNavItem);
    document.getElementById('aiSidebarBtn').addEventListener('click', openChatWindow);
  }

  function openChatWindow() {
    chatOverlay.classList.add('active');
    isChatOpen = true;
    document.body.style.overflow = 'hidden';
    setTimeout(() => chatInput?.focus(), 300);
  }

  function closeChatWindow() {
    chatOverlay.classList.remove('active');
    isChatOpen = false;
    document.body.style.overflow = '';
  }

  function addChatMessage(text, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
    let processedText = text
      .replace(/```(\w+)?\s*\n([\s\S]*?)```/g, (match, lang, code) => {
        const escapedCode = escapeHtml(code.trim());
        return `<pre data-code="${escapedCode.replace(/"/g, '&quot;')}"><button class="copy-btn" onclick="window.copyCode(this)"><i class="fas fa-copy"></i> Copy</button><code>${escapedCode}</code></pre>`;
      })
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
    messageDiv.innerHTML = `<div class="message-avatar"><i class="fas ${isUser ? 'fa-user' : 'fa-robot'}"></i></div><div class="message-content">${processedText}</div>`;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `<div class="message-avatar"><i class="fas fa-robot"></i></div><div class="message-content"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>`;
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function removeTypingIndicator() {
    document.getElementById('typingIndicator')?.remove();
  }

  async function getAIResponse(message) {
    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': SITE_URL,
          'X-Title': SITE_NAME,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model: MODEL_NAME, messages: [{ role: 'user', content: message }] })
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data.choices?.[0]?.message?.content || null;
    } catch (error) {
      return null;
    }
  }

  function getFallbackResponse(message) {
    const msg = message.toLowerCase().trim();
    if (msg.match(/^(hi|hello|hey)/)) return "Hello! 👋 How can I help you learn today?";
    if (msg.match(/code|program|java|python/)) return "```java\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello!\");\n    }\n}\n```\n\nAsk me anything about coding!";
    return `I'd be happy to help you with "${message}". What specific part would you like me to explain?`;
  }

  async function handleSendMessage() {
    const message = chatInput.value.trim();
    if (!message || !sendChatBtn) return;
    sendChatBtn.disabled = true;
    addChatMessage(message, true);
    chatInput.value = '';
    showTypingIndicator();
    let response = await getAIResponse(message);
    if (!response) response = getFallbackResponse(message);
    setTimeout(() => {
      removeTypingIndicator();
      addChatMessage(response, false);
      sendChatBtn.disabled = false;
      chatInput.focus();
    }, 500);
  }

  chatgptFloatBtn?.addEventListener('click', openChatWindow);
  closeChat?.addEventListener('click', closeChatWindow);
  minimizeChat?.addEventListener('click', closeChatWindow);
  chatOverlay?.addEventListener('click', (e) => { if (e.target === chatOverlay) closeChatWindow(); });
  sendChatBtn?.addEventListener('click', handleSendMessage);
  chatInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); handleSendMessage(); } });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isChatOpen) closeChatWindow(); });

  function showDriveVideo(driveId, title) {
    const pageContent = document.querySelector('.page.active-page');
    if (!pageContent) return;
    
    pageContent.innerHTML = `
      <div class="youtube-embed-container">
        <div class="youtube-header">
          <h3><i class="fas fa-play-circle"></i> ${title} - Video Lectures</h3>
          <button class="back-btn back-to-subjects"><i class="fas fa-arrow-left"></i> Back</button>
        </div>
        <div class="video-wrapper">
          <iframe src="https://drive.google.com/file/d/${driveId}/preview" width="560" height="315" allow="autoplay" allowfullscreen></iframe>
        </div>
        <div class="playlist-info">
          <p><i class="fas fa-info-circle"></i> Video lectures for ${title}</p>
          <a href="https://drive.google.com/file/d/${driveId}/view" target="_blank" class="youtube-link"><i class="fas fa-external-link-alt"></i> Open in Google Drive</a>
        </div>
      </div>`;
    
    pageContent.querySelector('.back-to-subjects')?.addEventListener('click', () => renderPage());
  }

  function renderPage() {
    if (!mainContent) return;
    let html = '';
    
    if (currentPage === 'home') {
      html = `<div class="page active-page">
        <div class="page-header"><h1 class="page-title">Welcome back! 👋</h1><p class="page-subtitle">Continue your learning journey</p></div>
        <div class="card-grid">
          <div class="card" data-navigate="highschool"><div class="card-icon"><i class="fas fa-school"></i></div><div class="card-title">High School</div><div class="card-subtitle">Classes 6-12</div></div>
          <div class="card" data-navigate="university"><div class="card-icon"><i class="fas fa-university"></i></div><div class="card-title">University</div><div class="card-subtitle">All Departments</div></div>
          <div class="card" data-navigate="videos"><div class="card-icon"><i class="fas fa-play-circle"></i></div><div class="card-title">Video Lectures</div><div class="card-subtitle">Learn visually</div></div>
          <div class="card" data-navigate="materials"><div class="card-icon"><i class="fas fa-book-open"></i></div><div class="card-title">Study Materials</div><div class="card-subtitle">Notes & PDFs</div></div>
        </div></div>`;
    }
    else if (currentPage === 'highschool') {
      if (!highSchoolClass) {
        html = `<div class="page active-page">
          <div class="page-header"><h1 class="page-title">High School</h1><p class="page-subtitle">Select your class</p></div>
          <div class="card-grid">${[6,7,8,9,10,11,12].map(c => `<div class="card" data-class="${c}"><div class="card-icon"><i class="fas fa-graduation-cap"></i></div><div class="card-title">Class ${c}</div></div>`).join('')}</div></div>`;
      } else {
        const subjects = highSchoolClass <= 8 ? ['Math','Science','English','Social Studies','Hindi'] : highSchoolClass <= 10 ? ['Math','Science','English','Social Science','IT'] : ['Physics','Chemistry','Math','English','Computer Science'];
        html = `<div class="page active-page">
          <button class="back-btn" id="backFromClass"><i class="fas fa-arrow-left"></i> Back</button>
          <div class="page-header"><h1 class="page-title">Class ${highSchoolClass}</h1></div>
          <div class="subject-list">${subjects.map(s => `<div class="subject-chip video-subject" data-subject="${s}" data-drive="${HIGH_SCHOOL_DRIVE_ID}"><i class="fas fa-play-circle" style="color:#6366f1"></i> ${s}</div>`).join('')}</div></div>`;
      }
    }
    else if (currentPage === 'university') {
      if (!universityDept) {
        html = `<div class="page active-page">
          <div class="page-header"><h1 class="page-title">University</h1><p class="page-subtitle">Choose department</p></div>
          <div class="card-grid">
            <div class="card" data-dept="science"><div class="card-icon"><i class="fas fa-flask"></i></div><div class="card-title">Science</div></div>
            <div class="card" data-dept="commerce"><div class="card-icon"><i class="fas fa-chart-bar"></i></div><div class="card-title">Commerce</div></div>
            <div class="card" data-dept="arts"><div class="card-icon"><i class="fas fa-paint-brush"></i></div><div class="card-title">Arts</div></div>
            <div class="card" data-dept="engineering"><div class="card-icon"><i class="fas fa-cogs"></i></div><div class="card-title">Engineering</div></div>
          </div></div>`;
      } else {
        const depts = {science:['Physics','Chemistry','Math','Biology'],commerce:['Accounts','Business','Economics','Stats'],arts:['History','Politics','Sociology','Psychology'],engineering:['CS','Mechanical','Electrical','Civil']};
        html = `<div class="page active-page">
          <button class="back-btn" id="backFromDept"><i class="fas fa-arrow-left"></i> Back</button>
          <div class="page-header"><h1 class="page-title">${universityDept.charAt(0).toUpperCase()+universityDept.slice(1)}</h1></div>
          <div class="subject-list">${(depts[universityDept]||[]).map(s => `<div class="subject-chip video-subject" data-subject="${s}" data-drive="${UNIVERSITY_DRIVE_ID}"><i class="fas fa-play-circle" style="color:#6366f1"></i> ${s}</div>`).join('')}</div></div>`;
      }
    }
    else if (currentPage === 'videos') {
      html = `<div class="page active-page"><div class="page-header"><h1 class="page-title">Video Lectures</h1></div>
        <div class="card-grid">
          <div class="card video-card" data-subject="High School Videos" data-drive="${HIGH_SCHOOL_DRIVE_ID}"><div class="card-icon"><i class="fas fa-play-circle"></i></div><div class="card-title">High School</div><div class="card-subtitle">All Subjects</div></div>
          <div class="card video-card" data-subject="University Videos" data-drive="${UNIVERSITY_DRIVE_ID}"><div class="card-icon"><i class="fas fa-play-circle"></i></div><div class="card-title">University</div><div class="card-subtitle">All Departments</div></div>
        </div></div>`;
    }
    else if (currentPage === 'materials') {
      html = `<div class="page active-page"><div class="page-header"><h1 class="page-title">Study Materials</h1></div>
        <div class="card-grid">
          <div class="card"><div class="card-icon"><i class="fas fa-file-pdf"></i></div><div class="card-title">Math Notes</div></div>
          <div class="card"><div class="card-icon"><i class="fas fa-file-pdf"></i></div><div class="card-title">Physics Formulas</div></div>
          <div class="card"><div class="card-icon"><i class="fas fa-file-pdf"></i></div><div class="card-title">CS E-Book</div></div>
        </div></div>`;
    }
    mainContent.innerHTML = html;
    attachListeners();
    mainContent.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function attachListeners() {
    document.querySelectorAll('[data-navigate]').forEach(c => c.addEventListener('click', e => navigateTo(c.getAttribute('data-navigate'))));
    document.querySelectorAll('[data-class]').forEach(c => c.addEventListener('click', e => { highSchoolClass = c.getAttribute('data-class'); renderPage(); }));
    document.getElementById('backFromClass')?.addEventListener('click', () => { highSchoolClass = null; renderPage(); });
    document.querySelectorAll('[data-dept]').forEach(c => c.addEventListener('click', e => { universityDept = c.getAttribute('data-dept'); renderPage(); }));
    document.getElementById('backFromDept')?.addEventListener('click', () => { universityDept = null; renderPage(); });
    document.querySelectorAll('.video-subject, .video-card').forEach(el => el.addEventListener('click', function() { 
      showDriveVideo(this.getAttribute('data-drive'), this.getAttribute('data-subject')); 
    }));
  }

  function navigateTo(page) {
    if (currentPage !== page) { highSchoolClass = null; universityDept = null; }
    currentPage = page;
    setActiveNav(page);
    renderPage();
  }

  sidebarNavItems.forEach(i => i.addEventListener('click', e => navigateTo(i.getAttribute('data-page'))));
  mobileNavItems.forEach(i => i.addEventListener('click', e => navigateTo(i.getAttribute('data-page'))));

  function initDarkMode() {
    if (localStorage.getItem('edflixDarkMode') === 'true') document.body.classList.add('dark');
    darkToggle.addEventListener('click', () => {
      const isDark = document.body.classList.toggle('dark');
      localStorage.setItem('edflixDarkMode', isDark);
      darkToggle.querySelector('i').className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    });
  }

  initDarkMode();
  addAIToSidebar();
  navigateTo('home');
})();
