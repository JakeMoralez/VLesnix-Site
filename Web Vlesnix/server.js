

require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const session = require('express-session');
const path = require('path');
const { Client, GatewayIntentBits, PermissionsBitField, ChannelType } = require('discord.js');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

let db;

async function initializeDatabase() {
    try {
        db = await open({
            filename: path.join(__dirname, 'vlesnix-guard.sqlite'),
            driver: sqlite3.Database
        });
        console.log('Successfully connected to the SQLite database.');
        await setupDatabase();
    } catch (error) {
        console.error("Database initialization failed:", error);
        process.exit(1);
    }
}

async function setupDatabase() {
    await db.exec(`
        CREATE TABLE IF NOT EXISTS news (
            id TEXT PRIMARY KEY,
            timestamp INTEGER,
            date TEXT,
            title TEXT,
            content TEXT,
            tags TEXT
        );
        
        CREATE TABLE IF NOT EXISTS pages (
            key TEXT PRIMARY KEY,
            content TEXT
        );
    `);

    // --- Populate News Table ---
    const newsRow = await db.get('SELECT COUNT(*) as count FROM news');
    if (newsRow && newsRow.count === 0) {
        console.log('News table is empty. Populating with initial news data...');
        const { initialNewsData } = require('./public/js/data/news-data.js');
        for (const item of initialNewsData) {
            await db.run(
                'INSERT INTO news (id, timestamp, date, title, content, tags) VALUES (?, ?, ?, ?, ?, ?)',
                [item.id, item.timestamp, item.date, item.title, item.content, JSON.stringify(item.tags)]
            );
        }
        console.log('News table populated successfully.');
    }
    
    // --- Populate Pages Table ---
    const pagesRow = await db.get('SELECT COUNT(*) as count FROM pages');
    if (pagesRow && pagesRow.count === 0) {
        console.log('Pages table is empty. Populating with initial content...');
        const initialPages = {
            privacy: `# Политика конфиденциальности Vlesnix Guard
*Дата последнего обновления: 25 мая 2024 г.*

### Введение
Ваша конфиденциальность важна для нас. Политика Vlesnix Guard заключается в уважении вашей конфиденциальности в отношении любой информации, которую мы можем собирать от вас через нашего бота Discord ("Бот") и наш веб-сайт ("Сайт").

### Информация, которую мы собираем
Мы собираем информацию только тогда, когда у нас есть реальная причина для этого, например, для предоставления вам наших услуг. Мы собираем ее честными и законными способами, с вашего ведома и согласия. Мы также сообщаем вам, почему мы ее собираем и как она будет использоваться.
- **Данные, предоставляемые Discord:** Когда вы авторизуетесь на нашем Сайте, мы получаем от Discord ваш идентификатор пользователя, имя пользователя и аватар. Когда вы добавляете Бота на свой сервер, мы получаем доступ к идентификатору сервера, названиям каналов и ролей, а также к общедоступной информации о пользователях сервера.
- **Данные, создаваемые пользователями:** Мы можем хранить конфигурационные данные, которые вы устанавливаете для Бота на вашем сервере, такие как настройки модерации, пользовательские команды или префиксы. Мы не храним содержимое сообщений пользователей, за исключением случаев, когда это необходимо для работы конкретной функции (например, логирование действий).

### Как мы используем вашу информацию
Мы используем собранную информацию для:
- Предоставления, эксплуатации и поддержания наших услуг (Бота и Сайта).
- Улучшения, персонализации и расширения наших услуг.
- Понимания и анализа того, как вы используете наши услуги.

### Хранение данных
Мы храним собранную информацию только до тех пор, пока это необходимо для предоставления вам запрошенной услуги. Данные, которые мы храним, мы будем защищать коммерчески приемлемыми способами для предотвращения потерь и краж, а также несанкционированного доступа, раскрытия, копирования, использования или изменения.

### Раскрытие информации третьим лицам
Мы не передаем никакую личную информацию публично или третьим лицам, за исключением случаев, когда это требуется по закону.

### Ваши права
Вы имеете право запросить доступ к личным данным, которые мы храним о вас, а также потребовать их исправления или удаления. Для этого, пожалуйста, свяжитесь с нами через наш сервер поддержки.

### Ссылки на другие сайты
Наш Сайт может содержать ссылки на внешние сайты, которые не управляются нами. Помните, что мы не контролируем содержание и практику этих сайтов и не можем нести ответственность за их политику конфиденциальности.

### Изменения в нашей Политике конфиденциальности
Мы можем время от времени обновлять нашу Политику конфиденциальности. Мы рекомендуем вам периодически просматривать эту страницу на предмет любых изменений.`,
            terms: `# Условия использования Vlesnix Guard
*Дата последнего обновления: 25 мая 2024 г.*

### 1. Принятие Условий
Используя бота Vlesnix Guard ("Бот") или веб-сайт vlesnix.guard.com ("Сайт"), вы соглашаетесь соблюдать настоящие Условия использования ("Условия"). Если вы не согласны с какими-либо из этих условий, вам запрещено использовать или получать доступ к этому Боту и Сайту.

### 2. Описание Услуги
Vlesnix Guard предоставляет многофункционального бота для платформы Discord, предназначенного для модерации, защиты, управления и развлечения на серверах Discord. Функции могут быть изменены, обновлены или прекращены по нашему усмотрению.

### 3. Лицензия на использование
Предоставляется разрешение на временное использование Бота на ваших серверах Discord в личных, некоммерческих целях. Это предоставление лицензии, а не передача права собственности, и по этой лицензии вы не можете:
- Изменять или копировать материалы;
- Использовать Бота в любых коммерческих целях или для любого публичного показа (коммерческого или некоммерческого);
- Пытаться декомпилировать или реконструировать любое программное обеспечение, содержащееся в Боте или на Сайте;
- Удалять любые уведомления об авторских правах или другие проприетарные обозначения из материалов.

Эта лицензия автоматически прекращает свое действие, если вы нарушаете любое из этих ограничений, и может быть прекращена нами в любое время.

### 4. Отказ от ответственности
Материалы и услуги на Сайте и в Боте предоставляются «как есть». Мы не даем никаких гарантий, явных или подразумеваемых, и настоящим отказываемся от всех других гарантий, включая, без ограничений, подразумеваемые гарантии или условия товарной пригодности, пригодности для определенной цели или ненарушения прав интеллектуальной собственности.

### 5. Ограничения
Ни при каких обстоятельствах Vlesnix Guard или его поставщики не несут ответственности за любой ущерб (включая, без ограничений, ущерб от потери данных или прибыли, или из-за прерывания деятельности), возникающий в результате использования или невозможности использования Бота или Сайта.

### 6. Изменения Условий
Мы можем пересмотреть эти Условия в любое время без предварительного уведомления. Используя этот Сайт и Бота, вы соглашаетесь соблюдать текущую версию настоящих Условий.

### 7. Регулирующее законодательство
Любые претензии, связанные с Сайтом или Ботом Vlesnix Guard, регулируются законодательством нашей юрисдикции без учета его коллизионных норм.`
        };
        for (const [key, content] of Object.entries(initialPages)) {
            await db.run('INSERT INTO pages (key, content) VALUES (?, ?)', [key, content]);
        }
        console.log('Pages table populated successfully.');
    }
}


