/* ========== DEFAULT CONFIG ========== */
const DEFAULTS = {
  name: 'Имя Фамилия',
  title: 'Разработчик · Дизайнер · Создатель',
  tagline: 'Привет! Это мой личный сайт. Здесь можно узнать обо мне больше.',
  city: 'Москва',
  age: '25',
  exp: '3+ года',
  status: 'Открыт к предложениям',
  avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Alex',
  email: 'hello@example.com',
  primary: '#6366f1',
  accent: '#a855f7',
  text: '#f1f5f9',
  bgImage: '',
  bgOpacity: 0.4,
  particlesCount: 160,
  radius: 22,
  mode: 'normal', // 'normal' | 'compact'
  musicUrl: '',
  musicTitle: 'Фоновая музыка',
  musicAvatar: '',
  discordId: '',
  skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'Figma', 'Git', 'Python'],
  projects: [
    { title: 'Мой первый сайт', desc: 'Красивый лендинг с анимациями и адаптивной вёрсткой.', link: '#' },
    { title: 'Telegram-бот', desc: 'Бот для автоматизации задач и уведомлений.', link: '#' },
    { title: 'Мобильное приложение', desc: 'Кроссплатформенное приложение на React Native.', link: '#' }
  ],
  socials: [
    { name: 'Telegram', url: 'https://t.me/', icon: '✈️' },
    { name: 'GitHub', url: 'https://github.com/', icon: '💻' },
    { name: 'VK', url: 'https://vk.com/', icon: '🌐' }
  ],
  password: 'admin123',
  remoteConfigUrl: ''
};

/* ========== STATE ========== */
let config = loadConfig();
let particles = [];
let animationId = null;
let musicPlaying = false;
let mouse = { x: null, y: null, radius: 140 };
let revealObserver = null;

/* ========== DOM ========== */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

/* ========== INIT ========== */
document.addEventListener('DOMContentLoaded', async () => {
  if (config.remoteConfigUrl) {
    await tryLoadRemoteConfig(config.remoteConfigUrl);
  }

  applyConfig();
  initParticles();
  initMusic();
  initNav();
  initScrollReveal();
  initSettings();
  initDiscord();
  $('#year').textContent = new Date().getFullYear();
  window.addEventListener('resize', resizeCanvas);
  setTimeout(tryAutoplay, 300);
});

/* ========== CONFIG ========== */
function loadConfig() {
  try {
    const saved = localStorage.getItem('personalSiteConfig');
    if (saved) {
      return { ...DEFAULTS, ...JSON.parse(saved) };
    }
  } catch (e) {}
  return { ...DEFAULTS };
}

function saveConfig() {
  localStorage.setItem('personalSiteConfig', JSON.stringify(config));
}

async function tryLoadRemoteConfig(url) {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    if (data && typeof data === 'object') {
      const { password, ...rest } = data;
      config = { ...DEFAULTS, ...config, ...rest };
    }
  } catch (e) {
    console.warn('Remote config failed:', e);
  }
}

function extractDiscordId(input) {
  if (!input) return '';
  const str = String(input).trim();
  // https://discord.com/users/123456789012345678
  const m = str.match(/(?:discord\.com\/users\/|discordapp\.com\/users\/)(\d{15,20})/i);
  if (m) return m[1];
  // pure ID
  if (/^\d{15,20}$/.test(str)) return str;
  return '';
}

