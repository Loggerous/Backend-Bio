const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ================== НАСТРОЙКИ ==================
const JWT_SECRET = 'очень_длинный_случайный_секрет_12345abcde_поменяй_меня';
// ===============================================

const CONFIG_FILE = path.join(__dirname, 'config.json');

// Создаём config.json, если его нет
if (!fs.existsSync(CONFIG_FILE)) {
  const defaultConfig = {
    adminPassword: 'admin123',          // <-- пароль для /admin
    name: 'Имя Фамилия',
    title: 'Разработчик · Дизайнер · Создатель',
    tagline: 'Привет! Это мой личный сайт.',
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
    mode: 'compact',
    musicUrl: '',
    musicTitle: 'Фоновая музыка',
    musicAvatar: '',
    discordId: '',
    skills: ['HTML', 'CSS', 'JavaScript', 'React'],
    projects: [],
    socials: []
  };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
}

function getConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
}

function saveConfig(data) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2));
}

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));

// ========== ПУБЛИЧНЫЙ КОНФИГ (без пароля) ==========
app.get('/api/config', (req, res) => {
  try {
    const config = getConfig();
    const { adminPassword, ...publicConfig } = config; // пароль не отдаём
    res.json(publicConfig);
  } catch (e) {
    res.status(500).json({ error: 'Не удалось загрузить конфиг' });
  }
});

// ========== ПРОВЕРКА ТОКЕНА ==========
function authMiddleware(req, res, next) {
  const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Нет доступа' });

  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Сессия истекла' });
  }
}

// ========== ВХОД ==========
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  const config = getConfig();

  if (password !== config.adminPassword) {
    return res.status(401).json({ error: 'Неверный пароль' });
  }

  const token = jwt.sign({ admin: true }, JWT_SECRET, { expiresIn: '7d' });

  res.cookie('token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.json({ success: true });
});

// ========== СОХРАНЕНИЕ КОНФИГА ==========
app.post('/api/config', authMiddleware, (req, res) => {
  try {
    const current = getConfig();
    // Сохраняем всё, что пришло + не теряем adminPassword, если его не передали
    const newConfig = {
      ...current,
      ...req.body,
      adminPassword: req.body.adminPassword || current.adminPassword
    };
    saveConfig(newConfig);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Ошибка сохранения' });
  }
});

// ========== ПРОВЕРКА АВТОРИЗАЦИИ ==========
app.get('/api/me', authMiddleware, (req, res) => {
  res.json({ admin: true });
});

// ========== СТРАНИЦА /admin ==========
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Главная страница
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
