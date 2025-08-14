
require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const session = require('express-session');
const path = require('path');
const { Client, GatewayIntentBits, PermissionsBitField, ChannelType } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildMembers] });
client.login(process.env.DISCORD_BOT_TOKEN).then(() => console.log(`Бот ${client.user.tag} успешно залогинен!`)).catch(err => console.error("Ошибка логина бота:", err));

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

        res.redirect('/dashboard.html');

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

app.get('/api/user', (req, res) => {
    if (req.session.user) {
        res.json(req.session.user);
    } else {
        res.status(401).json({ error: 'Пользователь не авторизован' });
    }
});

app.get('/api/servers', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Пользователь не авторизован' });
    try {
        const userGuildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
            headers: { authorization: `Bearer ${req.session.user.accessToken}` },
        });
        const userGuilds = await userGuildsResponse.json();
        if (!Array.isArray(userGuilds)) throw new Error('Не удалось получить список серверов пользователя.');

        const botGuilds = await client.guilds.fetch();
        const botGuildIds = new Set(botGuilds.map(g => g.id));

        const adminUserGuilds = userGuilds.filter(guild => {
            const permissions = new PermissionsBitField(BigInt(guild.permissions));
            return permissions.has(PermissionsBitField.Flags.Administrator);
        });

        const managedServers = [];
        const availableServers = [];

        for (const guild of adminUserGuilds) {
            const iconExt = guild.icon && guild.icon.startsWith('a_') ? 'gif' : 'webp';
            const serverData = {
                id: guild.id,
                name: guild.name,
                icon: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.${iconExt}?size=128` : 'logo.png',
            };
            if (botGuildIds.has(guild.id)) {
                managedServers.push(serverData);
            } else {
                availableServers.push(serverData);
            }
        }
        res.json({ managed: managedServers, available: availableServers });
    } catch (error) {
        console.error("Ошибка получения серверов:", error);
        res.status(500).json({ error: "Не удалось получить список серверов." });
    }
});

app.get('/api/server', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Пользователь не авторизован' });
    }

    const { id: serverId } = req.query;
    if (!serverId) {
        return res.status(400).json({ error: 'ID сервера не указан.' });
    }

    try {
        const userGuildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
            headers: { authorization: `Bearer ${req.session.user.accessToken}` },
        });
        const userGuilds = await userGuildsResponse.json();

        if (!Array.isArray(userGuilds)) {
             return res.status(500).json({ error: 'Не удалось проверить права доступа к серверу.' });
        }

        const targetGuild = userGuilds.find(g => g.id === serverId);
        if (!targetGuild) {
            return res.status(403).json({ error: 'Вы не являетесь участником этого сервера.' });
        }

        const permissions = new PermissionsBitField(BigInt(targetGuild.permissions));
        if (!permissions.has(PermissionsBitField.Flags.Administrator)) {
            return res.status(403).json({ error: 'У вас нет прав администратора на этом сервере.' });
        }

        const guild = await client.guilds.fetch(serverId);
        if (!guild) {
            return res.status(404).json({ error: 'Сервер не найден ботом.' });
        }

        await guild.members.fetch({ withPresences: true });
        const onlineCount = guild.members.cache.filter(m => m.presence && m.presence.status !== 'offline').size;

        const iconExt = guild.icon && guild.icon.startsWith('a_') ? 'gif' : 'webp';

        const channels = guild.channels.cache
            .filter(c => c.type === ChannelType.GuildText)
            .map(c => ({ id: c.id, name: c.name }))
            .sort((a,b) => a.name.localeCompare(b.name));

        const roles = guild.roles.cache
            .filter(r => !r.managed && r.name !== '@everyone')
            .map(r => ({ id: r.id, name: r.name, color: r.hexColor }))
            .sort((a,b) => a.name.localeCompare(b.name));

        // MOCK CONFIG DATA - в реальном приложении это будет из БД
        const mockConfig = {
            prefix: "!",
            modules: {
                "welcome": { enabled: true, channel: channels[0]?.id || null, message: "Добро пожаловать, {user} на наш сервер!" },
                "moderation": { enabled: true, logChannel: channels[1]?.id || null },
                "logging": { enabled: false, eventLogChannel: null },
                "autorole": { enabled: false, roleId: roles[0]?.id || null }
            }
        };

        const serverData = {
            id: guild.id,
            name: guild.name,
            icon: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.${iconExt}?size=128` : 'logo.png',
            members: guild.memberCount,
            onlineCount: onlineCount,
            channels,
            roles,
            config: mockConfig
        };

        res.json(serverData);

    } catch (error) {
        console.error(`Ошибка при получении данных для сервера ${serverId}:`, error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера при получении данных.' });
    }
});


app.post('/api/config', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Пользователь не авторизован.' });
    }

    const { serverId, module, settings } = req.body;
    if (!serverId || !module || !settings) {
        return res.status(400).json({ error: 'Недостаточно данных для обновления конфигурации.' });
    }

    // Здесь должна быть проверка, что пользователь имеет право управлять serverId
    // В реальном приложении, вы бы сохранили `settings` для `module` на `serverId` в вашу базу данных.
    console.log(`[CONFIG UPDATE] User: ${req.session.user.username}, Server: ${serverId}, Module: ${module}, Settings:`, settings);

    // Имитируем успешное сохранение
    res.json({ success: true, message: 'Настройки успешно сохранены' });
});

// =================================================================
// --- ОТДАЧА HTML СТРАНИЦ ---
// =================================================================

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/news.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'news.html')));
app.get('/team.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'team.html')));
app.get('/docs.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'docs.html')));
app.get('/dashboard.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/manage.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'manage.html')));
app.get('/terms.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'terms.html')));
app.get('/privacy.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'privacy.html')));

// =================================================================
// --- ОБРАБОТЧИК 404 ---
// =================================================================

// Этот обработчик должен быть последним, после всех остальных роутов
app.use((req, res, next) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});


// --- ЗАПУСК СЕРВЕРА ---
app.listen(port, () => {
    console.log(`Сервер Vlesnix Guard запущен на http://localhost:${port}`);
});
