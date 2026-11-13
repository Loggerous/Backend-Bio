const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// === НАСТРОЙКИ (ОБЯЗАТЕЛЬНО ПОМЕНЯЙ) ===
const ADMIN_PASSWORD = 'твой_сложный_пароль_здесь';   // пароль для входа в /admin
const JWT_SECRET = 'очень_длинный_случайный_секрет_12345abcde'; // любой длинный текст
// ======================================

// Файл, где хранится конфиг
const CONFIG_FILE = path.join(__dirname, 'config.json');

// Если файла нет — создаём дефолтный
if (!fs.existsSync(CONFIG_FILE)) {
  const defaultConfig = {
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

app.use(cors({
  origin: true,          // разрешаем запросы с твоего сайта
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public')); // сюда положи index.html, styles.css, script.js

// ========== ПУБЛИЧНЫЙ КОНФИГ (для всех посетителей) ==========
app.get('/api/config', (req, res) => {
  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    // пароль никогда не отдаём
    res.json(config);
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

// ========== ВХОД В АДМИНКУ ==========
app.post('/api/login', async (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Неверный пароль' });
  }

  const token = jwt.sign({ admin: true }, JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
  res.json({ success: true });
});

// ========== СОХРАНЕНИЕ КОНФИГА (только админ) ==========
app.post('/api/config', authMiddleware, (req, res) => {
  try {
    // Сохраняем всё, что пришло (пароль сайта больше не нужен)
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Ошибка сохранения' });
  }
});

// ========== ПРОВЕРКА, залогинен ли ==========
app.get('/api/me', authMiddleware, (req, res) => {
  res.json({ admin: true });
});

// ========== СТРАНИЦА /admin ==========
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});