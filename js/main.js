// js/main.js
const DB = "https://ukrmova-game-default-rtdb.europe-west1.firebasedatabase.app/";
let user = null;
let cC = 0;
let pOn = true;
let currentTheme = '';
let currentIndex = 0;
let correctCount = 0;
let wrongCount = 0;
let items = { 
  gold_frame: false, crown: false, fire: false, shield: false, vip: false,
  rainbow: false, star: false, diamond: false, halo: false, wings: false
};
let currentCorrectAnswer = '';

const correctSound = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3");
const wrongSound = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.mp3");

window.onload = function() {
  const splash = document.getElementById('splash');
  const startBtn = document.getElementById('startBtn');
  
  // Telegram WebView адаптація
  if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.expand();
    window.Telegram.WebApp.enableClosingConfirmation();
  }
  
  startBtn.onclick = function() {
    splash.style.display = 'none';
    tryAutoLogin();
  };
  
  setTimeout(() => {
    if (splash && splash.style.display !== 'none') {
      splash.style.display = 'none';
      tryAutoLogin();
    }
  }, 5000);
  
  // Додаємо обробники для магазину
  document.querySelectorAll('.shop-item').forEach(item => {
    item.onclick = () => buyItem(item.dataset.item);
  });
};

function tryAutoLogin() {
  const savedNick = localStorage.getItem('un');
  const savedPass = localStorage.getItem('up');
  if (savedNick && savedPass) {
    document.getElementById('nick').value = savedNick;
    document.getElementById('pass').value = savedPass;
    auth();
  } else {
    show('auth-screen');
  }
}

async function auth() {
  let n = document.getElementById('nick').value.trim();
  let p = document.getElementById('pass').value.trim();
  if(!n || !p) {
    document.getElementById('auth-error').textContent = "Введіть нікнейм та пароль";
    return;
  }
  document.getElementById('auth-error').textContent = "Завантаження...";
  try {
    let r = await fetch(DB + "users/" + n + ".json");
    let d = await r.json();
    if (d) {
      if (d.pass !== p) {
        document.getElementById('auth-error').textContent = "Неправильний пароль!";
        return;
      }
      user = d;
    } else {
      user = {
        name: n, pass: p, points: 0, items: {gold_frame: false, crown: false, fire: false, shield: false, vip: false, rainbow: false, star: false, diamond: false, halo: false, wings: false},
        themeAttempts: {}, themeResults: {},
        regDate: new Date().toISOString().split('T')[0],
        avatar: '👤', avatarType: 'emoji', avatarData: null,
        friends: [], notifications: true
      };
      await fetch(DB + "users/" + n + ".json", {method:'PUT', body:JSON.stringify(user)});
    }
    localStorage.setItem('un', n);
    localStorage.setItem('up', p);
    const now = new Date().toLocaleString('uk-UA',{timeZone:'Europe/Kyiv'});
    await fetch(DB + "user_logs.json", {method:'POST',body:JSON.stringify({game_nick:n, time:now})});
    items = user.items || {gold_frame:false, crown:false, fire:false, shield:false, vip:false, rainbow:false, star:false, diamond:false, halo:false, wings:false};
    if (!user.themeResults) user.themeResults = {};
    if (!user.regDate) user.regDate = new Date().toISOString().split('T')[0];
    if (!user.avatar) user.avatar = '👤';
    if (!user.avatarType) user.avatarType = 'emoji';
    if (!user.friends) user.friends = [];
    if (user.notifications === undefined) user.notifications = true;
    save();
    applyItems();
    update();
    show('menu');
    document.getElementById('auth-error').textContent = "";
  } catch(e) {
    document.getElementById('auth-error').textContent = "Помилка підключення";
    console.error(e);
  }
}

function save() {
  if (!user) return;
  user.items = items;
  fetch(DB + "users/" + user.name + ".json", {method:'PUT', body:JSON.stringify(user)});
}

function update() {
  const monEl = document.getElementById('mon');
  if (monEl && user) monEl.innerText = user.points.toLocaleString();
}

function applyItems() {
  if (!user) return;
  let nickDisplay = user.name;
  
  if(items.rainbow) nickDisplay = `<span class="rainbow-text">${user.name}</span>`;
  else if(items.gold_frame) nickDisplay = `<span class="gold-nick">${user.name}</span>`;
  
  if(items.star) nickDisplay += ' ⭐';
  if(items.diamond) nickDisplay += ' 💎';
  if(items.halo) nickDisplay += ' 😇';
  if(items.wings) nickDisplay += ' 🦋';
  if(items.crown) nickDisplay += ' 👑';
  if(items.fire) nickDisplay += ' 🔥';
  if(items.shield) nickDisplay += ' 🛡️';
  if(items.vip) nickDisplay += ' 💎 VIP';
  
  const nickEl = document.getElementById('playerNick');
  if (nickEl) nickEl.innerHTML = nickDisplay;
}

