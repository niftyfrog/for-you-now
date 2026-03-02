/**
 * Screen C: Detail（簡易詳細画面）
 * タイトル / 住所 / 営業時間 / 予算感 / Sourceリンク
 */

const CATEGORY_COLORS = {
    scenery: '#FF6B35',
    food: '#E84855',
    rest: '#2EC4B6',
    limited: '#9B5DE5',
};

export function renderDetail(app, card, onBack) {
    const accentColor = CATEGORY_COLORS[card.category] || '#9B5DE5';

    app.innerHTML = `
    <div class="detail-screen" id="detail-screen">
      <div class="detail-header" style="--detail-accent: ${accentColor}">
        <button class="back-button" id="detail-back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div class="detail-badge">${card.emoji} ${card.label}</div>
      </div>

      <div class="detail-hero" style="background: linear-gradient(135deg, ${accentColor}22, ${accentColor}08)">
        <div class="detail-emoji-large">${card.emoji}</div>
        <h1 class="detail-name">${card.name}</h1>
        <p class="detail-subcategory">${card.subcategory || ''}</p>
      </div>

      <div class="detail-template-card">
        <p class="detail-line detail-line-1">${card.line1}</p>
        <p class="detail-line detail-line-2">${card.line2}</p>
        <p class="detail-line detail-line-3">${card.line3}</p>
      </div>

      <div class="detail-info">
        <div class="detail-info-row">
          <span class="detail-info-icon">📍</span>
          <span class="detail-info-text">${card.address || '住所不明'}</span>
        </div>
        ${card.openHours ? `
        <div class="detail-info-row">
          <span class="detail-info-icon">🕐</span>
          <span class="detail-info-text">${card.openHours.open} 〜 ${card.openHours.close}</span>
        </div>
        ` : ''}
        <div class="detail-info-row">
          <span class="detail-info-icon">💰</span>
          <span class="detail-info-text">${card.budgetRange || '不明'}</span>
        </div>
        ${card.travelInfo ? `
        <div class="detail-info-row">
          <span class="detail-info-icon">🚶</span>
          <span class="detail-info-text">${card.travelInfo}</span>
        </div>
        ` : ''}
        ${card.tags?.length ? `
        <div class="detail-tags">
          ${card.tags.map(t => `<span class="detail-tag">${t}</span>`).join('')}
        </div>
        ` : ''}
      </div>

      <div class="detail-actions">
        ${card.lat && card.lng ? `
        <a class="detail-action-btn primary" href="https://www.google.com/maps/search/?api=1&query=${card.lat},${card.lng}" target="_blank" rel="noopener">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          Google Mapで開く
        </a>
        ` : ''}
        ${card.sourceUrl ? `
        <a class="detail-action-btn secondary" href="${card.sourceUrl}" target="_blank" rel="noopener">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          公式サイト
        </a>
        ` : ''}
      </div>
    </div>
  `;

    document.getElementById('detail-back').addEventListener('click', onBack);

    // 入場アニメーション
    requestAnimationFrame(() => {
        document.getElementById('detail-screen').classList.add('detail-enter');
    });
}
