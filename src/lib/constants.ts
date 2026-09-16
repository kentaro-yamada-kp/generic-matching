/**
 * アプリケーション共通の定数・選択肢定義
 */

/**
 * 日本の都道府県一覧（47都道府県）
 */
export const PREFECTURES = [
  "北海道",
  "青森県",
  "岩手県",
  "宮城県",
  "秋田県",
  "山形県",
  "福島県",
  "茨城県",
  "栃木県",
  "群馬県",
  "埼玉県",
  "千葉県",
  "東京都",
  "神奈川県",
  "新潟県",
  "富山県",
  "石川県",
  "福井県",
  "山梨県",
  "長野県",
  "岐阜県",
  "静岡県",
  "愛知県",
  "三重県",
  "滋賀県",
  "京都府",
  "大阪府",
  "兵庫県",
  "奈良県",
  "和歌山県",
  "鳥取県",
  "島根県",
  "岡山県",
  "広島県",
  "山口県",
  "徳島県",
  "香川県",
  "愛媛県",
  "高知県",
  "福岡県",
  "佐賀県",
  "長崎県",
  "熊本県",
  "大分県",
  "宮崎県",
  "鹿児島県",
  "沖縄県",
  "海外 / その他",
] as const;

export type Prefecture = (typeof PREFECTURES)[number];

/**
 * 性別の選択肢
 */
export const GENDER_OPTIONS = [
  { value: "male", label: "男性" },
  { value: "female", label: "女性" },
  { value: "other", label: "その他" },
  { value: "prefer_not_to_say", label: "回答しない" },
] as const;

/**
 * メインカテゴリの選択肢
 */
export const CATEGORY_OPTIONS = [
  { value: "fps", label: "FPS / TPS (Apex, Valorant等)" },
  { value: "moba", label: "MOBA (LoL, Unite等)" },
  { value: "fighting", label: "格闘ゲーム (スト6, 鉄拳等)" },
  { value: "rpg", label: "RPG / MMO (FF14, 原神等)" },
  { value: "party", label: "パーティー / アクション (マリカ, スマブラ等)" },
  { value: "chat", label: "雑談・交流・作業通話" },
  { value: "creative", label: "クリエイティブ (イラスト, 音楽, 開発等)" },
  { value: "hobby", label: "趣味・アウトドア・スポーツ" },
  { value: "other", label: "その他" },
] as const;

/**
 * 利用目的の選択肢
 */
export const PURPOSE_OPTIONS = [
  { value: "friends", label: "友達・固定仲間募集" },
  { value: "casual", label: "カジュアル・エンジョイプレイ" },
  { value: "ranked", label: "ランクマッチ・ガチ対戦" },
  { value: "chat_only", label: "作業・雑談・VC交流" },
  { value: "beginner_help", label: "初心者歓迎 / 指導・教え合い" },
  { value: "event", label: "イベント・大会参加" },
] as const;

/**
 * アバター用プリセット画像一覧（開発・テスト用）
 */
export const DEFAULT_AVATARS = [
  { label: "ブルーアバター", url: "https://api.dicebear.com/7.x/bottts/svg?seed=BlueHero" },
  { label: "グリーンアバター", url: "https://api.dicebear.com/7.x/bottts/svg?seed=GreenGamer" },
  { label: "パープルアバター", url: "https://api.dicebear.com/7.x/bottts/svg?seed=PurplePlayer" },
  { label: "オレンジアバター", url: "https://api.dicebear.com/7.x/bottts/svg?seed=OrangeOtaku" },
  { label: "ピンクアバター", url: "https://api.dicebear.com/7.x/bottts/svg?seed=PinkPixel" },
] as const;
