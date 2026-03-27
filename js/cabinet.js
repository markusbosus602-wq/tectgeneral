// js/cabinet.js
// ================================================
// МОЯ СКРИНЬКА - ЛОГІКА
// ================================================

function loadCabinet() {
  if (!user) return;

  // Особиста інформація
  document.getElementById('cabNick').innerText = user.name;
  document.getElementById('cabMoney').innerText = (user.points || 0).toLocaleString();
  
  // Рівень гравця
  const level = calculateLevel();
  document.getElementById('cabLevel').innerText = level.name;
  document.getElementById('levelBadge').innerHTML = level.badge;
  
  // Дата реєстрації
  if (!user.regDate) {
    user.regDate = new Date().toISOString().split('T')[0];
    save();
  }
  document.getElementById('regDate').innerHTML = user.regDate;
  
  // Статистика
  const stats = calculateStats();
  document.getElementById('totalThemes').innerText = stats.totalThemes;
  document.getElementById('correctAnswers').innerText = stats.totalCorrect;
  document.getElementById('wrongAnswers').innerText = stats.totalWrong;
  document.getElementById('avgPercent').innerText = stats.avgPercent + '%';
  document.getElementById('bestResult').innerText = stats.bestResult + '%';
  document.getElementById('perfectCount').innerText = stats.perfectCount;
  
  // Досягнення
  loadBadges(stats);
  
  // Мої покупки
  updatePurchasesDisplay();
  
  // Історія проходження
  loadHistory();
}

// Розрахунок рівня
function calculateLevel() {
  const totalCorrect = calculateStats().totalCorrect;
  
  if (totalCorrect < 50) {
    return { name: 'Новачок', badge: '🌱', level: 1 };
  } else if (totalCorrect < 200) {
    return { name: 'Досвідчений', badge: '📚', level: 2 };
  } else if (totalCorrect < 500) {
    return { name: 'Майстер', badge: '🏅', level: 3 };
  } else if (totalCorrect < 1000) {
    return { name: 'Експерт', badge: '🎓', level: 4 };
  } else {
    return { name: 'Грандмайстер', badge: '👑', level: 5 };
  }
}

// Розрахунок статистики
function calculateStats() {
  let totalCorrect = 0;
  let totalWrong = 0;
  let totalThemes = 0;
  let perfectCount = 0;
  let bestResult = 0;

  if (user.themeResults) {
    for (let theme in user.themeResults) {
      const result = user.themeResults[theme];
      totalCorrect += result.correct || 0;
      totalWrong += (result.total || result.correct) - (result.correct || 0);
      totalThemes++;
      
      if (result.percent === 100) perfectCount++;
      if (result.percent > bestResult) bestResult = result.percent;
    }
  }
  
  const avgPercent = totalCorrect + totalWrong > 0 
    ? Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100) 
    : 0;
  
  return {
    totalThemes,
    totalCorrect,
    totalWrong,
    avgPercent,
    bestResult,
    perfectCount
  };
}

// Завантаження досягнень
function loadBadges(stats) {
  const badgesContainer = document.getElementById('badgesContainer');
  const badges = [];
  
  badges.push({ name: '🌱 Новачок', unlocked: stats.totalThemes >= 1 });
  badges.push({ name: '📚 Досвідчений', unlocked: stats.totalThemes >= 10 });
  badges.push({ name: '🏅 Майстер', unlocked: stats.totalThemes >= 30 });
  badges.push({ name: '⭐ Перфекціоніст', unlocked: stats.perfectCount >= 10 });
  badges.push({ name: '🏃 Марафонець', unlocked: stats.totalThemes >= 50 });
  badges.push({ name: '💰 Багатій', unlocked: (user.points || 0) >= 10000 });
  
  if (items && items.vip) {
    badges.push({ name: '💎 VIP', unlocked: true });
  }
  
  badgesContainer.innerHTML = badges.map(b => 
    `<div class="badge ${b.unlocked ? '' : 'locked'}">${b.name}</div>`
  ).join('');
}

// Оновлення відображення покупок
function updatePurchasesDisplay() {
  document.getElementById('purchaseGold').innerHTML = items.gold_frame ? '✅ Куплено' : '❌';
  document.getElementById('purchaseCrown').innerHTML = items.crown ? '✅ Куплено' : '❌';
  document.getElementById('purchaseFire').innerHTML = items.fire ? '✅ Куплено' : '❌';
  document.getElementById('purchaseShield').innerHTML = items.shield ? '✅ Куплено' : '❌';
  document.getElementById('purchaseVip').innerHTML = items.vip ? '✅ Куплено' : '❌';
}

