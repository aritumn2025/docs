/* OpenAPIで定義されているJSONスキーマに基づく型定義 */
import type {
  AttractionId,
  DateTime,
  GameId,
  GamePlayId,
  GameScore,
  GameSlot,
  Lobby,
  PersonalityId,
  StaffName,
  User,
  UserId,
  UserName,
} from "./common";
import type Nullable from "./utils";

// 性格診断・ユーザー関連API

// GET /api/user/{user_id}
type GetUserResponse = User;

// POST /api/user
type PostUserRequest = {
  name: UserName;
  personality: PersonalityId;
};

type PostUserResponse = User;

// UPDATE /api/user/{user_id}
type UpdateUserRequest = Nullable<Omit<User, "attractions">>;

type UpdateUserResponse = User;

// PATCH /api/user/{user_id}/personality
type PatchUserPersonalityRequest = {
  personality: PersonalityId;
};

type PatchUserPersonalityResponse = User;

// DELETE /api/user/{user_id}
type DeleteUserResponse = User;

// GET /api/user/{user_id}/history
type GetUserHistoryResponse = {
  userId: UserId;
  history: {
    attraction: AttractionId;
    personality: PersonalityId;
    staffName: StaffName;
    visitedAt: DateTime;
  }[];
};

// 入出場管理システム関連API

// GET /api/entry/summary
type GetEntrySummaryResponse = Record<
  AttractionId | "all",
  {
    visitors: number;
    visitorsByPersonality: Record<PersonalityId, number>;
  }
>;

// GET /api/entry/attraction/{attraction_id}?limit={limiit}
type GetEntryAttractionResponse = {
  attraction: AttractionId;
  limit: number;
  visitorsCount: number;
  visitors: {
    id: UserId;
    name: UserName;
    personality: PersonalityId;
    visitedAt: DateTime;
  }[];
};

// POST /api/entry/attraction/{attraction_id}/visit
type PostEntryAttractionVisitRequest = {
  userId: UserId;
  staff: StaffName;
};

type PostEntryAttractionVisitResponse = {
  attraction: AttractionId;
  staff: StaffName;
  user: User;
};

// ゲーム待機室関連API
// GET /api/games/lobby/{game_id}
type GetGamesLobbyResponse = {
  gameId: GameId;
  lobby: Lobby;
};

// POST /api/games/lobby/{game_id}
type PostGamesLobbyRequest = {
  gameId: GameId;
  lobby: Record<GameSlot, UserId | null>;
};

type PostGamesLobbyResponse = {
  gameId: GameId;
  lobby: Lobby;
};

// DELETE /api/games/lobby/{game_id}
type DeleteGamesLobbyResponse = {
  gameId: GameId;
  lobby: Lobby;
};

// ゲーム結果管理システム関連API

// POST /api/games/result/{game_id}
type PostGamesResultRequest = {
  startAt: string;
  results: Record<
    GameSlot,
    { id: UserId; name: UserName; score: GameScore } | null
  >;
};

type PostGamesResultResponse = {
  gameId: GameId;
  playId: GamePlayId;
};

// GET /api/games/result/player/{user_id}
type GetGamesResultPlayerResponse = {
  userId: UserId;
  results: {
    gameId: GameId;
    playId: GamePlayId;
    slot: GameSlot;
    score: GameScore;
    ranking: number;
    playedAt: DateTime;
    PlayersCount: number;
  }[];
};

// GET /api/games/result/summary/{game_id}?limit={limit}
type GetGamesResultSummaryResponse = {
  gameId: GameId;
  limit: number;
  playsCount: number;
  playersCount: number;
  playersByPersonality: Record<PersonalityId, number>;
  scoreTrends: {
    mean: number;
    max: number;
    min: number;
  };
  ranking: {
    rank: number;
    name: UserName;
    personality: PersonalityId;
    score: GameScore;
  }[];
};

export type {
  GetUserResponse,
  PostUserRequest,
  PostUserResponse,
  UpdateUserRequest,
  UpdateUserResponse,
  PatchUserPersonalityRequest,
  PatchUserPersonalityResponse,
  DeleteUserResponse,
  GetUserHistoryResponse,
  GetEntrySummaryResponse,
  GetEntryAttractionResponse,
  PostEntryAttractionVisitRequest,
  PostEntryAttractionVisitResponse,
  GetGamesLobbyResponse,
  PostGamesLobbyRequest,
  PostGamesLobbyResponse,
  DeleteGamesLobbyResponse,
  PostGamesResultRequest,
  PostGamesResultResponse,
  GetGamesResultPlayerResponse,
  GetGamesResultSummaryResponse,
};