function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
  const screen = document.getElementById(id);
  if (screen) screen.style.display = 'flex';
  if (id === 'cabinet' && user && typeof loadCabinet === 'function') {
    loadCabinet();
  }
}

function admT() {
  if(++cC >= 5) {
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) adminPanel.style.display = 'block';
    logAdminAccess();
    loadAdminLogs();
    loadUserLog();
    cC = 0;
  }
}

async function logAdminAccess() {
  if (!user) return;
  const now = new Date().toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' });
  await fetch(DB + "admin_logs.json", { method: 'POST', body: JSON.stringify({ nick: user.name, time: now }) });
}

function closeAdm() {
  document.getElementById('admin-panel').style.display = 'none';
  cC = 0;
}

function toggleP() {
  pOn = !pOn;
  const btn = document.getElementById('pen-btn');
  if (btn) {
    btn.innerText = pOn ? "ШТРАФИ: ВКЛ" : "ШТРАФИ: ВИКЛ";
    btn.style.background = pOn ? "var(--red)" : "var(--green)";
  }
}

async function delU() {
  let n = document.getElementById('a-n').value.trim();
  if(!n) return alert("Введіть нікнейм");
  if(confirm(`Видалити ${n}?`)) {
    await fetch(DB+"users/"+n+".json", {method:'DELETE'});
    alert("Видалено");
    loadPlayers();
  }
}

async function edO(add) {
  let n = document.getElementById('a-n').value.trim();
  if(!n) return alert("Введіть ник");
  let amt = prompt(add ? "Скільки додати?" : "Скільки відняти?");
  if(isNaN(amt) || amt <= 0) return alert("Невірна сума");
  amt = parseInt(amt);
  let r = await fetch(DB+"users/"+n+".json"), d = await r.json();
  if(!d) return alert("Гравця не знайдено");
  d.points += add ? amt : -amt;
  d.points = Math.max(0, d.points);
  await fetch(DB+"users/"+n+".json", {method:'PUT', body:JSON.stringify(d)});
  alert("Гроші оновлено");
  loadPlayers();
}

async function loadPlayers() {
  let r = await fetch(DB + "users/.json"), d = await r.json(), list = document.getElementById('player-list');
  list.innerHTML = '';
  if (!d || !Object.keys(d).length) {
    list.innerHTML = '<div style="padding:12px;color:#aaa">Гравців немає</div>';
    return;
  }
  for (let key in d) {
    let u = d[key];
    list.innerHTML += `<div style="padding:8px; border-bottom:1px solid rgba(255,255,255,0.1);"><strong>${u.name || key}</strong><br><small>💰 ${u.points || 0} ₴</small></div>`;
  }
}

async function loadUserLog() {
  try {
    let r = await fetch(DB + "user_logs.json");
    let data = await r.json();
    let logDiv = document.getElementById('user-log');
    logDiv.innerHTML = '';
    if (data) {
      Object.values(data).reverse().slice(0,50).forEach(entry => {
        logDiv.innerHTML += `<div class="log-entry">${entry.time} — <b>${entry.game_nick}</b></div>`;
      });
    } else {
      logDiv.innerHTML = 'Лог порожній';
    }
  } catch (e) {
    document.getElementById('user-log').innerHTML = 'Помилка';
  }
}

async function clearUserLog() {
  if (!confirm("Очистити лог?")) return;
  await fetch(DB + "user_logs.json", {method: 'DELETE'});
  loadUserLog();
}

async function loadAdminLogs() {
  try {
    let r = await fetch(DB + "admin_logs.json");
    let data = await r.json();
    let logDiv = document.getElementById('admin-log');
    logDiv.innerHTML = '';
    if (data) {
      Object.values(data).reverse().forEach(log => {
        logDiv.innerHTML += `<div class="log-entry">${log.time} — <b>${log.nick}</b></div>`;
      });
    } else {
      logDiv.innerHTML = 'Лог порожній';
    }
  } catch (e) {
    document.getElementById('admin-log').innerHTML = 'Помилка';
  }
}

async function clearAdminLogs() {
  if (!confirm("Очистити лог адмінки?")) return;
  await fetch(DB + "admin_logs.json", {method: 'DELETE'});
  loadAdminLogs();
}

function startTheme(theme) {
  currentTheme = theme;
  currentIndex = 0;
  correctCount = 0;
  wrongCount = 0;
  if (!user.themeAttempts) user.themeAttempts = {};
  if (!user.themeAttempts[theme]) user.themeAttempts[theme] = 0;
  show('game');
  loadQuestion();
}