function applyConfig() {
  const isCompact = config.mode === 'compact';
  document.body.classList.toggle('mode-compact', isCompact);
  $('#compact-view').classList.toggle('hidden', !isCompact);
  $('#normal-view').classList.toggle('hidden', isCompact);

  // Text
  $('#nav-brand').textContent = config.name;
  $('#hero-name').textContent = config.name;
  $('#footer-name').textContent = config.name;
  $('#hero-title').textContent = config.title;
  $('#hero-tagline').textContent = config.tagline;
  $('#avatar').src = config.avatar || DEFAULTS.avatar;
  $('#email-btn').href = `mailto:${config.email}`;
  $('#contact-intro').textContent = 'Буду рад новым знакомствам и интересным проектам.';

  // Compact
  $('#compact-name').textContent = config.name;
  $('#compact-title').textContent = config.title;
  $('#compact-tagline').textContent = config.tagline;
  $('#compact-avatar').src = config.avatar || DEFAULTS.avatar;
  $('#compact-email').href = `mailto:${config.email}`;

  const meta = [];
  if (config.city) meta.push(`📍 ${config.city}`);
  if (config.age) meta.push(`🎂 ${config.age}`);
  if (config.exp) meta.push(`💼 ${config.exp}`);
  if (config.status) meta.push(`✨ ${config.status}`);
  $('#compact-meta').innerHTML = meta.map(m => `<span>${escapeHtml(m)}</span>`).join('');

  // Colors + radius
  document.documentElement.style.setProperty('--primary', config.primary);
  document.documentElement.style.setProperty('--accent', config.accent);
  document.documentElement.style.setProperty('--text', config.text);
  document.documentElement.style.setProperty('--radius', (config.radius || 22) + 'px');

  // Background
  const overlay = $('#bg-overlay');
  if (config.bgImage) {
    overlay.style.backgroundImage = `url(${config.bgImage})`;
    overlay.style.opacity = config.bgOpacity;
  } else {
    overlay.style.backgroundImage = 'none';
    overlay.style.opacity = 0;
  }

  // Skills
  const skillsHtml = config.skills.map(s => `<span class="skill-tag">${escapeHtml(s)}</span>`).join('');
  $('#skills-grid').innerHTML = skillsHtml;
  $('#compact-skills').innerHTML = skillsHtml;

  // Projects
  const projectsGrid = $('#projects-grid');
  projectsGrid.innerHTML = config.projects.map(p => `
    <article class="project-card reveal">
      <h3>${escapeHtml(p.title)}</h3>
      <p>${escapeHtml(p.desc)}</p>
      <a href="${escapeAttr(p.link)}" target="_blank" rel="noopener">Смотреть →</a>
    </article>
  `).join('');

  // Socials
  const socialsHtml = config.socials.map(s => `
    <a class="social-link" href="${escapeAttr(s.url)}" target="_blank" rel="noopener" title="${escapeAttr(s.name)}">
      <span>${s.icon || '🔗'}</span>
    </a>
  `).join('');
  $('#socials').innerHTML = socialsHtml;
  $('#compact-socials').innerHTML = socialsHtml;

  // Music
  applyMusicUI();

  // Particles
  if (particles.length !== (config.particlesCount || 80)) {
    initParticles();
  }

  // Discord
  initDiscord();

  // Re-init reveal
  initScrollReveal();
}

function applyMusicUI() {
  const audio = $('#bg-music');
  const hasMusic = !!config.musicUrl;

  [ $('#music-player'), $('#music-player-compact') ].forEach(el => {
    if (el) el.classList.toggle('hidden', !hasMusic);
  });

  if (hasMusic) {
    const direct = normalizeMusicUrl(config.musicUrl);
    if (audio.src !== direct) audio.src = direct;

    const title = config.musicTitle || 'Фоновая музыка';
    const titleEl = $('#music-title');
    const titleCompact = $('#music-title-compact');
    if (titleEl) titleEl.textContent = title;
    if (titleCompact) titleCompact.textContent = title;

    const cover = config.musicAvatar || '';
    const coverEls = [ $('#music-cover'), $('#music-cover-compact') ];
    coverEls.forEach(img => {
      if (!img) return;
      if (cover) {
        img.src = cover;
        img.style.display = '';
      } else {
        img.removeAttribute('src');
        img.style.display = 'none';
      }
    });
  } else {
    audio.removeAttribute('src');
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatTime(sec) {
  if (!isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/* ========== PARTICLES ========== */
function initParticles() {
  const canvas = $('#particles');
  const ctx = canvas.getContext('2d');
  resizeCanvas();

  particles = [];
  const count = config.particlesCount || 80;

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2.2 + 0.6,
      dx: (Math.random() - 0.5) * 0.45,
      dy: (Math.random() - 0.5) * 0.45,
      alpha: Math.random() * 0.55 + 0.35
    });
  }

  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseleave', onMouseLeave);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseleave', onMouseLeave);

  if (animationId) cancelAnimationFrame(animationId);
  animateParticles(ctx, canvas);
}

function onMouseMove(e) {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
}

function onMouseLeave() {
  mouse.x = null;
  mouse.y = null;
}

