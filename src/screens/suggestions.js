/**
 * Screen B: Suggestions（2x2グリッドカード）
 * マッチングアプリ風の提案一覧
 */
import { getTopCards } from '../engine/filter.js';
import { renderBottomNav } from './home.js';

const CATEGORY_CONFIG = {
  scenery: {
    label: '自然',
    emoji: '🌿',
    badge: 'badge-scenery',
    btn: 'btn-scenery',
    image: '/images/category_nature.png',
    lines: [
      { icon: '🌳', text: '都市公園：紅葉の散歩道' },
      { icon: '🔭', text: '絶景スポット：丘の上の展望台' },
    ],
  },
  food: {
    label: '食事',
    emoji: '🍽',
    badge: 'badge-food',
    btn: 'btn-food',
    image: '/images/category_food.png',
    lines: [
      { icon: '🍜', text: '地元の味：職人のこだわりラーメン' },
      { icon: '🍱', text: '隠れた名店：水辺のレストラン' },
    ],
  },
  rest: {
    label: '休憩',
    emoji: '☕',
    badge: 'badge-rest',
    btn: 'btn-rest',
    image: '/images/category_rest.png',
    lines: [
      { icon: '🏠', text: 'カフェテラス：パノラマビュー' },
      { icon: '🏯', text: '天然温泉：山のリトリート' },
    ],
  },
  limited: {
    label: '限定',
    emoji: '📅',
    badge: 'badge-limited',
    btn: 'btn-limited',
    image: '/images/category_limited.png',
    lines: [
      { icon: '🎆', text: '季節のお祭り：桜の夜' },
      { icon: '🏛', text: 'ポップアップ展示：デジタルアート' },
    ],
  },
};

function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 6) return '深夜のおすすめ 🌙';
  if (h < 11) return '朝の散策はいかが？ ☀️';
  if (h < 14) return 'ランチなんてどう？ 🍜';
  if (h < 17) return '午後のひとときを ☕';
  if (h < 20) return '夕方〜夜のおすすめ 🌅';
  return '夜のくつろぎタイム 🌃';
}

export async function renderSuggestions(app, context, settings, onDetail, onBack, onCategory) {
  // ローディング表示
  app.innerHTML = `
    <div class="suggestions-screen" id="suggestions-screen">
      <div class="sug-top-bar">
        <div class="sug-logo">
          <div class="sug-logo-icon">📍</div>
          For you now
        </div>
        <div class="sug-icons">
          <button>🔔</button>
          <button>👤</button>
        </div>
      </div>
      <div class="sug-header">
        <div class="sug-special-badge">✨ あなたへの特別提案</div>
        <h2 class="sug-title">あなたへの提案</h2>
        <p class="sug-subtitle">${getTimeGreeting()}</p>
      </div>
      <div style="display:flex;justify-content:center;align-items:center;min-height:300px;">
        <div class="loading-spinner"></div>
      </div>
      ${renderBottomNav('home')}
    </div>
  `;

  const cards = await getTopCards(context, settings);

  app.innerHTML = `
    <div class="suggestions-screen" id="suggestions-screen">
      <div class="sug-top-bar">
        <div class="sug-logo">
          <div class="sug-logo-icon">📍</div>
          For you now
        </div>
        <div class="sug-icons">
          <button id="sug-back-btn">←</button>
        </div>
      </div>

      <div class="sug-header">
        <div class="sug-special-badge">✨ あなたへの特別提案</div>
        <h2 class="sug-title">あなたへの提案</h2>
        <p class="sug-subtitle">${getTimeGreeting()}</p>
      </div>

      <div class="cards-grid" id="cards-grid">
        ${cards.map((card, i) => renderGridCard(card, i)).join('')}
      </div>

      <div class="sug-footer">
        <p class="sug-footer-text">ご希望のものが見つかりませんか？ 検索条件を調整してみてください。</p>
        <div class="sug-footer-actions">
          <button class="sug-footer-btn" id="back-to-home-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
            </svg>
            条件を変更
          </button>
          <button class="sug-footer-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            履歴を見る
          </button>
        </div>
      </div>

      ${renderBottomNav('home')}
    </div>
  `;

  // イベントバインド
  document.getElementById('sug-back-btn')?.addEventListener('click', onBack);
  document.getElementById('back-to-home-btn')?.addEventListener('click', onBack);

  // グリッドカードのクリック
  document.querySelectorAll('.grid-card').forEach(cardEl => {
    cardEl.addEventListener('click', (e) => {
      if (e.target.closest('.grid-card-btn')) return;
      const id = cardEl.dataset.id;
      const card = cards.find(c => c.id === id);
      if (card) onDetail(card);
    });
  });

  // 「もっと詳しく」ボタン → カテゴリドリルダウン
  document.querySelectorAll('.grid-card-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const category = btn.dataset.category;
      if (onCategory) {
        onCategory(category, context, settings);
      }
    });
  });

  // 入場アニメーション
  requestAnimationFrame(() => {
    document.querySelectorAll('.grid-card').forEach((card, i) => {
      card.style.animationDelay = `${i * 0.1}s`;
      card.classList.add('card-enter');
    });
  });
}

function renderGridCard(card, index) {
  const config = CATEGORY_CONFIG[card.category] || CATEGORY_CONFIG.food;

  // Hotpepperデータがあればそれを使う、なければデフォルトの説明
  const line1Text = card.name !== config.lines[0].text.split('：')[1]
    ? card.name
    : config.lines[0].text;
  const line2Text = card.line2 || config.lines[1].text;

  return `
    <div class="grid-card" data-id="${card.id}" style="animation-delay: ${index * 0.1}s">
      <div class="grid-card-image-wrap">
        <img src="${card.photoUrl || config.image}" alt="${config.label}" 
             onerror="this.src='${config.image}'" />
        <div class="grid-card-badge ${config.badge}">${config.emoji} ${config.label}</div>
      </div>
      <div class="grid-card-body">
        <div class="grid-card-line">
          <span class="grid-card-line-icon">${config.lines[0].icon}</span>
          <span>${line1Text}</span>
        </div>
        <div class="grid-card-line">
          <span class="grid-card-line-icon">${config.lines[1].icon}</span>
          <span>${line2Text}</span>
        </div>
        <button class="grid-card-btn ${config.btn}" data-category="${card.category}">
          もっと詳しく ＞
        </button>
      </div>
    </div>
  `;
}