function loadQuestion() {
  const qs = themes[currentTheme];
  if (!qs || currentIndex >= qs.length) {
    const total = correctCount + wrongCount;
    if (typeof saveThemeResult === 'function' && total > 0) {
      saveThemeResult(currentTheme, correctCount, total);
    }
    user.themeAttempts[currentTheme] = (user.themeAttempts[currentTheme] || 0) + 1;
    save();
    document.getElementById('qtext').textContent = "✅ Тема завершена!";
    document.getElementById('feedback').innerHTML = '';
    document.getElementById('abox').innerHTML = `
      <div class="summary">
        ✅ Правильних: ${correctCount}<br>
        ❌ Неправильних: ${wrongCount}<br>
        💰 Баланс: ${user.points.toLocaleString()} ₴
      </div>
      <button class="btn" onclick="show('sections')">📚 Обрати тему</button>
    `;
    return;
  }

  const q = qs[currentIndex];
  currentCorrectAnswer = q.a;
  document.getElementById('qtext').textContent = `${currentIndex+1}/${qs.length}: ${q.q}`;
  document.getElementById('feedback').innerHTML = '';
  const abox = document.getElementById('abox');
  abox.innerHTML = '';

  let answers = [q.a, ...q.w];
  answers.sort(() => Math.random() - 0.5);

  answers.forEach(o => {
    let btn = document.createElement('button');
    btn.className = 'btn';
    btn.innerText = o;
    btn.onclick = () => checkAnswer(o, q.a, btn);
    abox.appendChild(btn);
  });
}

function checkAnswer(selected, correct, button) {
  document.querySelectorAll('#abox .btn').forEach(b => b.disabled = true);
  if (selected === correct) {
    correctCount++;
    user.points += 100;
    button.style.background = '#4caf50';
    document.getElementById('feedback').innerHTML = '<span class="correct">✓ ПРАВИЛЬНО!</span>';
    correctSound.play().catch(()=>{});
  } else {
    wrongCount++;
    user.points = Math.max(0, user.points - 30);
    button.style.background = '#f44336';
    document.getElementById('feedback').innerHTML = '<span class="wrong">✗ НЕПРАВИЛЬНО!</span>';
    wrongSound.play().catch(()=>{});
  }
  document.getElementById('mon').innerText = user.points.toLocaleString();
  save();
  setTimeout(() => {
    currentIndex++;
    loadQuestion();
  }, 1200);
}

async function loadT() {
  show('top');
  let r = await fetch(DB+"users/.json");
  let d = await r.json();
  let l = document.getElementById('tlist');
  l.innerHTML = '';
  if(d) {
    let topPlayers = Object.values(d).sort((a,b)=> (b.points||0) - (a.points||0)).slice(0,100);
    topPlayers.forEach((u,i) => {
      let avatar = u.avatar || '👤';
      let avatarHtml = '';
      if (u.avatarType === 'photo' && u.avatarData) {
        avatarHtml = `<img src="${u.avatarData}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;">`;
      } else {
        avatarHtml = `<span style="font-size:24px;">${avatar}</span>`;
      }
      
      let nameDisplay = u.name;
      const userItems = u.items || {};
      if(userItems.rainbow) nameDisplay = `<span class="rainbow-text">${u.name}</span>`;
      else if(userItems.gold_frame) nameDisplay = `<span class="gold-nick">${u.name}</span>`;
      if(userItems.star) nameDisplay += ' ⭐';
      if(userItems.diamond) nameDisplay += ' 💎';
      if(userItems.halo) nameDisplay += ' 😇';
      if(userItems.wings) nameDisplay += ' 🦋';
      if(userItems.crown) nameDisplay += ' 👑';
      if(userItems.fire) nameDisplay += ' 🔥';
      if(userItems.shield) nameDisplay += ' 🛡️';
      if(userItems.vip) nameDisplay += ' 💎';
      
      l.innerHTML += `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;border-bottom:1px solid rgba(255,255,255,0.1);">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <span style="font-weight:bold;color:var(--gold);width:30px;">${i+1}.</span>
            ${avatarHtml}
            <span>${nameDisplay}</span>
          </div>
          <b style="color:var(--gold);">${u.points||0} ₴</b>
        </div>
      `;
    });
  } else {
    l.innerHTML = '<div style="padding:12px;color:#aaa">Топ порожній</div>';
  }
}

function buyItem(item) {
  const prices = {
    gold_frame: 1000, crown: 2000, fire: 1500, shield: 2500, vip: 5000,
    rainbow: 3000, star: 4000, diamond: 8000, halo: 6000, wings: 7000
  };
  
  if (items[item]) {
    alert("❌ Цей предмет вже куплено!");
    return;
  }
  
  if(user.points >= prices[item]){
    user.points -= prices[item];
    items[item] = true;
    applyItems();
    save();
    update();
    alert(`🎉 Куплено: ${getItemName(item)}!`);
    
    if (typeof updatePurchasesDisplay === 'function') {
      updatePurchasesDisplay();
    }
  } else {
    alert(`💰 Недостатньо грошей! Потрібно ${prices[item]} ₴`);
  }
}

function getItemName(item) {
  const names = {
    gold_frame: 'Золота рамка', crown: 'Корона', fire: 'Полум\'я', shield: 'Щит', vip: 'ВІП',
    rainbow: 'Веселкове ім\'я', star: 'Зірка', diamond: 'Діамант', halo: 'Німб', wings: 'Крила'
  };
  return names[item] || item;
}