function resizeCanvas() {
  const canvas = $('#particles');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function animateParticles(ctx, canvas) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles.forEach((p, i) => {
    p.x += p.dx;
    p.y += p.dy;

    if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
    if (p.y < 0 || p.y > canvas.height) p.dy *= -1;

    if (mouse.x !== null && mouse.y !== null) {
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const dist = Math.hypot(dx, dy);
      if (dist < mouse.radius) {
        const force = (mouse.radius - dist) / mouse.radius;
        const angle = Math.atan2(dy, dx);
        p.x += Math.cos(angle) * force * 6;
        p.y += Math.sin(angle) * force * 6;
      }
    }

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.12})`;
    ctx.fill();

    for (let j = i + 1; j < particles.length; j++) {
      const p2 = particles[j];
      const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
      if (dist < 110) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 * (1 - dist / 110)})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
    }
  });

  animationId = requestAnimationFrame(() => animateParticles(ctx, canvas));
}

/* ========== MUSIC ========== */
function normalizeMusicUrl(url) {
  if (!url) return '';
  let u = url.trim();

  if (u.includes('dropbox.com')) {
    u = u.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
    u = u.replace('?dl=0', '').replace('&dl=0', '');
    u = u.replace('?dl=1', '').replace('&dl=1', '');
    if (!u.includes('raw=1') && !u.includes('dl=1')) {
      u += (u.includes('?') ? '&' : '?') + 'raw=1';
    }
  }

  const gMatch = u.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (gMatch) {
    u = `https://drive.google.com/uc?export=download&id=${gMatch[1]}`;
  }

  if (u.includes('disk.yandex.') && u.includes('/d/')) {
    u = u.replace('?manual=1', '');
  }

  return u;
}

function tryAutoplay() {
  const audio = $('#bg-music');
  if (!config.musicUrl || !audio.src) return;

  const vol = parseFloat($('#volume-slider')?.value || 0.6);
  audio.volume = vol;

  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.then(() => {
      setMusicPlaying(true);
    }).catch(() => {
      const unlock = () => {
        audio.play().then(() => setMusicPlaying(true)).catch(() => {});
        document.removeEventListener('click', unlock);
        document.removeEventListener('touchstart', unlock);
        document.removeEventListener('keydown', unlock);
      };
      document.addEventListener('click', unlock, { once: true });
      document.addEventListener('touchstart', unlock, { once: true });
      document.addEventListener('keydown', unlock, { once: true });
    });
  }
}

function setMusicPlaying(playing) {
  musicPlaying = playing;
  [ $('#music-toggle'), $('#music-toggle-compact') ].forEach(btn => {
    if (btn) btn.classList.toggle('playing', playing);
  });
}

function initMusic() {
  const audio = $('#bg-music');
  const btns = [ $('#music-toggle'), $('#music-toggle-compact') ];
  const progresses = [ $('#music-progress'), $('#music-progress-compact') ];
  const vols = [ $('#volume-slider') ];
  const currentEls = [ $('#music-current'), $('#music-current-compact') ];
  const durationEls = [ $('#music-duration'), $('#music-duration-compact') ];

  vols.forEach(vol => {
    if (!vol) return;
    audio.volume = parseFloat(vol.value);
    vol.addEventListener('input', () => {
      audio.volume = parseFloat(vol.value);
    });
  });

  btns.forEach(btn => {
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (!config.musicUrl) return;
      if (musicPlaying) {
        audio.pause();
        setMusicPlaying(false);
      } else {
        audio.play().then(() => setMusicPlaying(true)).catch(() => {});
      }
    });
  });

  audio.addEventListener('timeupdate', () => {
    if (audio.duration) {
      const pct = (audio.currentTime / audio.duration * 100) + '%';
      progresses.forEach(p => { if (p) p.style.width = pct; });
      currentEls.forEach(el => { if (el) el.textContent = formatTime(audio.currentTime); });
      durationEls.forEach(el => { if (el) el.textContent = formatTime(audio.duration); });
    }
  });

  audio.addEventListener('loadedmetadata', () => {
    durationEls.forEach(el => { if (el) el.textContent = formatTime(audio.duration); });
  });

  audio.addEventListener('ended', () => {
    progresses.forEach(p => { if (p) p.style.width = '0%'; });
    setMusicPlaying(false);
  });

  // click on progress bar to seek
  $$('.music-bar').forEach(bar => {
    bar.addEventListener('click', (e) => {
      if (!audio.duration) return;
      const rect = bar.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      audio.currentTime = ratio * audio.duration;
    });
  });
}

