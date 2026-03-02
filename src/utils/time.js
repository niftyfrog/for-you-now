/**
 * Time utilities - 時間帯判定
 */

/**
 * 現在の時間帯を判定
 * @param {Date} now
 * @returns {'morning'|'lunch'|'cafe'|'dinner'|'latenight'}
 */
export function getMealPeriod(now) {
    const h = now.getHours();
    if (h >= 6 && h < 11) return 'morning';
    if (h >= 11 && h < 14) return 'lunch';
    if (h >= 14 && h < 17) return 'cafe';
    if (h >= 17 && h < 22) return 'dinner';
    return 'latenight';
}

/**
 * 日没との関係を判定
 * @param {Date} now
 * @param {Date} sunsetTime - 日没時刻
 * @returns {'before_sunset'|'golden_hour'|'after_sunset'|'night'}
 */
export function getSunsetPhase(now, sunsetTime) {
    if (!sunsetTime) return 'unknown';

    const diffMinutes = (sunsetTime - now) / (1000 * 60);

    if (diffMinutes > 40) return 'before_sunset'; // 日没40分以上前
    if (diffMinutes > -15) return 'golden_hour';  // 日没40分前〜日没15分後
    if (diffMinutes > -30) return 'after_sunset';  // 日没15〜30分後
    return 'night'; // 日没30分以降
}

/**
 * 今日の日付文字列を返す (YYYY-MM-DD)
 * @param {Date} now
 * @returns {string}
 */
export function todayString(now) {
    return now.toISOString().slice(0, 10);
}

/**
 * HH:MM形式の時刻を今日のDateオブジェクトに変換
 * @param {string} timeStr
 * @param {Date} now
 * @returns {Date}
 */
export function parseTimeToday(timeStr, now) {
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date(now);
    d.setHours(h, m, 0, 0);
    return d;
}

/**
 * 営業中かどうか判定
 * @param {Object} openHours - { open: "HH:MM", close: "HH:MM" }
 * @param {Date} now
 * @returns {boolean}
 */
export function isOpenNow(openHours, now) {
    if (!openHours) return true; // 不明な場合はtrueとする

    const openTime = parseTimeToday(openHours.open, now);
    let closeTime = parseTimeToday(openHours.close, now);

    // 深夜営業対応（例: close="28:00" → 翌日4:00）
    const closeHour = parseInt(openHours.close.split(':')[0]);
    if (closeHour >= 24) {
        closeTime = parseTimeToday(`${closeHour - 24}:${openHours.close.split(':')[1]}`, now);
        closeTime.setDate(closeTime.getDate() + 1);
    }

    // closeがopenより前なら翌日扱い
    if (closeTime <= openTime) {
        closeTime.setDate(closeTime.getDate() + 1);
    }

    return now >= openTime && now <= closeTime;
}

/**
 * 閉店間近かどうか（30分以内）
 * @param {Object} openHours
 * @param {Date} now
 * @returns {boolean}
 */
export function isClosingSoon(openHours, now) {
    if (!openHours) return false;

    let closeTime = parseTimeToday(openHours.close, now);
    const closeHour = parseInt(openHours.close.split(':')[0]);
    if (closeHour >= 24) {
        closeTime = parseTimeToday(`${closeHour - 24}:${openHours.close.split(':')[1]}`, now);
        closeTime.setDate(closeTime.getDate() + 1);
    }

    const diff = (closeTime - now) / (1000 * 60);
    return diff > 0 && diff <= 30;
}
