/**
 * Filter - カテゴリ別フィルタリングとカード選出
 */
import { dataProvider } from '../data/provider.js';
import { getFallbackSpots } from '../data/fallback.js';
import { scoreSpot } from './scorer.js';

const CATEGORY_EMOJI = {
    scenery: '🌇',
    food: '🍜',
    rest: '🌳',
    limited: '✨',
};

const CATEGORY_LABEL = {
    scenery: '景色',
    food: 'ご飯',
    rest: '休憩',
    limited: '限定',
};

/**
 * 4枚カードを生成（各カテゴリからスコア上位1件ずつ）
 * @param {Object} context - 文脈情報
 * @param {Object} settings - ユーザー設定
 * @returns {Array} 4枚のカードデータ
 */
export function getTopCards(context, settings) {
    const categories = ['scenery', 'food', 'rest', 'limited'];
    const cards = [];

    for (const category of categories) {
        const top = getTopForCategory(category, context, settings, 1);
        if (top.length > 0) {
            cards.push(formatCard(top[0], category));
        } else {
            // フォールバック: 候補なしの場合
            const fallback = getFallbackSpots(category);
            if (fallback.length > 0) {
                const scored = scoreSpot(fallback[0], context, settings);
                cards.push(formatCard(scored, category));
            }
        }
    }

    return cards;
}

/**
 * カテゴリの上位N件を取得
 * @param {string} category
 * @param {Object} context
 * @param {Object} settings
 * @param {number} count
 * @returns {Array}
 */
export function getTopForCategory(category, context, settings, count = 1) {
    let candidates = dataProvider.getCandidates(category);

    // スコア計算
    const scored = candidates.map(spot => scoreSpot(spot, context, settings));

    // スコア降順ソート
    scored.sort((a, b) => b.score - a.score);

    // 営業時間外・距離超過を除外
    const viable = scored.filter(s => s.score > -50);

    // 近くに候補がない場合は空配列を返す（呼び出し元でフォールバックが使われる）
    if (viable.length === 0) {
        return [];
    }

    return viable.slice(0, count);
}

/**
 * 「もっとこの系統」で追加候補を取得
 * @param {string} category
 * @param {string} excludeId - 現在表示中のスポットID
 * @param {Object} context
 * @param {Object} settings
 * @returns {Array} 追加5件のカードデータ
 */
export function getMoreCards(category, excludeId, context, settings) {
    let candidates = dataProvider.getCandidates(category);

    // 既に表示中のものを除外
    candidates = candidates.filter(s => s.id !== excludeId);

    // スコア計算
    const scored = candidates.map(spot => scoreSpot(spot, context, settings));
    scored.sort((a, b) => b.score - a.score);

    // 距離超過のスポットを除外
    const viable = scored.filter(s => s.score > -50);

    // 上位5件を返す
    const topScored = viable.slice(0, 5);
    return topScored.map(s => formatCard(s, category));
}

/**
 * カードデータをフォーマット（3行テンプレ）
 * @param {Object} scoredSpot
 * @param {string} category
 * @returns {Object}
 */
function formatCard(scoredSpot, category) {
    const emoji = CATEGORY_EMOJI[category];
    const label = CATEGORY_LABEL[category];

    // 3行テンプレ
    const line1 = `${emoji} ${scoredSpot.travelInfo || '近く'}`;
    const line2 = scoredSpot.reason || '今がチャンス。';
    const line3 = scoredSpot.invite || '行ってみる？';

    return {
        id: scoredSpot.id,
        name: scoredSpot.name,
        category,
        label,
        emoji,
        line1,
        line2,
        line3,
        address: scoredSpot.address,
        budgetRange: scoredSpot.budgetRange,
        openHours: scoredSpot.openHours,
        sourceUrl: scoredSpot.sourceUrl,
        lat: scoredSpot.lat,
        lng: scoredSpot.lng,
        score: scoredSpot.score,
        subcategory: scoredSpot.subcategory,
        tags: scoredSpot.tags,
        travelInfo: scoredSpot.travelInfo,
    };
}