/* ========== DISCORD (Lanyard) ========== */
async function initDiscord() {
  const raw = (config.discordId || '').trim();
  const id = extractDiscordId(raw);
  const badge = $('#discord-badge');
  const card = $('#discord-card');
  const statusDot = $('#discord-status-dot');
  const logo = $('#discord-logo');

  if (!id) {
    if (badge) badge.classList.add('hidden');
    if (card) card.classList.add('hidden');
    if (statusDot) statusDot.classList.add('hidden');
    if (logo) logo.classList.add('hidden');
    return;
  }

  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${id}`);
    const json = await res.json();
    if (!json.success || !json.data) throw new Error('no data');

    const d = json.data;
    const user = d.discord_user || {};
    const status = d.discord_status || 'offline';
    const username = user.global_name || user.username || 'Discord';
    const tag = user.discriminator && user.discriminator !== '0'
      ? `#${user.discriminator}`
      : (user.username ? `@${user.username}` : '');
    const avatarHash = user.avatar;
    const avatarUrl = avatarHash
      ? `https://cdn.discordapp.com/avatars/${user.id}/${avatarHash}.${avatarHash.startsWith('a_') ? 'gif' : 'png'}?size=128`
      : `https://cdn.discordapp.com/embed/avatars/${(user.id || 0) % 5}.png`;

    // Normal badge
    if (badge) {
      badge.classList.remove('hidden');
      const av = $('#discord-avatar-normal');
      if (av) av.src = avatarUrl;
      const nm = $('#discord-name-normal');
      if (nm) nm.textContent = username;
      const st = $('#discord-status-normal');
      if (st) {
        st.textContent = status;
        st.className = 'discord-status ' + status;
      }
    }

    // Compact card
    if (card) {
      card.classList.remove('hidden');
      const av = $('#discord-avatar');
      if (av) av.src = avatarUrl;
      const nm = $('#discord-name');
      if (nm) nm.textContent = username;
      const tg = $('#discord-tag');
      if (tg) tg.textContent = tag;
      const st = $('#discord-status');
      if (st) {
        st.textContent = status;
        st.className = 'discord-status ' + status;
      }
    }

    if (statusDot) {
      statusDot.classList.remove('hidden');
      statusDot.className = 'status-dot ' + status;
    }

    if (logo) logo.classList.remove('hidden');
  } catch (e) {
    console.warn('Discord Lanyard error:', e);
    // Даже при ошибке показываем логотип, если ID указан
    if (badge) badge.classList.add('hidden');
    if (card) card.classList.add('hidden');
    if (statusDot) statusDot.classList.add('hidden');
    if (logo) logo.classList.remove('hidden');
  }
}

/* ========== NAV ========== */
function initNav() {
  const toggle = $('#nav-toggle');
  const links = $('.nav-links');

  toggle.addEventListener('click', () => {
    links.classList.toggle('open');
  });

  $$('.nav-links a').forEach(a => {
    a.addEventListener('click', () => links.classList.remove('open'));
  });

  const sections = $$('section, header');
  const navLinks = $$('.nav-links a');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(sec => {
      const top = sec.offsetTop - 120;
      if (scrollY >= top) current = sec.getAttribute('id');
    });
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === '#' + current);
    });
  });
}

/* ========== SCROLL REVEAL ========== */
function initScrollReveal() {
  if (revealObserver) {
    revealObserver.disconnect();
  }

  const reveals = $$('.reveal, .section-title, .skill-tag, .project-card, .info-card');
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      } else {
        entry.target.classList.remove('visible');
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  reveals.forEach(el => {
    el.classList.add('reveal');
    el.classList.remove('visible');
    revealObserver.observe(el);
  });
}

