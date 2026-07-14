
// --- macOS Chime Sound Chord Synthesizer ---
let audioCtx = null;

function playBootChime() {
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;
    
    // Cozy macOS-style G major chord arpeggio
    const frequencies = [196.00, 293.66, 392.00, 493.88, 587.33];
    frequencies.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);
      
      gainNode.gain.setValueAtTime(0.08, now + idx * 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.start(now + idx * 0.05);
      osc.stop(now + 1.8);
    });
  } catch (e) {
    console.warn("Audio Context boot block:", e);
  }
}


// --- macOS Boot screen sequence ---
const bootScreen = document.getElementById('boot-screen');
const bootBar = document.getElementById('boot-bar');

let bootProgress = 0;
function runBootLoader() {
  bootProgress += Math.random() * 2.8 + 0.6;
  if (bootProgress >= 100) {
    bootProgress = 100;
    bootBar.style.width = '100%';
    
    setTimeout(() => {
      playBootChime();
      bootScreen.classList.add('loaded');
    }, 450);
  } else {
    bootBar.style.width = `${bootProgress}%`;
    setTimeout(runBootLoader, Math.random() * 40 + 10);
  }
}
runBootLoader();


// --- 3D Cards Tilt & Dynamic Shadow Tracker ---
const tiltElements = document.querySelectorAll('.skill-category-card, .bits-win-card, .project-experience-card');
tiltElements.forEach(el => {
  el.addEventListener('mousemove', (e) => {
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    el.style.setProperty('--mouse-x', `${x}px`);
    el.style.setProperty('--mouse-y', `${y}px`);
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const offsetX = (x - centerX) / centerX;
    const offsetY = (y - centerY) / centerY;
    
    const rotX = -offsetY * 8;
    const rotY = offsetX * 8;
    
    el.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.015, 1.015, 1.015)`;
  });
  
  el.addEventListener('mouseleave', () => {
    el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  });
});


// --- macOS Desktop Window Manager Logic ---
const windows = document.querySelectorAll('.mac-window');
const desktopIcons = document.querySelectorAll('.desktop-icon');
const dockItems = document.querySelectorAll('.mac-dock .dock-item');
const activeAppLabel = document.getElementById('menu-active-app');
const desktopContainer = document.getElementById('desktop');

let topZIndex = 100;
const originalBounds = new Map();

function focusWindow(win) {
  windows.forEach(w => w.classList.remove('focused'));
  win.classList.add('focused');
  topZIndex += 1;
  win.style.zIndex = topZIndex;
  
  const title = win.querySelector('.mac-window-title');
  if (title && activeAppLabel) {
    activeAppLabel.textContent = title.textContent;
  }
  
  const winId = win.id;
  dockItems.forEach(item => {
    if (item.getAttribute('data-window') === winId) {
      item.classList.add('active');
    }
  });
}

function openWindow(win) {
  win.classList.add('open');
  win.classList.remove('minimized');
  focusWindow(win);
}

function closeWindow(win) {
  win.classList.remove('open');
  win.classList.remove('focused');
  win.classList.remove('minimized');
  
  const winId = win.id;
  dockItems.forEach(item => {
    if (item.getAttribute('data-window') === winId) {
      item.classList.remove('active');
    }
  });
  
  if (activeAppLabel) activeAppLabel.textContent = 'Finder';
}

function minimizeWindow(win) {
  win.classList.add('minimized');
  win.classList.remove('focused');
}

function toggleMaximize(win) {
  if (win.classList.contains('maximized')) {
    win.classList.remove('maximized');
    const bounds = originalBounds.get(win.id);
    if (bounds) {
      win.style.width = bounds.w;
      win.style.height = bounds.h;
      win.style.top = bounds.t;
      win.style.left = bounds.l;
    }
  } else {
    originalBounds.set(win.id, {
      w: win.style.width || win.getBoundingClientRect().width + 'px',
      h: win.style.height || win.getBoundingClientRect().height + 'px',
      t: win.style.top || win.offsetTop + 'px',
      l: win.style.left || win.offsetLeft + 'px'
    });
    
    win.classList.add('maximized');
    win.style.width = '100vw';
    win.style.height = 'calc(100vh - 28px)';
    win.style.top = '28px';
    win.style.left = '0';
  }
}

// Desktop click selection deselects everything
if (desktopContainer) {
  desktopContainer.addEventListener('click', (e) => {
    if (e.target.id === 'desktop' || e.target.classList.contains('desktop-grid')) {
      desktopIcons.forEach(icon => icon.classList.remove('selected'));
    }
  });
}

// Attach desktop icon click (Single-click selects, Double-click opens window)
desktopIcons.forEach(icon => {
  icon.addEventListener('click', (e) => {
    e.stopPropagation();
    desktopIcons.forEach(i => i.classList.remove('selected'));
    icon.classList.add('selected');
  });

  icon.addEventListener('dblclick', (e) => {
    e.stopPropagation();
    const winId = icon.getAttribute('data-window');
    const win = document.getElementById(winId);
    if (win) {
      openWindow(win);
    }
  });
  
  icon.addEventListener('touchend', (e) => {
    if (window.innerWidth < 968) {
      e.stopPropagation();
      const winId = icon.getAttribute('data-window');
      const win = document.getElementById(winId);
      if (win) {
        openWindow(win);
      }
    }
  });
});

// Attach dock app shortcuts
dockItems.forEach(item => {
  item.addEventListener('click', () => {
    const winId = item.getAttribute('data-window');
    if (!winId) return;
    const win = document.getElementById(winId);
    if (win) {
      if (win.classList.contains('open')) {
        if (win.classList.contains('minimized')) {
          openWindow(win);
        } else if (win.classList.contains('focused')) {
          minimizeWindow(win);
        } else {
          focusWindow(win);
        }
      } else {
        openWindow(win);
      }
    }
  });
});

// Window controls actions
windows.forEach(win => {
  const closeBtn = win.querySelector('.ctrl-btn.close');
  const minBtn = win.querySelector('.ctrl-btn.minimize');
  const maxBtn = win.querySelector('.ctrl-btn.maximize');
  
  if (closeBtn) {
    closeBtn.addEventListener('click', () => closeWindow(win));
  }
  if (minBtn) {
    minBtn.addEventListener('click', () => minimizeWindow(win));
  }
  if (maxBtn) {
    maxBtn.addEventListener('click', () => toggleMaximize(win));
  }
  
  win.addEventListener('pointerdown', () => focusWindow(win));
  makeDraggable(win);
  makeResizable(win);
});

function makeDraggable(win) {
  const header = win.querySelector('.mac-window-header');
  if (!header) return;
  
  let startX = 0, startY = 0;
  let startLeft = 0, startTop = 0;
  let isDragging = false;
  
  header.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.mac-window-controls')) return; // ignore controls
    if (win.classList.contains('maximized')) return;
    
    isDragging = true;
    focusWindow(win);
    
    startX = e.clientX;
    startY = e.clientY;
    
    // Extract actual offset values safely
    const rect = win.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;
    
    header.setPointerCapture(e.pointerId);
    
    header.addEventListener('pointermove', elementDrag);
    header.addEventListener('pointerup', closeDragElement);
    header.addEventListener('pointercancel', closeDragElement);
  });
  
  function elementDrag(e) {
    if (!isDragging) return;
    
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    
    const newTop = startTop + dy;
    const newLeft = startLeft + dx;
    
    // Bounds check to prevent sliding under menubar or off-screen bottom
    const minTop = 28; // height of menu bar
    const maxTop = window.innerHeight - 60;
    const constrainedTop = Math.max(minTop, Math.min(newTop, maxTop));
    
    win.style.top = constrainedTop + "px";
    win.style.left = newLeft + "px";
  }
  
  function closeDragElement(e) {
    if (!isDragging) return;
    isDragging = false;
    
    try {
      header.releasePointerCapture(e.pointerId);
    } catch(err) {}
    
    header.removeEventListener('pointermove', elementDrag);
    header.removeEventListener('pointerup', closeDragElement);
    header.removeEventListener('pointercancel', closeDragElement);
  }
}

// Window Dynamic Resizer
function makeResizable(win) {
  const handle = document.createElement('div');
  handle.className = 'win-resize-handle';
  win.appendChild(handle);
  
  handle.addEventListener('pointerdown', initResize);
  
  function initResize(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const startWidth = win.getBoundingClientRect().width;
    const startHeight = win.getBoundingClientRect().height;
    const startX = e.clientX;
    const startY = e.clientY;
    
    handle.setPointerCapture(e.pointerId);
    
    handle.addEventListener('pointermove', startResize);
    handle.addEventListener('pointerup', stopResize);
    handle.addEventListener('pointercancel', stopResize);
    
    function startResize(ev) {
      if (win.classList.contains('maximized')) return;
      
      const newWidth = startWidth + (ev.clientX - startX);
      const newHeight = startHeight + (ev.clientY - startY);
      
      if (newWidth > 320) win.style.width = newWidth + 'px';
      if (newHeight > 220) win.style.height = newHeight + 'px';
    }
    
    function stopResize(ev) {
      try {
        handle.releasePointerCapture(ev.pointerId);
      } catch(err) {}
      
      handle.removeEventListener('pointermove', startResize);
      handle.removeEventListener('pointerup', stopResize);
      handle.removeEventListener('pointercancel', stopResize);
    }
  }
}


// --- Finder Projects Directory Click Bindings ---
const finderItems = document.querySelectorAll('.finder-item');
finderItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.stopPropagation();
    const winId = item.getAttribute('data-window');
    const win = document.getElementById(winId);
    if (win) {
      openWindow(win);
      const projectsFinder = document.getElementById('win-projects-finder');
      if (projectsFinder) closeWindow(projectsFinder);
    }
  });
});


// --- EXOPLANET STARS CANVAS SYSTEM ---
const starsCanvas = document.getElementById('starsCanvas');
const starsCtx = starsCanvas.getContext('2d');
let stars = [];
let starsAnimationId = null;

function initStars() {
  starsCanvas.width = starsCanvas.offsetWidth;
  starsCanvas.height = starsCanvas.offsetHeight;
  stars = [];
  for (let i = 0; i < 40; i++) {
    stars.push({
      x: Math.random() * starsCanvas.width,
      y: Math.random() * starsCanvas.height,
      size: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.7 + 0.3,
      speed: Math.random() * 0.1 + 0.05
    });
  }
}

function drawStars() {
  starsCtx.clearRect(0, 0, starsCanvas.width, starsCanvas.height);
  stars.forEach(s => {
    s.y -= s.speed;
    if (s.y < 0) s.y = starsCanvas.height;
    
    starsCtx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
    starsCtx.beginPath();
    starsCtx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    starsCtx.fill();
  });
  starsAnimationId = requestAnimationFrame(drawStars);
}

const exoplanetWindow = document.getElementById('win-exoplanet');
if (exoplanetWindow) {
  exoplanetWindow.addEventListener('mouseenter', () => {
    initStars();
    drawStars();
  });
  exoplanetWindow.addEventListener('mouseleave', () => {
    if (starsAnimationId) cancelAnimationFrame(starsAnimationId);
    starsCtx.clearRect(0, 0, starsCanvas.width, starsCanvas.height);
  });
}


// --- RETRO COMMAND CONSOLE FORM HANDLERS ---
const secretInputForm = document.getElementById('secretInputForm');
const secretInputText = document.getElementById('secretInputText');
const secretScreen = document.getElementById('secretScreen');

if (secretInputForm) {
  secretInputForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const cmd = secretInputText.value.trim();
    if (!cmd) return;
    
    const cmdLine = document.createElement('p');
    cmdLine.innerHTML = `<span style="color: var(--accent-primary);">manan@desktop:~$</span> ${cmd}`;
    secretScreen.appendChild(cmdLine);
    secretInputText.value = '';
    
    const outputLine = document.createElement('p');
    const lowerCmd = cmd.toLowerCase();
    
    // Command helper check
    if (lowerCmd === 'clear') {
      secretScreen.innerHTML = '';
      return;
    }
    
    // Check for help command
    if (lowerCmd === 'help' || lowerCmd === '/help') {
      outputLine.innerHTML = "<strong>AVAILABLE COMMANDS & TOPICS:</strong><br>" +
                             "- <code>skills</code>: View core engineering stack & tools<br>" +
                             "- <code>projects</code>: View list of featured projects<br>" +
                             "- <code>volunteering</code>: View GDG & GDG Cloud volunteering details<br>" +
                             "- <code>bits pilani</code>: View BITS Pilani pitch win details<br>" +
                             "- <code>luna ai</code>: Details about the voice-controlled assistant<br>" +
                             "- <code>warehouse robot</code>: Details about the autonomous warehouse robot<br>" +
                             "- <code>exoplanet</code>: Details about the Exoplanet AI Dashboard<br>" +
                             "- <code>aarogya jal</code>: Details about the Aarogya Jal monitoring system<br>" +
                             "- <code>contact</code>: View active GitHub, LinkedIn, and email coordinates<br>" +
                             "- <code>clear</code>: Clear the terminal screen";
    } else {
      // Check if query is about Manan Ramani
      const isMananQuery = (str) => {
        const keywords = [
          'manan', 'ramani', 'you', 'your', 'about', 'skills', 'stack', 'code',
          'project', 'work', 'build', 'gdg', 'volunteer', 'bits', 'pilani', 'win', 'pitch',
          'z store', 'zstore', 'luna', 'assistant', 'voice', 'exoplanet', 'stars', 'figma',
          'warehouse', 'robot', 'aarogya', 'water', 'contact', 'email', 'hiring', 'resume', 'cv',
          'ambassador', 'google', 'education', 'college', 'b.tech', 'cse'
        ];
        return keywords.some(kw => str.includes(kw));
      };
      
      if (isMananQuery(lowerCmd)) {
        outputLine.innerHTML = getBotResponse(cmd);
      } else {
        outputLine.innerHTML = `<span style="color: #ff5f56;">Access Denied. System locked to Developer Profile. Queries must pertain to Manan Ramani. Type '/help' for options.</span>`;
      }
    }
    
    secretScreen.appendChild(outputLine);
    secretScreen.scrollTop = secretScreen.scrollHeight;
  });
}


// --- Status Clock Updater ---
function updateClock() {
  const clockEl = document.getElementById('menu-clock');
  if (!clockEl) return;
  const now = new Date();
  const options = { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true };
  clockEl.textContent = now.toLocaleString('en-US', options).replace(/,/g, '');
}
setInterval(updateClock, 1000);
updateClock();


// --- DYNAMIC TWIN CHATBOT ASSISTANT ---
const dockChatbotBtn = document.getElementById('dock-chatbot-btn');
const chatWindow = document.getElementById('chatWindow');
const chatCloseBtn = document.getElementById('chatCloseBtn');
const chatInputForm = document.getElementById('chatInputForm');
const chatInputText = document.getElementById('chatInputText');
const chatMessageStream = document.getElementById('chatMessageStream');

if (dockChatbotBtn) {
  dockChatbotBtn.addEventListener('click', () => {
    chatWindow.style.transform = 'scale(1) translateY(0)';
    chatWindow.style.opacity = '1';
    chatWindow.style.pointerEvents = 'auto';
    chatInputText.focus();
    
    dockChatbotBtn.classList.add('active');
  });
}

if (chatCloseBtn) {
  chatCloseBtn.addEventListener('click', () => {
    chatWindow.style.transform = 'scale(0.95) translateY(20px)';
    chatWindow.style.opacity = '0';
    chatWindow.style.pointerEvents = 'none';
    dockChatbotBtn.classList.remove('active');
  });
}

const knowledgeBase = {
  greetings: [
    "Hi there! I'm Manan's digital AI clone. Ask me anything about my projects, skills, BITS Pilani win, or volunteering details!",
    "Hey! I'm Manan's virtual twin. Ask me about my winning business pitch (The Z Store), my voice assistant (Luna AI), or my GDG volunteering."
  ],
  projects: [
    "Here are my core featured products:<br>" +
    "1. <strong>The Z Store</strong>: Managed offline retail platform for online-first fashion brands (BITS Pilani cohort winner).<br>" +
    "2. <strong>Luna AI</strong>: Voice-controlled desktop assistant built using Python PyQt5 & RAG.<br>" +
    "3. <strong>Exoplanet AI Dashboard</strong>: Interactive transit light curves dashboard.<br>" +
    "4. <strong>Autonomous Warehouse Robot</strong>: Hardware prototype & Vercel simulator.<br>" +
    "5. <strong>Aarogya Jal</strong>: Smart water quality monitoring system."
  ],
  skills: [
    "My technical skills architecture:<br>" +
    "- <strong>Languages</strong>: C, C++, Python, JavaScript, SQL.<br>" +
    "- <strong>Frontend</strong>: HTML5, CSS3, JavaScript, React.js.<br>" +
    "- <strong>Backend</strong>: Node.js.<br>" +
    "- <strong>AI & Data</strong>: RAG, AI Agents, NLP, NumPy, Pandas, Matplotlib, Power BI.<br>" +
    "- <strong>Tools</strong>: Git, GitHub, VS Code, Figma, Arduino IDE."
  ],
  contact: [
    "Feel free to get in touch with me:<br>" +
    "- <strong>Email</strong>: ramanimanan13@gmail.com<br>" +
    "- <strong>LinkedIn</strong>: linkedin.com/in/manan-ramani-1302-manman<br>" +
    "- <strong>GitHub</strong>: github.com/Manan-013"
  ],
  role: [
    "I am a **B.Tech CSE Student, Google Student Ambassador ('25 & '26), and Product Builder**. I focus on AI/ML, full-stack development, and interactive UX design."
  ],
  fallback: [
    "I can only disclose information regarding Manan Ramani. Try asking about my **skills**, **projects**, **role**, or **volunteering**!",
    "System is locked to Developer Profile. Scan for keywords: **skills**, **projects**, **role**, or **volunteering**."
  ]
};

function getBotResponse(userMessage) {
  const msg = userMessage.toLowerCase().trim();
  
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg.includes('greeting')) {
    return getRandomResponse(knowledgeBase.greetings);
  }
  if (msg.includes('z store') || msg.includes('zstore') || msg.includes('fashion') || msg.includes('retail') || msg.includes('store')) {
    return "I pitched <strong>The Z Store</strong> at BITS Pilani and won the 1st prize (₹10,000). It's a managed offline retail platform for online-first brands that solves the high cost of opening physical stores by providing shared premium space, operations, and customer reach.";
  }
  if (msg.includes('aarogya') || msg.includes('water') || msg.includes('jal')) {
    return "I built <strong>Aarogya Jal</strong> as an IoT-driven smart water health surveillance prototype to monitor quality parameters and detect contamination early using Python and SQL.";
  }
  if (msg.includes('luna') || msg.includes('assistant') || msg.includes('voice')) {
    return "I built <strong>Luna AI</strong> as a desktop assistant using Python, PyQt5, RAG, and LLM APIs to automate system tasks, execute search commands, and support voice control.";
  }
  if (msg.includes('warehouse') || msg.includes('robot') || msg.includes('simulator')) {
    return "I developed an <strong>Autonomous Warehouse Robot</strong> simulation featuring QR-based navigation, mapping, and shortest-path planning. A physical hardware prototype is currently under active development.";
  }
  if (msg.includes('volunteer') || msg.includes('gdg') || msg.includes('cloud') || msg.includes('udaipur')) {
    return "I volunteered at <strong>10+ GDG and GDG Cloud Udaipur events</strong>, managing their websites, handling social media content creation, coordinating logistics, and managing event operations.";
  }
  if (msg.includes('bits') || msg.includes('pilani') || msg.includes('win') || msg.includes('pitch') || msg.includes('prize')) {
    return "I participated in the 30-day intensive bootcamp at BITS Pilani where I built and pitched <strong>The Z Store</strong>. The jury awarded it <strong>First Place</strong> (₹10,000 cash prize) for its commercial viability.";
  }
  if (msg.includes('project') || msg.includes('work') || msg.includes('build') || msg.includes('saas') || msg.includes('make')) {
    return getRandomResponse(knowledgeBase.projects);
  }
  if (msg.includes('skill') || msg.includes('stack') || msg.includes('tech') || msg.includes('language') || msg.includes('code') || msg.includes('write')) {
    return getRandomResponse(knowledgeBase.skills);
  }
  if (msg.includes('contact') || msg.includes('hire') || msg.includes('email') || msg.includes('social') || msg.includes('linkedin') || msg.includes('git')) {
    return getRandomResponse(knowledgeBase.contact);
  }
  if (msg.includes('education') || msg.includes('college') || msg.includes('university') || msg.includes('gpa') || msg.includes('sgpa') || msg.includes('study') || msg.includes('school')) {
    return "I am pursuing my <strong>B.Tech in Computer Science & Engineering</strong> at <strong>Techno NJR Institute of Technology, Udaipur</strong> (Batch of 2024–2028), maintaining an SGPA of <strong>8.2/10</strong>.";
  }
  if (msg.includes('who') || msg.includes('about') || msg.includes('role') || msg.includes('profile') || msg.includes('resume') || msg.includes('cv')) {
    return getRandomResponse(knowledgeBase.role);
  }
  
  return getRandomResponse(knowledgeBase.fallback);
}

function getRandomResponse(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function appendMessage(sender, text) {
  const msgDiv = document.createElement('div');
  msgDiv.classList.add('chat-terminal-line', sender === 'user' ? 'user-line' : 'bot-line');
  
  const p = document.createElement('p');
  p.innerHTML = text;
  msgDiv.appendChild(p);
  
  chatMessageStream.appendChild(msgDiv);
  chatMessageStream.scrollTop = chatMessageStream.scrollHeight;
}

if (chatInputForm) {
  chatInputForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const query = chatInputText.value;
    if (!query.trim()) return;
    
    appendMessage('user', query);
    chatInputText.value = '';
    
    const typingDiv = document.createElement('div');
    typingDiv.classList.add('chat-terminal-line', 'bot-line', 'typing-indicator');
    chatMessageStream.appendChild(typingDiv);
    chatMessageStream.scrollTop = chatMessageStream.scrollHeight;
    
    setTimeout(() => {
      typingDiv.remove();
      const response = getBotResponse(query);
      appendMessage('bot', response);
    }, 600);
  });
}


/* ==========================================================================
   Liquid Glass Cursor Trail Animation
   ========================================================================== */
(function() {
  const canvas = document.createElement('canvas');
  canvas.id = 'fluidWallpaperCanvas';
  Object.assign(canvas.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    pointerEvents: 'none',
    zIndex: '-1' /* Above fallback background, below desktop grids */
  });
  
  // Insert inside wallpaper container
  const wallpaperEl = document.getElementById('wallpaper');
  if (wallpaperEl) {
    wallpaperEl.appendChild(canvas);
    wallpaperEl.style.background = 'transparent';
  } else {
    document.body.appendChild(canvas);
  }

  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) {
    console.warn("WebGL not supported by browser. Falling back to static wallpaper.");
    return;
  }

  // Vertex Shader: Pass coordinates
  const vsSource = `
    attribute vec2 a_position;
    varying vec2 v_texCoord;
    void main() {
      gl_Position = vec4(a_position * 2.0 - 1.0, 0.0, 1.0);
      v_texCoord = vec2(a_position.x, 1.0 - a_position.y);
    }
  `;

  // Fragment Shader: Paint-Mixing Swirl Refraction Engine with Monochrome Highlights
  const fsSource = `
    precision mediump float;
    varying vec2 v_texCoord;
    uniform sampler2D u_texture;
    uniform vec2 u_resolution;
    
    uniform vec2 u_ripples[8];
    uniform float u_ripple_ages[8];
    uniform float u_ripple_strengths[8];
    uniform int u_active_count;

    void main() {
      vec2 uv = v_texCoord;
      vec2 screenPos = uv * u_resolution;
      
      vec2 totalOffset = vec2(0.0);
      float totalHighlight = 0.0;
      float totalPaint = 0.0;
      
      for (int i = 0; i < 8; i++) {
        if (i >= 8) break;
        
        float isActive = step(float(i), float(u_active_count - 1));
        if (isActive < 0.5) continue;
        
        vec2 ripplePos = u_ripples[i];
        float age = u_ripple_ages[i];
        float strength = u_ripple_strengths[i];
        
        vec2 diff = screenPos - ripplePos;
        float dist = length(diff);
        
        // Swirl boundaries
        float maxRadius = 240.0;
        float currentRadius = maxRadius * (0.2 + 0.8 * age);
        
        if (dist < currentRadius) {
          float lifeFade = 1.0 - age;
          float edgeFade = (currentRadius - dist) / currentRadius;
          float force = lifeFade * edgeFade;
          
          // Rotational paint-mixing swirl angle
          float swirlAngle = 0.85 * force * strength * (1.0 - age * 0.4);
          
          float s = sin(swirlAngle);
          float c = cos(swirlAngle);
          
          // Rotate coordinates around ripple center
          vec2 rotatedDiff = vec2(diff.x * c - diff.y * s, diff.x * s + diff.y * c);
          
          // Add the rotational offset (divided by resolution to convert to UV space)
          totalOffset += (rotatedDiff - diff) / u_resolution;
          
          // Overlay a light radial liquid wave distortion
          float radialWave = sin(dist * 0.06 - age * 12.0) * 0.024 * force * strength; // increased radial wave strength
          totalOffset += normalize(diff) * radialWave;
          
          // Paint streak ribbons (clean monochrome swirls of silver/white paint)
          float angleVal = atan(diff.y, diff.x);
          float streaks = smoothstep(-0.25, 0.25, sin(angleVal * 3.0 + dist * 0.05 - age * 12.0));
          float paintVal = force * strength * 0.025 * lifeFade * (0.4 + 0.6 * streaks); // further reduced silver paint opacity
          totalPaint += paintVal;
          
          // Specular highlights outlining the swirly paint edges
          float highlight = pow(force, 3.0) * 0.06 * strength;
          totalHighlight += highlight;
          
          // Fresnel sheen along swirl waves
          float slope = cos(dist * 0.06 - age * 12.0) * force * strength;
          totalHighlight += max(0.0, slope) * 0.04;
        }
      }
      
      // Chromatic Aberration: Separate lookups for R, G, and B channels
      vec2 rUv = clamp(uv + totalOffset * 1.04, 0.001, 0.999);
      vec2 gUv = clamp(uv + totalOffset * 1.00, 0.001, 0.999);
      vec2 bUv = clamp(uv + totalOffset * 0.96, 0.001, 0.999);
      
      float rChannel = texture2D(u_texture, rUv).r;
      float gChannel = texture2D(u_texture, gUv).g;
      float bChannel = texture2D(u_texture, bUv).b;
      
      vec4 finalColor = vec4(rChannel, gChannel, bChannel, 1.0);
      
      // Blend in clean white/silver monochrome paint ribbons to react to neutral background areas
      vec3 silverPaint = vec3(0.96, 0.96, 0.98); // clean high-contrast silver pearl
      finalColor.rgb = mix(finalColor.rgb, silverPaint, min(totalPaint, 0.06)); // capped silver mix at 6% to keep it extremely subtle
      
      // Overlay specular glass/paint highlights
      finalColor.rgb += vec3(totalHighlight);
      
      gl_FragColor = finalColor;
    }
  `;

  // Compiler helpers
  function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);

  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Unable to link shader program.");
    return;
  }

  // Create offscreen canvas for drawing wallpaper and typography text
  const offscreen = document.createElement('canvas');
  const offscreenCtx = offscreen.getContext('2d');

  function updateTexture() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    offscreen.width = width;
    offscreen.height = height;
    if (!image.complete) return;
    
    // Scale wallpaper in "cover" mode
    const imgRatio = image.width / image.height;
    const canvasRatio = width / height;
    
    let drawW, drawH, drawX, drawY;
    if (imgRatio > canvasRatio) {
      drawH = height;
      drawW = height * imgRatio;
      drawX = (width - drawW) / 2;
      drawY = 0;
    } else {
      drawW = width;
      drawH = width / imgRatio;
      drawX = 0;
      drawY = (height - drawH) / 2;
    }
    
    offscreenCtx.clearRect(0, 0, width, height);
    offscreenCtx.drawImage(image, drawX, drawY, drawW, drawH);
    
    // Draw centered typography text directly onto the texture!
    offscreenCtx.textAlign = 'center';
    offscreenCtx.textBaseline = 'middle';
    
    // "PORTFOLIO."
    const mainFontSize = Math.max(38, Math.min(width * 0.05, 58)); // elegant font size
    offscreenCtx.font = `800 ${mainFontSize}px 'Syne', sans-serif`;
    offscreenCtx.fillStyle = '#ffffff';
    offscreenCtx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    offscreenCtx.shadowBlur = 10;
    
    offscreenCtx.fillText('PORTFOLIO.', width / 2, height / 2 - 15);
    
    // "MANAN RAMANI" (Sub-Header)
    offscreenCtx.shadowBlur = 0;
    const subFontSize = Math.max(13, Math.min(width * 0.015, 16));
    offscreenCtx.font = `700 ${subFontSize}px 'Space Grotesk', sans-serif`;
    offscreenCtx.fillStyle = '#a1a1b5'; // clean grey
    
    const subText = 'MANAN RAMANI';
    const spacedText = subText.split('').join('  '); // nice letter spacing
    offscreenCtx.fillText(spacedText, width / 2, height / 2 + mainFontSize * 0.6 + 10);
    
    // Upload offscreen canvas as texture to GPU
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, offscreen);
  }

  // Look up attributes & uniforms
  const positionLoc = gl.getAttribLocation(program, 'a_position');
  const resolutionLoc = gl.getUniformLocation(program, 'u_resolution');
  const activeCountLoc = gl.getUniformLocation(program, 'u_active_count');
  const textureLoc = gl.getUniformLocation(program, 'u_texture');

  // Cache locations for arrays
  const rippleLocs = [];
  const ageLocs = [];
  const strengthLocs = [];
  for (let i = 0; i < 8; i++) {
    rippleLocs.push(gl.getUniformLocation(program, `u_ripples[${i}]`));
    ageLocs.push(gl.getUniformLocation(program, `u_ripple_ages[${i}]`));
    strengthLocs.push(gl.getUniformLocation(program, `u_ripple_strengths[${i}]`));
  }

  // Draw buffer quad geometry
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    0.0, 0.0,
    1.0, 0.0,
    0.0, 1.0,
    0.0, 1.0,
    1.0, 0.0,
    1.0, 1.0
  ]), gl.STATIC_DRAW);

  // Load Wallpaper Texture
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([13, 12, 16, 255]));

  const image = new Image();
  image.src = '/wallpaper.png';
  image.onload = () => {
    updateTexture();
    
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    requestAnimationFrame(render);
  };

  // Ripples list tracking
  const ripples = []; 
  let lastX = window.innerWidth / 2;
  let lastY = window.innerHeight / 2;

  function addRipple(x, y, speed) {
    ripples.push({
      x: x,
      y: y, /* Match the Y-down texture coordinate mapping directly */
      age: 0,
      strength: Math.min(speed * 0.04, 1.0)
    });
    // Cap at 8 active ripples
    if (ripples.length > 8) {
      ripples.shift();
    }
  }

  window.addEventListener('mousemove', (e) => {
    const dist = Math.hypot(e.clientX - lastX, e.clientY - lastY);
    if (dist > 14) {
      addRipple(e.clientX, e.clientY, dist);
      lastX = e.clientX;
      lastY = e.clientY;
    }
  });

  window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const dist = Math.hypot(touch.clientX - lastX, touch.clientY - lastY);
      if (dist > 16) {
        addRipple(touch.clientX, touch.clientY, dist);
        lastX = touch.clientX;
        lastY = touch.clientY;
      }
    }
  });

  let startTime = Date.now();

  function render() {
    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
      updateTexture();
    }

    // Update ripple states
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.age += 0.016; // aging speed
      if (r.age >= 1.0) {
        ripples.splice(i, 1);
      }
    }

    gl.useProgram(program);

    gl.enableVertexAttribArray(positionLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE_0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(textureLoc, 0);

    gl.uniform2f(resolutionLoc, canvas.width, canvas.height);
    gl.uniform1i(activeCountLoc, ripples.length);

    // Pass arrays elements to uniforms
    for (let i = 0; i < 8; i++) {
      if (i < ripples.length) {
        const r = ripples[i];
        gl.uniform2f(rippleLocs[i], r.x, r.y);
        gl.uniform1f(ageLocs[i], r.age);
        gl.uniform1f(strengthLocs[i], r.strength);
      } else {
        gl.uniform2f(rippleLocs[i], 0.0, 0.0);
        gl.uniform1f(ageLocs[i], 1.0);
        gl.uniform1f(strengthLocs[i], 0.0);
      }
    }

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    requestAnimationFrame(render);
  }
})();