// Завантаження історії проходження
function loadHistory() {
  const historyContainer = document.getElementById('historyList');
  
  if (!user.themeResults || Object.keys(user.themeResults).length === 0) {
    historyContainer.innerHTML = '<div class="history-empty">Ще немає пройдених тем</div>';
    return;
  }
  
  const recent = Object.entries(user.themeResults)
    .sort((a, b) => new Date(b[1].date) - new Date(a[1].date))
    .slice(0, 15);
  
  historyContainer.innerHTML = recent.map(([theme, data]) => `
    <div class="history-item">
      <span>${getThemeName(theme)}</span>
      <span class="history-percent">${data.percent}%</span>
      <span style="font-size:0.7rem; color:#888">${data.date || '—'}</span>
    </div>
  `).join('');
}

// Отримання назви теми
function getThemeName(themeKey) {
  const themeNames = {
    vydminy: 'Відміни іменників',
    orudnyi_1vidmina: 'Орудний відмінок 1 відміни',
    prykmetnyky: 'Прикметники',
    grupy_prykmetnykiv: 'Групи прикметників',
    prykmetnyky_stupeni: 'Ступені порівняння',
    prykmetnyky_stupeni_2: 'Ступені порівняння 2',
    ne_z_prykmetnykamy: 'НЕ з прикметниками',
    chyslivnyky_1: 'Числівники №1',
    chyslivnyky_2: 'Числівники №2',
    frazeologizmy1: 'Фразеологізми 1',
    frazeologizmy2: 'Фразеологізми 2',
    frazeologizmy3: 'Фразеологізми 3',
    frazeologizmy4: 'Фразеологізми 4',
    frazeologizmy5: 'Фразеологізми 5',
    frazeologizmy6: 'Фразеологізми 6',
    frazeologizmy7: 'Фразеологізми 7',
    frazeologizmy8: 'Фразеологізми 8',
    frazeologizmy9: 'Фразеологізми 9',
    frazeologizmy10: 'Фразеологізми 10',
    frazeologizmy11: 'Фразеологізми 11',
    frazeologizmy12: 'Фразеологізми 12',
    frazeologizmy13: 'Фразеологізми 13',
    frazeologizmy14: 'Фразеологізми 14'
  };
  return themeNames[themeKey] || themeKey;
}

// Зміна нікнейму
function editNick() {
  const newNick = prompt('Введіть новий нікнейм:', user.name);
  if (!newNick || newNick === user.name) return;
  
  fetch(DB + "users/" + newNick + ".json")
    .then(r => r.json())
    .then(existing => {
      if (existing && existing.name !== user.name) {
        alert('Цей нікнейм вже зайнятий!');
        return;
      }
      
      const oldNick = user.name;
      const newUser = { ...user, name: newNick };
      
      fetch(DB + "users/" + newNick + ".json", { method: 'PUT', body: JSON.stringify(newUser) })
        .then(() => {
          fetch(DB + "users/" + oldNick + ".json", { method: 'DELETE' })
            .then(() => {
              user = newUser;
              localStorage.setItem('un', newNick);
              update();
              applyItems();
              loadCabinet();
              alert('Нікнейм змінено!');
            });
        });
    });
}

// Зміна пароля
function changePassword() {
  const newPass = prompt('Введіть новий пароль:');
  if (!newPass) return;
  
  user.pass = newPass;
  localStorage.setItem('up', newPass);
  save();
  alert('Пароль змінено!');
}

// Вихід з акаунту
function logout() {
  if (confirm('Ви впевнені, що хочете вийти?')) {
    localStorage.removeItem('un');
    localStorage.removeItem('up');
    user = null;
    show('auth-screen');
  }
}

// Збереження результату теми
function saveThemeResult(theme, correct, total) {
  if (!user.themeResults) user.themeResults = {};
  
  const percent = Math.round((correct / total) * 100);
  const date = new Date().toLocaleString('uk-UA');
  
  user.themeResults[theme] = {
    correct: correct,
    total: total,
    percent: percent,
    date: date
  };
  
  save();
}