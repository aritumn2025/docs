/* OpenAPIで定義されている型 */

// 基本型
// 入出場管理システム
type UserId = string; // ユーザーID (8桁のランダムな英数字(0-9, a-z, o,lは除く)の文字列を2ブロック、ハイフンで区切った形式 xxxx-xxxx)
type UserName = string; // ユーザー名(重複可)
type PersonalityId = string; // 性格ID
type AttractionId = "mbti" | "picture" | "games" | "battle" | "prize"; // アトラクションID
type StaffName = string; // スタッフ名
type DateTime = string; // ISO 8601 拡張形式 (YYYY-MM-DDTHH:mm:ss.sssZ)

// ゲーム結果管理システム
type GameId = "coin" | "shooting"; // ゲームの種類(タイトル)ID
type GamePlayId = number; // ゲームプレイID(同じGameId内で一意)
type GameSlot = "1" | "2" | "3" | "4"; // ゲームのスロット番号(1P, 2P, 3P, 4P)
type GameScore = number; // ゲームのスコア

// オブジェクト型
// ユーザー情報
type User = {
  id: UserId;
  name: UserName;
  originalPersonality: PersonalityId;
  currentPersonality: PersonalityId;
  attractions: Record<AttractionId, number>;
};

// 入場履歴情報
type History = {
  attraction: AttractionId;
  personality: PersonalityId;
  staff: StaffName;
  visitedAt: DateTime;
};

// 入場者情報
// Userはエンドユーザー用(/api/user/...), Visitorはスタッフ用(/api/entry/...)で使い分け
type Visitor = {
  id: UserId;
  name: UserName;
  personality: PersonalityId;
  visitedAt: DateTime;
};

// ゲーム待機室情報
type Lobby = Record<
  GameSlot,
  { id: UserId; name: UserName; personality: PersonalityId } | null
>;

// ゲーム結果情報
type GameResult = {
  gameId: GameId;
  playId: GamePlayId;
  slot: GameSlot;
  score: GameScore;
  ranking: number;
  playedAt: DateTime;
  PlayersCount: number;
};

// ゲームランキング上位者情報
type GameRankingEntry = {
  rank: number;
  name: UserName;
  personality: PersonalityId;
  score: GameScore;
};

export type {
  UserId,
  UserName,
  PersonalityId,
  AttractionId,
  StaffName,
  DateTime,
  GameId,
  GamePlayId,
  GameSlot,
  GameScore,
  User,
  Visitor,
  History,
  Lobby,
  GameResult,
  GameRankingEntry,
};
