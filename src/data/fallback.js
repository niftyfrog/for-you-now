/**
 * Fallback - 候補が足りない場合のテンプレートデータ
 * 雨/夜/田舎でも最低4枚出力を保証する
 */

const fallbackTemplates = {
    scenery: [
        {
            id: 'fallback-scenery-1',
            name: '近くの公園を散歩',
            category: 'scenery',
            subcategory: '散歩',
            lat: null,
            lng: null,
            address: '周辺の公園',
            openHours: { open: '00:00', close: '23:59' },
            budgetRange: '無料',
            tags: ['散歩', '無料', '公園'],
            indoorOutdoor: 'outdoor',
            sourceUrl: null,
            travelTime: { walk: 5, transit: 2 },
            reasonTemplates: {
                sunset: '夕焼けを見られる公園が近くにあるかも。',
                night: '夜の散歩もたまにはいい。',
                rain: '雨上がりの空気は格別。',
                default: 'ちょっと外の空気を吸おう。'
            },
            inviteTemplates: {
                short: '5分だけ外に出てみる？',
                medium: '近くを少し歩いてみる？',
                default: '散歩、意外と気持ちいい。'
            }
        }
    ],
    food: [
        {
            id: 'fallback-food-1',
            name: '近くの人気店を探す',
            category: 'food',
            subcategory: '飲食',
            lat: null,
            lng: null,
            address: '周辺のお店',
            openHours: { open: '10:00', close: '22:00' },
            budgetRange: '〜2000円',
            tags: ['ご飯', '近場'],
            indoorOutdoor: 'indoor',
            sourceUrl: null,
            travelTime: { walk: 5, transit: 2 },
            mealType: ['lunch', 'dinner', 'cafe'],
            reasonTemplates: {
                lunch: 'お腹空いてない？',
                dinner: '夜ご飯、近場で探そう。',
                cafe: 'カフェでも探してみる？',
                default: '近くのお店、意外と知らないかも。'
            },
            inviteTemplates: {
                short: 'サクッと食べる？',
                medium: 'ゆっくりご飯にする？',
                default: '何か食べに行こう。'
            }
        }
    ],
    rest: [
        {
            id: 'fallback-rest-1',
            name: '近くのカフェで一休み',
            category: 'rest',
            subcategory: 'カフェ',
            lat: null,
            lng: null,
            address: '周辺のカフェ',
            openHours: { open: '08:00', close: '22:00' },
            budgetRange: '〜1000円',
            tags: ['カフェ', '休憩', '屋内', '雨OK'],
            indoorOutdoor: 'indoor',
            sourceUrl: null,
            travelTime: { walk: 5, transit: 2 },
            reasonTemplates: {
                rain: '雨の日は屋内で。',
                night: '夜でも入れるカフェ探そう。',
                cold: '暖かい飲み物で一息。',
                default: 'ちょっと座って休もう。'
            },
            inviteTemplates: {
                short: '5分だけ腰かける？',
                medium: 'コーヒーでも飲む？',
                default: '休憩、大事。'
            }
        }
    ],
    limited: [
        {
            id: 'fallback-limited-1',
            name: '近場の鉄板スポット',
            category: 'limited',
            subcategory: 'おすすめ',
            lat: null,
            lng: null,
            address: '周辺のスポット',
            openHours: { open: '10:00', close: '20:00' },
            budgetRange: '〜1000円',
            tags: ['おすすめ', '定番'],
            indoorOutdoor: 'indoor',
            sourceUrl: null,
            travelTime: { walk: 10, transit: 5 },
            reasonTemplates: {
                default: 'ハズさない定番スポット。'
            },
            inviteTemplates: {
                short: 'ちょっと覗いてみる？',
                medium: '定番だけど行ってみる？',
                default: '迷ったらここ。'
            }
        }
    ]
};

/**
 * フォールバックスポットを取得
 * @param {string} category
 * @returns {Array}
 */
export function getFallbackSpots(category) {
    return fallbackTemplates[category] || fallbackTemplates.rest;
}
