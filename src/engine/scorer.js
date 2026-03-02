/**
 * Scorer - 文脈ベースのスコアリング
 * ランダムではなく、必ず"文脈の理由"がある
 */
import { calcDistance, walkMinutes, transitMinutes } from '../utils/geo.js';
import { getMealPeriod, getSunsetPhase, isOpenNow, isClosingSoon, todayString } from '../utils/time.js';

/**
 * スポットにスコアを付与
 * @param {Object} spot - スポットデータ
 * @param {Object} context - { now, location, weather, sunsetTime }
 * @param {Object} settings - { transport: 'walk'|'transit', maxDistance: number }
 * @returns {Object} - { ...spot, score, reason, invite, travelInfo }
 */
export function scoreSpot(spot, context, settings = {}) {
    const { now, location, weather, sunsetTime } = context;
    const { transport = 'walk', maxDistance = 30 } = settings;

    let score = 10; // ベーススコア
    let reasonKey = 'default';
    let inviteKey = 'default';
    let travelInfo = '';

    // === 距離スコア ===
    let distance = null;
    if (location && spot.lat && spot.lng) {
        distance = calcDistance(location.lat, location.lng, spot.lat, spot.lng);

        // 距離上限チェック
        if (distance > maxDistance) {
            score -= 100; // 範囲外は大幅減点
        }

        // 近いほど高スコア（0〜5点）
        const proximityScore = Math.max(0, 5 - distance * 2);
        score += proximityScore;

        // リアル距離から移動時間を計算
        const walkMins = walkMinutes(distance);
        const transitMins = transitMinutes(distance);
        ({ travelInfo, inviteKey } = formatSmartTravel(walkMins, transitMins, transport));
    } else {
        // 距離不明の場合はデフォルト値を使用
        if (spot.travelTime) {
            const walkMins = spot.travelTime.walk;
            const transitMins = spot.travelTime.transit;
            ({ travelInfo, inviteKey } = formatSmartTravel(walkMins, transitMins, transport));
        }
    }

    // === 営業中スコア ===
    if (isOpenNow(spot.openHours, now)) {
        score += 2;
        if (isClosingSoon(spot.openHours, now)) {
            score -= 2; // 閉店間近は減点
        }
    } else {
        score -= 10; // 営業時間外は大幅減点
    }

    // === カテゴリ別の文脈マッチスコア ===
    const weatherStr = weather?.weather || null;
    const sunsetPhase = getSunsetPhase(now, sunsetTime);
    const mealPeriod = getMealPeriod(now);

    switch (spot.category) {
        case 'scenery':
            score += scoreScenery(spot, sunsetPhase, weatherStr);
            reasonKey = getSceneryReasonKey(sunsetPhase, weatherStr);
            break;
        case 'food':
            score += scoreFood(spot, mealPeriod);
            reasonKey = mealPeriod;
            break;
        case 'rest':
            score += scoreRest(spot, weatherStr, now);
            reasonKey = getRestReasonKey(weatherStr, now);
            break;
        case 'limited':
            score += scoreLimited(spot, now);
            reasonKey = getLimitedReasonKey(spot, now);
            break;
    }

    // === 理由テキストの決定 ===
    const reason = spot.reasonTemplates?.[reasonKey] || spot.reasonTemplates?.default || '';
    const invite = spot.inviteTemplates?.[inviteKey] || spot.inviteTemplates?.default || '';

    return {
        ...spot,
        score,
        reason,
        invite,
        travelInfo,
        distance,
    };
}

// --- カテゴリ別スコアリング ---

function scoreScenery(spot, sunsetPhase, weather) {
    let bonus = 0;

    if (sunsetPhase === 'golden_hour') {
        // 夕焼けスポット優先
        if (spot.tags?.includes('夕焼け') || spot.tags?.includes('展望台')) bonus += 3;
    } else if (sunsetPhase === 'night') {
        // 夜景スポット優先
        if (spot.tags?.includes('夜景')) bonus += 3;
    }

    if (weather === 'rainy') {
        // 雨なら屋内系優先
        if (spot.indoorOutdoor === 'indoor' || spot.tags?.includes('雨OK')) {
            bonus += 2;
        } else {
            bonus -= 3;
        }
    }

    return bonus;
}