const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildMembers] });

client.once('ready', () => {
    console.log(`Бот ${client.user.tag} успешно залогинен!`);
    initializeDatabase();
});

client.login(process.env.DISCORD_BOT_TOKEN).catch(err => console.error("Ошибка логина бота:", err));

const app = express();
const port = 3000;

// Отказоустойчивая настройка хранилища сессий
let sessionStore;
try {
    const FileStore = require('session-file-store')(session);
    sessionStore = new FileStore({
        path: path.join(__dirname, 'sessions'),
        logFn: function() {}, // Отключаем логирование от file-store
        reapInterval: 1000 * 60 * 60, // Очистка старых сессий раз в час
        // --- FIX FOR WINDOWS EPERM ERRORS ---
        retries: 5,         // Количество повторных попыток при ошибке
        retry_delay: 100    // Задержка в миллисекундах между попытками
        // --- END FIX ---
    });
    console.log("Хранилище сессий 'session-file-store' успешно подключено. Вход будет сохраняться.");
} catch (error) {
    console.warn("\n===============================================================");
    console.warn("ВНИМАНИЕ: Модуль 'session-file-store' не найден.");
    console.warn("Сессии будут сбрасываться после каждого перезапуска сервера.");
    console.warn("Чтобы включить постоянное хранение сессий, остановите сервер (Ctrl+C)");
    console.warn("и выполните в терминале команду: npm install session-file-store");
    console.warn("===============================================================\n");
    sessionStore = undefined; // Используем стандартное хранилище в памяти
}


app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 дней
        httpOnly: true
    }
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // Middleware to parse JSON bodies

// =================================================================
// --- ГЛАВНЫЕ РОУТЫ ПРИЛОЖЕНИЯ ---
// =================================================================

