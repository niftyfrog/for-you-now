/**
 * Geo utilities - 距離計算
 */

/**
 * 2地点間の距離を計算（Haversine公式、km単位）
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {number} 距離（km）
 */
export function calcDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // 地球の半径 (km)
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg) {
    return deg * (Math.PI / 180);
}

/**
 * 距離からおおよその徒歩時間を算出（分）
 * @param {number} distKm 距離(km)
 * @returns {number} 分
 */
export function walkMinutes(distKm) {
    return Math.round(distKm / 0.08); // 約80m/分
}

/**
 * 距離からおおよその公共交通時間を算出（分）
 * @param {number} distKm 距離(km)
 * @returns {number} 分
 */
export function transitMinutes(distKm) {
    return Math.max(3, Math.round(distKm / 0.5)); // 約30km/h想定
}

/**
 * 距離を人間が読めるフォーマットに
 * @param {number} distKm
 * @returns {string}
 */
export function formatDistance(distKm) {
    if (distKm < 1) {
        return `${Math.round(distKm * 1000)}m`;
    }
    return `${distKm.toFixed(1)}km`;
}