function getSceneryReasonKey(sunsetPhase, weather) {
    if (weather === 'rainy') return 'rain';
    if (sunsetPhase === 'golden_hour') return 'sunset';
    if (sunsetPhase === 'night' || sunsetPhase === 'after_sunset') return 'night';
    return 'default';
}

function scoreFood(spot, mealPeriod) {
    let bonus = 0;
    if (spot.mealType?.includes(mealPeriod)) {
        bonus += 2;
    }
    // カフェタイムにカフェ系スポットはさらにボーナス
    if (mealPeriod === 'cafe' && spot.tags?.includes('カフェ')) {
        bonus += 1;
    }
    return bonus;
}

function scoreRest(spot, weather, now) {
    let bonus = 0;
    const hour = now.getHours();

    // 雨/寒い/夜遅い → 屋内比率UP
    if (weather === 'rainy' || weather === 'snowy') {
        if (spot.indoorOutdoor === 'indoor') bonus += 2;
        else bonus -= 2;
    }

    if (hour >= 22 || hour < 6) {
        if (spot.indoorOutdoor === 'indoor') bonus += 1;
    }

    return bonus;
}

function getRestReasonKey(weather, now) {
    if (weather === 'rainy' || weather === 'snowy') return 'rain';
    const hour = now.getHours();
    if (hour >= 22 || hour < 6) return 'night';
    return 'default';
}

function scoreLimited(spot, now) {
    let bonus = 0;
    const today = todayString(now);

    if (spot.endDate === today) {
        bonus += 5; // 今日が最終日！（最高優先度）
    } else if (spot.startDate === today) {
        bonus += 3; // 今日から開始
    } else if (spot.endDate && spot.startDate) {
        // 開催中のイベント
        if (today >= spot.startDate && today <= spot.endDate) {
            bonus += 2;
        } else {
            bonus -= 5; // 開催期間外
        }
    }

    return bonus;
}

function getLimitedReasonKey(spot, now) {
    const today = todayString(now);
    if (spot.endDate === today) return 'limited_today';
    if (spot.startDate === today) return 'limited_start';
    if (spot.endDate && spot.startDate && today >= spot.startDate && today <= spot.endDate) {
        return 'limited_ongoing';
    }
    return 'default';
}

/**
 * 移動時間をスマートにフォーマット
 * - 徒歩60分以上 → 自動的に電車に切替
 * - 電車120分以上 → 「近くまで移動」表示
 * @param {number} walkMins - 徒歩分数
 * @param {number} transitMins - 電車分数
 * @param {string} transport - 'walk'|'transit'
 * @returns {{ travelInfo: string, inviteKey: string }}
 */
function formatSmartTravel(walkMins, transitMins, transport) {
    let travelInfo = '';
    let inviteKey = 'default';

    if (transport === 'walk') {
        if (walkMins <= 60) {
            travelInfo = `徒歩${walkMins}分`;
            inviteKey = walkMins <= 10 ? 'short' : 'medium';
        } else if (transitMins && transitMins <= 120) {
            // 徒歩は遠すぎるので電車に自動切替
            travelInfo = `電車${transitMins}分`;
            inviteKey = transitMins <= 10 ? 'short' : 'medium';
        } else {
            travelInfo = '近くまで移動';
            inviteKey = 'medium';
        }
    } else {
        if (transitMins && transitMins <= 120) {
            travelInfo = `電車${transitMins}分`;
            inviteKey = transitMins <= 10 ? 'short' : 'medium';
        } else {
            travelInfo = '近くまで移動';
            inviteKey = 'medium';
        }
    }

    return { travelInfo, inviteKey };
}