app.get('/login', (req, res) => {
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(`http://localhost:3000/auth/callback`)}&response_type=code&scope=identify%20guilds`;
    res.redirect(discordAuthUrl);
});

app.get('/auth/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) return res.status(400).send('Ошибка: отсутствует код авторизации.');

    try {
        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            body: new URLSearchParams({
                client_id: process.env.DISCORD_CLIENT_ID,
                client_secret: process.env.DISCORD_CLIENT_SECRET,
                grant_type: 'authorization_code',
                code,
                redirect_uri: `http://localhost:3000/auth/callback`,
            }),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        const tokenData = await tokenResponse.json();
        if (tokenData.error) throw new Error(tokenData.error_description);

        const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: { authorization: `Bearer ${tokenData.access_token}` }
        });
        const userData = await userResponse.json();

        req.session.user = {
            id: userData.id,
            username: userData.username,
            avatar: `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`,
            accessToken: tokenData.access_token,
        };

        res.redirect('/dashboard/index.html');

    } catch (error) {
        console.error('Ошибка OAuth2:', error);
        res.status(500).send('Произошла ошибка во время авторизации.');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).send('Не удалось выйти из системы.');
        res.redirect('/');
    });
});


// =================================================================
// --- API РОУТЫ (для общения frontend с backend) ---
// =================================================================

async function isAdmin(userId) {
    if (!userId) return false;
    if (!client.isReady()) {
        console.warn("Admin check attempted before bot was ready.");
        return false;
    }
    const guildId = '1337369827039248474';
    try {
        const guild = await client.guilds.fetch(guildId);
        if (!guild) return false;
        const member = await guild.members.fetch(userId);
        if (!member) return false;
        return member.permissions.has(PermissionsBitField.Flags.Administrator);
    } catch (error) {
        // This is not an error, just means the user isn't in the guild.
        // console.log(`Admin check for user ${userId} on guild ${guildId}: User might not be in the guild.`);
        return false;
    }
}

const adminCheckMiddleware = async (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Пользователь не авторизован.' });
    }
    const adminStatus = await isAdmin(req.session.user.id);
    if (!adminStatus) {
        return res.status(403).json({ error: 'У вас нет прав для выполнения этого действия.' });
    }
    next();
};

app.get('/api/is-admin', async (req, res) => {
    const adminStatus = await isAdmin(req.session.user?.id);
    res.json({ isAdmin: adminStatus });
});

// ======================= PAGES API ==========================
app.get('/api/pages/:key', async (req, res) => {
    const { key } = req.params;
    try {
        const page = await db.get('SELECT content FROM pages WHERE key = ?', [key]);
        if (page) {
            res.json({ content: page.content });
        } else {
            res.status(404).json({ error: 'Страница не найдена' });
        }
    } catch (error) {
        console.error(`Error fetching page ${key}:`, error);
        res.status(500).json({ error: 'Ошибка базы данных' });
    }
});

app.put('/api/pages/:key', adminCheckMiddleware, async (req, res) => {
    const { key } = req.params;
    const { content } = req.body;
    if (typeof content !== 'string') {
        return res.status(400).json({ error: 'Некорректное содержимое' });
    }
    try {
        const result = await db.run('UPDATE pages SET content = ? WHERE key = ?', [content, key]);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Страница не найдена' });
        }
        res.json({ success: true, message: 'Страница успешно обновлена' });
    } catch (error) {
        console.error(`Error updating page ${key}:`, error);
        res.status(500).json({ error: 'Ошибка базы данных' });
    }
});


// ======================= NEWS API ==========================
app.get('/api/news', async (req, res) => {
    try {
        const rows = await db.all('SELECT * FROM news ORDER BY timestamp DESC');
        const news = rows.map(row => {
            try {
                return {
                    ...row,
                    tags: JSON.parse(row.tags)
                };
            } catch (e) {
                console.error(`Failed to parse tags for news ID ${row.id}:`, row.tags);
                return { ...row, tags: [] }; // Return empty tags on parse error
            }
        });
        res.json(news);
    } catch (error) {
        console.error('Error fetching news from DB:', error);
        res.status(500).json({ error: 'Database error while fetching news.' });
    }
});