/* ========== SETTINGS ========== */
function initSettings() {
  const settingsBtn = $('#settings-btn');
  const loginModal = $('#login-modal');
  const settingsModal = $('#settings-modal');
  const passwordInput = $('#admin-password');
  const loginError = $('#login-error');

  settingsBtn.addEventListener('click', () => {
    loginModal.classList.add('open');
    passwordInput.value = '';
    loginError.textContent = '';
    setTimeout(() => passwordInput.focus(), 100);
  });

  $('#login-cancel').addEventListener('click', () => {
    loginModal.classList.remove('open');
  });

  $('#login-submit').addEventListener('click', tryLogin);
  passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') tryLogin();
  });

  function tryLogin() {
    if (passwordInput.value === config.password) {
      loginModal.classList.remove('open');
      openSettings();
    } else {
      loginError.textContent = 'Неверный пароль';
      passwordInput.value = '';
      passwordInput.focus();
    }
  }

  $('#settings-close').addEventListener('click', () => {
    settingsModal.classList.remove('open');
  });

  $$('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.tab').forEach(t => t.classList.remove('active'));
      $$('.tab-pane').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      $(`#tab-${tab.dataset.tab}`).classList.add('active');
    });
  });

  const colorPairs = [
    ['set-primary', 'set-primary-hex'],
    ['set-accent', 'set-accent-hex'],
    ['set-text', 'set-text-hex']
  ];
  colorPairs.forEach(([colorId, hexId]) => {
    const colorEl = $(`#${colorId}`);
    const hexEl = $(`#${hexId}`);
    colorEl.addEventListener('input', () => { hexEl.value = colorEl.value; });
    hexEl.addEventListener('input', () => {
      if (/^#[0-9A-Fa-f]{6}$/.test(hexEl.value)) colorEl.value = hexEl.value;
    });
  });

  $('#set-bg-opacity').addEventListener('input', (e) => {
    $('#bg-opacity-val').textContent = e.target.value;
  });
  $('#set-particles').addEventListener('input', (e) => {
    $('#particles-val').textContent = e.target.value;
  });
  $('#set-radius').addEventListener('input', (e) => {
    $('#radius-val').textContent = e.target.value;
  });

  // Save
  $('#settings-save').addEventListener('click', () => {
    config.name = $('#set-name').value.trim() || DEFAULTS.name;
    config.title = $('#set-title').value.trim() || DEFAULTS.title;
    config.tagline = $('#set-tagline').value.trim() || DEFAULTS.tagline;
    config.city = $('#set-city').value.trim() || DEFAULTS.city;
    config.age = $('#set-age').value.trim() || DEFAULTS.age;
    config.exp = $('#set-exp').value.trim() || DEFAULTS.exp;
    config.status = $('#set-status').value.trim() || DEFAULTS.status;
    config.avatar = $('#set-avatar').value.trim() || DEFAULTS.avatar;
    config.email = $('#set-email').value.trim() || DEFAULTS.email;
    config.mode = $('#set-mode').value || 'normal';

    config.primary = $('#set-primary').value;
    config.accent = $('#set-accent').value;
    config.text = $('#set-text').value;
    config.bgImage = $('#set-bg').value.trim();
    config.bgOpacity = parseFloat($('#set-bg-opacity').value);
    config.particlesCount = parseInt($('#set-particles').value, 10);
    config.radius = parseInt($('#set-radius').value, 10);

    config.musicUrl = $('#set-music').value.trim();
    config.musicTitle = $('#set-music-title').value.trim() || 'Фоновая музыка';
    config.musicAvatar = $('#set-music-avatar').value.trim();

    config.discordId = $('#set-discord-id').value.trim();

    const skillsRaw = $('#set-skills').value.trim();
    config.skills = skillsRaw ? skillsRaw.split(',').map(s => s.trim()).filter(Boolean) : DEFAULTS.skills;

    try {
      const proj = JSON.parse($('#set-projects').value || '[]');
      if (Array.isArray(proj)) config.projects = proj;
    } catch (e) {
      alert('Ошибка в JSON проектов. Проверь формат.');
      return;
    }

    try {
      const soc = JSON.parse($('#set-socials').value || '[]');
      if (Array.isArray(soc)) config.socials = soc;
    } catch (e) {
      alert('Ошибка в JSON соцсетей. Проверь формат.');
      return;
    }

    const newPass = $('#set-new-password').value;
    if (newPass.trim()) {
      config.password = newPass.trim();
    }

    config.remoteConfigUrl = $('#set-remote-url').value.trim();

    saveConfig();
    applyConfig();
    settingsModal.classList.remove('open');

    const btn = $('#settings-save');
    const old = btn.textContent;
    btn.textContent = 'Сохранено!';
    setTimeout(() => { btn.textContent = old; }, 1500);
  });

  // Reset
  $('#settings-reset').addEventListener('click', () => {
    if (confirm('Сбросить все настройки к значениям по умолчанию?')) {
      localStorage.removeItem('personalSiteConfig');
      config = { ...DEFAULTS };
      applyConfig();
      settingsModal.classList.remove('open');
    }
  });

  // Export
  $('#settings-export').addEventListener('click', () => {
    // apply form first
    config.name = $('#set-name').value.trim() || DEFAULTS.name;
    config.title = $('#set-title').value.trim() || DEFAULTS.title;
    config.tagline = $('#set-tagline').value.trim() || DEFAULTS.tagline;
    config.city = $('#set-city').value.trim() || DEFAULTS.city;
    config.age = $('#set-age').value.trim() || DEFAULTS.age;
    config.exp = $('#set-exp').value.trim() || DEFAULTS.exp;
    config.status = $('#set-status').value.trim() || DEFAULTS.status;
    config.avatar = $('#set-avatar').value.trim() || DEFAULTS.avatar;
    config.email = $('#set-email').value.trim() || DEFAULTS.email;
    config.mode = $('#set-mode').value || 'normal';
    config.primary = $('#set-primary').value;
    config.accent = $('#set-accent').value;
    config.text = $('#set-text').value;
    config.bgImage = $('#set-bg').value.trim();
    config.bgOpacity = parseFloat($('#set-bg-opacity').value);
    config.particlesCount = parseInt($('#set-particles').value, 10);
    config.radius = parseInt($('#set-radius').value, 10);
    config.musicUrl = $('#set-music').value.trim();
    config.musicTitle = $('#set-music-title').value.trim() || 'Фоновая музыка';
    config.musicAvatar = $('#set-music-avatar').value.trim();
    config.discordId = $('#set-discord-id').value.trim();
    const skillsRaw = $('#set-skills').value.trim();
    config.skills = skillsRaw ? skillsRaw.split(',').map(s => s.trim()).filter(Boolean) : DEFAULTS.skills;
    try {
      const proj = JSON.parse($('#set-projects').value || '[]');
      if (Array.isArray(proj)) config.projects = proj;
    } catch (e) {}
    try {
      const soc = JSON.parse($('#set-socials').value || '[]');
      if (Array.isArray(soc)) config.socials = soc;
    } catch (e) {}
    const newPass = $('#set-new-password').value;
    if (newPass.trim()) config.password = newPass.trim();
    config.remoteConfigUrl = $('#set-remote-url').value.trim();

    const code = `const DEFAULTS = ${JSON.stringify(config, null, 2)};`;
    navigator.clipboard.writeText(code).then(() => {
      const btn = $('#settings-export');
      const old = btn.textContent;
      btn.textContent = 'Скопировано!';
      setTimeout(() => { btn.textContent = old; }, 2000);
      alert('Код скопирован!\n\n1) Вставь его в script.js вместо const DEFAULTS = {...}\n2) Или сохрани JSON на npoint.io / JSONBin / GitHub raw и укажи URL в «Удалённый конфиг» — тогда настройки увидят все посетители.');
    }).catch(() => {
      prompt('Скопируй этот код и вставь в script.js вместо DEFAULTS:', code);
    });
  });

  [loginModal, settingsModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('open');
    });
  });
}