app.post('/api/news', adminCheckMiddleware, async (req, res) => {
    const { title, markdownContent, tags, customDate } = req.body;

    if (!title || !markdownContent || !tags || !Array.isArray(tags) || tags.length === 0) {
        return res.status(400).json({ error: 'Недостаточно данных для создания новости.' });
    }

    const timestamp = customDate ? new Date(customDate).getTime() : Date.now();
    const date = new Date(timestamp);
    const formattedDate = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

    const newPost = {
        id: 'news-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 9),
        date: formattedDate,
        timestamp: timestamp,
        tags,
        title,
        content: markdownContent,
    };

    try {
        await db.run(
            'INSERT INTO news (id, timestamp, date, title, content, tags) VALUES (?, ?, ?, ?, ?, ?)',
            [newPost.id, newPost.timestamp, newPost.date, newPost.title, newPost.content, JSON.stringify(newPost.tags)]
        );
        res.status(201).json({ success: true, message: 'Новость успешно добавлена', post: newPost });
    } catch (error) {
        console.error('Error creating news post in DB:', error);
        res.status(500).json({ error: 'Database error while creating news.' });
    }
});

app.put('/api/news/:id', adminCheckMiddleware, async (req, res) => {
    const { id } = req.params;
    const { title, markdownContent, tags, customDate } = req.body;

    if (!title || !markdownContent || !tags || !Array.isArray(tags) || tags.length === 0) {
        return res.status(400).json({ error: 'Недостаточно данных для обновления новости.' });
    }
    
    try {
        const existingPost = await db.get('SELECT * FROM news WHERE id = ?', [id]);
        if (!existingPost) {
            return res.status(404).json({ error: 'Новость не найдена' });
        }
        
        const timestamp = customDate ? new Date(customDate).getTime() : new Date(existingPost.timestamp).getTime();
        const date = new Date(timestamp);
        const formattedDate = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

        const updatedPost = {
            id,
            title,
            content: markdownContent,
            tags,
            timestamp,
            date: formattedDate,
        };

        const result = await db.run(
            'UPDATE news SET title = ?, content = ?, tags = ?, timestamp = ?, date = ? WHERE id = ?',
            [updatedPost.title, updatedPost.content, JSON.stringify(updatedPost.tags), updatedPost.timestamp, updatedPost.date, id]
        );

        if (result.changes === 0) {
             return res.status(404).json({ error: 'Новость не найдена для обновления.' });
        }

        res.json({ success: true, message: 'Новость обновлена', post: updatedPost });

    } catch (error) {
        console.error(`Error updating news post ${id} in DB:`, error);
        res.status(500).json({ error: 'Database error while updating news.' });
    }
});

app.delete('/api/news/:id', adminCheckMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.run('DELETE FROM news WHERE id = ?', [id]);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Новость не найдена' });
        }

        res.json({ success: true, message: 'Новость удалена' });
    } catch (error) {
        console.error(`Error deleting news post ${id} from DB:`, error);
        res.status(500).json({ error: 'Database error while deleting news.' });
    }
});

// =================================================================
// --- DISCORD DATA & FALLBACKS ---
// =================================================================

app.get('/api/user', (req, res) => {
    if (req.session.user) {
        res.json(req.session.user);
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

app.get('/api/servers', async (req, res) => {
    if (!req.session.user || !req.session.user.accessToken) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    try {
        const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
            headers: { authorization: `Bearer ${req.session.user.accessToken}` }
        });
        const userGuilds = await guildsResponse.json();

        if (!Array.isArray(userGuilds)) {
             if (userGuilds.message && userGuilds.message.includes("401")) {
                // Token has expired or is invalid, clear session
                req.session.destroy();
                return res.status(401).json({ error: 'Invalid session, please log in again.' });
            }
            throw new Error('Failed to fetch user guilds from Discord.');
        }

        const botGuilds = await client.guilds.fetch();
        const botGuildIds = new Set(botGuilds.map(g => g.id));

        const managed = [];
        const available = [];

        userGuilds.forEach(guild => {
            const permissions = new PermissionsBitField(BigInt(guild.permissions));
            if (permissions.has(PermissionsBitField.Flags.ManageGuild)) {
                if (botGuildIds.has(guild.id)) {
                    managed.push(guild);
                } else {
                    available.push(guild);
                }
            }
        });

        res.json({ managed, available });
    } catch (error) {
        console.error('Error fetching servers:', error.message);
        res.status(500).json({ error: 'Failed to fetch servers from Discord.' });
    }
});


// Fallback route for SPA-like behavior on direct navigation
app.get('*', (req, res) => {
    const filePath = path.join(__dirname, 'public', req.path);
    // Check if the path ends with a file extension
    if (path.extname(req.path).length > 0) {
        // It's a request for a specific file, if it doesn't exist, it's a 404
        res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
    } else {
        // It's a route, try to serve index.html from a matching directory
        res.sendFile(path.join(filePath, 'index.html'), (err) => {
            if (err) {
                res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
            }
        });
    }
});

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});