function openSettings() {
  $('#set-name').value = config.name;
  $('#set-title').value = config.title;
  $('#set-tagline').value = config.tagline;
  $('#set-city').value = config.city;
  $('#set-age').value = config.age;
  $('#set-exp').value = config.exp;
  $('#set-status').value = config.status;
  $('#set-avatar').value = config.avatar;
  $('#set-email').value = config.email;
  $('#set-mode').value = config.mode || 'normal';

  $('#set-primary').value = config.primary;
  $('#set-primary-hex').value = config.primary;
  $('#set-accent').value = config.accent;
  $('#set-accent-hex').value = config.accent;
  $('#set-text').value = config.text;
  $('#set-text-hex').value = config.text;
  $('#set-bg').value = config.bgImage;
  $('#set-bg-opacity').value = config.bgOpacity;
  $('#bg-opacity-val').textContent = config.bgOpacity;
  $('#set-particles').value = config.particlesCount;
  $('#particles-val').textContent = config.particlesCount;
  $('#set-radius').value = config.radius || 22;
  $('#radius-val').textContent = config.radius || 22;

  $('#set-music').value = config.musicUrl;
  $('#set-music-title').value = config.musicTitle;
  $('#set-music-avatar').value = config.musicAvatar || '';

  $('#set-skills').value = config.skills.join(', ');
  $('#set-projects').value = JSON.stringify(config.projects, null, 2);
  $('#set-socials').value = JSON.stringify(config.socials, null, 2);

  $('#set-discord-id').value = config.discordId || '';
  $('#set-new-password').value = '';
  $('#set-remote-url').value = config.remoteConfigUrl || '';

  $$('.tab').forEach(t => t.classList.remove('active'));
  $$('.tab-pane').forEach(p => p.classList.remove('active'));
  $('.tab[data-tab="profile"]').classList.add('active');
  $('#tab-profile').classList.add('active');

  $('#settings-modal').classList.add('open');
}
