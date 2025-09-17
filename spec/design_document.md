# PersonaGo API 仕様書

## TODO

### ~~未設計のAPI~~
- `/api/staff/game/result/summary`の設計
-> 設計完了

### ~~パス名や名称の改良~~
- パスに`staff`は必要?
-> `staff`は削除。入出場管理に関しては`/api/entry`、その他アトラクションに関しては`/api/{attraction_id}/...`に統一。
- `/api/staff/game/result/summary`は`/api/staff/game/result`でも良い?
-> そのままにする。
- `summary`と`trend`名称をどちらかに統一する?(`/api/staff/trend`と`/api/staff/game/result/summary`は似たような意味合い)
-> `summary`と`trend`は`summary`に統一。

### ~~設計中のAPIに関する疑問・検討~~
- `/api/staff/game/result/summary`はプレイごとの順位を出すか、ユーザーごとの順位を出すか?
- プレイごとの順位を出すとランキングを同一プレイヤーが独占する可能性がある
-> 順位の際には、プレイヤーの最大スコアを代表スコアとして扱うことに決定。
- 同率順位に対する処理
-> 同率順位は同じ順位とし、次の順位は飛ばす(1位, 2位, 2位, 4位...)ことに決定。また、同率順位によりランキングの数が増える場合があることも許容する。
- 性格を変えるなら、ゲームプレイ時の性格も記録する必要あり
-> ゲームプレイ時の性格も記録することに決定。

### ~~新機能実装の検討~~
- 混雑状況取得APIの検討
-> 保留。完成してから追加でもたぶん大丈夫。

### ~~ID(0, 1, 2...)で管理するか名称(gameなど)で管理するか~~
- 現在アトラクションをID(0-4)で表現しているが、APIでは`game`などの分かりやすい名前に変更するべき?(Personalityテーブルを作成する必要があり、バックエンドの実装が少し増える)
- 同様に性格IDやゲームの種類もIDから名前に変更するべき?
-> アトラクションのみ名称で管理することに決定。APIでは名称を使い、DBではIDを使う。

### ~~性格の変更について~~
- 性格を変更するのがコンセプト的に合わない?
- 性格はゲームのプレイスタイルにも関わるため、変更できないのはユーザーの選択や自由を奪うことになる?
- 変更を許す場合、変更履歴を残すべき?
- 最初に設定した性格はオリジナル性格として記録しておいたほうがコンセプトと自由度のバランスが取れている。
-> オリジナル性格と現在の性格を分けて管理することに決定

### ~~景品受取について~~
- 「すべてのアトラクションを体験しないと景品は受け取れない」というルールを設けるか?
- ユーザーによっては景品を受け取るためにすべてのアトラクションを体験することを望まない場合もあるため、柔軟な対応が必要かも
-> 判断は景品受取りのパートに任せる。こちらではどのアトラクションを体験したを表示するだけにする。

### アトラクションID名
各出し物のID名を確定したい。

- **mbti**: 性格診断
- **picture**: AI似顔絵
- **games**: ゲーム
- **battle**: サバゲー
- **prize**: 景品受取

## 型定義

```TypeScript
// 基本型
type UserId = string; // ID (10桁程度のランダムな英数字(0-9, a-zm o,lは除く)を想定)
type UserName = string; // ユーザー名（重複可）
type PersonalityId = string; // 性格ID
// TODO: 名称の決定
type AttractionId = "mbti" | "picture" | "games" | "battle" | "prize"; // 出し物ID(性格診断, 景品も含む)
type StaffName = string; // QRコードを読み取ったスタッフの名前（重複可）
type GameId = "coin" | "shooting"; // ゲームの種類(タイトル)ID
type GamePlayId = number; // ゲームプレイのID(同じGameId内で一意)
type GameSlot = "1" | "2" | "3" | "4"; // ゲームのスロット番号(1P, 2P, 3P, 4P)
type GameScore = number; // ゲームのスコア

// オブジェクト型(汎用的なもののみ)
type User = {
  id: UserId; // ID
  name: UserName; // ユーザー名
  original_personality: PersonalityId; // オリジナル性格ID(最初に設定した性格)
  current_personality: PersonalityId; // 現在の性格ID
  attraction: AttractionId[]; // 体験済みアトラクション
};
```
`StaffName`について: スタッフ名は人間が識別するためのもので、システム内で一意である必要はない。

## SQLスキーマ

### Attractions

アトラクションのIDと名称の紐づけ

```sql
CREATE TABLE Attractions (
  id SMALLINT PRIMARY KEY, -- ID DB用
  name VARCHAR(50) NOT NULL -- アトラクションID(AttractionId) API用
);
```

### Users

一般ユーザーを管理

```sql
Users (
  id PRIMARY KEY, -- ユーザーID(UserId)
  name VARCHAR(50) NOT NULL, -- ユーザー名(UserName)
  original_personality SMALLINT NOT NULL, -- オリジナル性格ID(PersonalityId)
  current_personality SMALLINT NOT NULL , -- 現在の性格ID(PersonalityId)
);
```

### Visits

ユーザーがアトラクションを訪れた記録

```sql
Visits (
  id SERIAL PRIMARY KEY, -- 来訪ID
  user_id NOT NULL REFERENCES Users(id), -- ユーザーID(UserId)
  user_personality SMALLINT NOT NULL, -- 来訪時の性格ID(PersonalityId)
  attraction_id SMALLINT NOT NULL CHECK (attraction_id BETWEEN 0 AND 4), -- アトラクションID(AttractionId)
  staff_name VARCHAR(50), -- スタッフ名(StaffName)
  visited_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP -- 来訪時刻
);
CREATE INDEX idx_visits_user ON Visits(user_id);
CREATE INDEX idx_visits_attraction ON Visits(attraction_id);
```

### Gane

ゲームの種類を管理

```sql
Games (
  game_id SMALLINT PRIMARY KEY, -- ゲームID(GameId)
  name VARCHAR(50) NOT NULL -- ゲームの名称
);
```

### GamePlays

1回のプレイセッションを管理

```sql
GamePlays (
  play_id SERIAL PRIMARY KEY, -- プレイID(内部連番 or API向けのID)
  game_id SMALLINT NOT NULL REFERENCES Games(game_id), -- ゲームID(GameId)
  started_at TIMESTAMP NOT NULL -- ゲームシステムから渡された開始時刻
);
```

### GameResults

各プレイヤーのスコア記録

```sql
GameResults (
  id SERIAL PRIMARY KEY, -- リザルトID
  play_id INT NOT NULL REFERENCES GamePlays(play_id), -- プレイID(GamePlayId)
  user_name SMALLINT NOT NULL CHECK (user_name BETWEEN 1 AND 4), -- スロット番号(Gameuser_name)
  user_id NOT NULL REFERENCES Users(id), -- ユーザーID(UserId)
  user_personality SMALLINT NOT NULL, -- プレイ時の性格ID(PersonalityId)
  score INT NOT NULL, -- スコア(GameScore)
);
CREATE INDEX idx_results_play ON GameResults(play_id);
```
- ランキングの情報は削除。数百-数千件程度の規模ならSELECT時に`RANK()`で対応可能

### GameLobby

待機列の管理

```sql
GameLobby (
  game_id SMALLINT NOT NULL REFERENCES Games(game_id), -- ゲームID(GameId)
  user_name SMALLINT NOT NULL CHECK (user_name BETWEEN 1 AND 4), -- スロット番号(GameSlot)
  user_id NOT NULL REFERENCES Users(id), -- ユーザーID(UserId)
  PRIMARY KEY (game_id, slot),
  UNIQUE (game_id, user_id)
);
```

## API

- RESTful
- JSON 形式でリクエスト・レスポンス
- クエリパラメータやパスパラメータも使用
- 認証はなし
- エラーについては特に記述していないが、適切なエラーハンドリングを行うこと
- 原則、以下のステータスコードを使用する
  - 200 OK: 正常
  - 400 Bad Request: リクエストが不正
  - 404 Not Found: リソースが見つからない
  - 500 Internal Server Error: サーバーエラー
---

### GET `/api/user/{user_id}`

- ユーザー情報を取得
- 一般ユーザー・スタッフ向け
- `User`型のデータを返す
- 関数名: `GetUser`

#### レスポンス例
```JSON
{
  "id": "7ff08778-4ffa-4752-bb92-561db98042dd",
  "name": "ほげほげ夫",
  "original_personality": "1",
  "current_personality": "2",
  "attraction": ["games", "picture"]
}
```
---

### POST `/api/user`

- ユーザーを新規作成
- 一般ユーザー向け
- ユーザー名, 性格IDをリクエストボディに含める
- `User`型のデータを返す
- 関数名: `CreateUser`

#### リクエスト例
```JSON
{
  "name": "ほげほげ子",
  "personalityId": "2"
}
```

#### レスポンス例
```JSON
{
  "id": "69a6af40-4795-4879-a8d6-d1b660c5f6bd",
  "name": "ほげほげ子",
  "original_personality": "2",
  "current_personality": "2",
  "attraction": []
}
```
---
### UPDATE `/api/user/{user_id}`

- 名前の訂正など、ユーザー情報を更新
- `User`型のデータでリクエスト
- 変更しない箇所は`null`にする
- `User`型のデータを返す
- 関数名 `UpdateUser`

#### リクエスト例
```JSON
{
  "id": null,
  "name": "ほげほげ美",
  "original_personality": null,
  "current_personality": null,
  "attraction": null
}
```

#### レスポンス例
```JSON
{
  "id": "69a6af40-4795-4879-a8d6-d1b660c5f6bd",
  "name": "ほげほげ美",
  "original_personality": "2",
  "current_personality": "2",
  "attraction": []
}
```
---

### PATCH `/api/user/{user_id}/personality`
- ユーザーの現在の性格情報(current_personality)を更新
- 性格IDをリクエストボディに含める
- `User`型のデータを返す
- 性格は変更する機会が多いため、PATCHメソッドを実装

#### リクエスト例
```JSON
{
  "personality": "2"
}
```

#### レスポンス例
```JSON
{
  "id": "69a6af40-4795-4879-a8d6-d1b660c5f6bd",
  "name": "ほげほげ美",
  "original_personality": "1",
  "current_personality": "2",
  "attraction": []
}
```

### DELETE `/api/user/{user_id}`
- ユーザーを削除
- レスポンスは特に無し
- 関数名 `DeleteUser`
---

### GET `/api/user/{user_id}/history`

- ユーザーの来訪履歴を取得
- 一般ユーザー・スタッフ向け
- 来訪情報の配列を返す。来訪者の配列は来訪時刻(昇順: 古い順)でソートされる
- 来訪情報にはアトラクションID, スタッフ名, 来訪時刻が含まれる

#### レスポンス例
```JSON
{
  "history": [
    {
      "attraction_id": "game",
      "personality": "1",
      "staff_name": "スタッフ太郎",
      "visited_at": "2025-08-25T12:03:51Z"
    },
    {
      "attraction_id": "ai-port",
      "personality": "2",
      "staff_name": "スタッフ次郎",
      "visited_at": "2025-08-25T12:34:56Z"
    }
  ]
}
```
---

### GET `/api/entry/summary`

- 各アトラクションの来訪者情報を取得
- スタッフ向け
- 性格はオリジナル性格で集計

#### レスポンス例
```JSON
{
  "trends": [
    {
      "attraction": "total",
      "visitors": 113,
      "visitors_by_personality": {
         "0": 5,
        "1": 7,
        "2": 15,
        "3": 10,
        "4": 8,
        "5": 5,
        "6": 10,
        "7": 10,
        "8": 5,
        "9": 3,
        "10": 2,
        "11": 10,
        "12": 15,
        "13": 0,
        "14": 8,
        "15": 0
      }
    },
    {
      "attraction": "mbti",
      "visitors": 0,
      "visitors_by_personality": {
        "0": 0,
        "1": 0,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0,
        "10": 0,
        "11": 0,
        "12": 0,
        "13": 0,
        "14": 0,
        "15": 0,
      }
    },
    {
      "attraction": "picture",
      "visitors": 55,
      "visitors_by_personality": {
        "0": 5,
        "1": 7,
        "2": 15,
        // ... 省略 ...
      }
    },
    {
      "attraction": "games",
      "visitors": 30,
      "visitors_by_personality": {
        "0": 30,
        "1": 20,
        "2": 10
        // ... 省略 ...
      }
    },
    {
      "attraction": "battle",
      "visitors": 20,
      "visitors_by_personality": {
        "0": 10,
        "1": 10,
        "2": 10
        // ... 省略 ...
      }
    },
    {
      "attraction": "prize",
      "visitors": 8,
      "visitors_by_personality": {
        "0": 5,
        "1": 5,
        "2": 5,
        "3": 5
        // ... 省略 ...
      }
    }
  ]
}
```

---

### GET `/api/entry/attraction/{attraction_id}`

- そのアトラクションの詳細情報を取得
- スタッフ向け
- 取得したい来訪者情報の最大人数をクエリパラメータで指定(指定しない場合はデフォルト値10)
- 直近n人の来訪者情報と総来訪者数を返す
- 来訪者情報にはID, ユーザー名, 性格ID, アトラクションID, 自アトラクションへの最近来訪時刻が含まれる
- 来訪者の配列は来訪時刻(降順: 新しい順)でソートされる

#### リクエスト例
- GET `/api/entry/attraction/0?limit=10` (クエリパラメータ: `limit=10`)

#### レスポンス例
```JSON
{
  "totalVisitors": 56,
  "visitors": [
    {
    "id": "7ff08778-4ffa-4752-bb92-561db98042dd",
    "name": "ほげほげ夫",
    "personality": "1",
    "attraction": ["mbti", "picture", "games"],
    "visited_at": "2025-08-25T12:35:51Z"
    },
    {
      "id": "69a6af40-4795-4879-a8d6-d1b660c5f6bd",
      "name": "ほげほげ子",
      "personality": "2",
      "attraction": ["games"],
      "visited_at": "2025-08-25T12:34:56Z"
    }
    // あと8人分続く...
  ],
}
```
---

### POST `/api/entry/attraction/{attraction_id}/visit`

- ユーザーの体験済みのアトラクションを更新
- スタッフ向け
- ユーザーIDとスタッフ名をリクエストボディに含める
- `User`型のデータを返す

#### リクエスト例
```JSON
{
  "userId": "69a6af40-4795-4879-a8d6-d1b660c5f6bd",
  "staffName": "スタッフ太郎"
}
```

#### レスポンス例
```JSON
{
  "id": "69a6af40-4795-4879-a8d6-d1b660c5f6bd",
  "name": "ほげほげ子",
  "personality": "2",
  "attraction": []
}
```
---

### XXX `/api/{attraction_id}/xxxxxxxxxx`

- アトラクション特有の API を実装する場合

### GET `/api/games/lobby/{game_id}`

- 指定したゲームの待機列情報を取得
- レスポンスは待機列の情報を含む

#### レスポンス例
```JSON
{
  "game_id": "shooting",
  "lobby": {
    "1": {
      "user_id": "69a6af40-4795-4879-a8d6-d1b660c5f6bd",
      "user_name": "ほげほげ子",
      "personality": "2",
    },
    "2": {
      "user_id": "7ff08778-4ffa-4752-bb92-561db98042dd",
      "user_name": "ほげほげ夫",
      "personality": "1",
    },
    "3": {
      "user_id": "708325d6-77dd-4a38-b71c-c6ed04481a9c",
      "user_name": "ほげほげ郎",
      "personality": "3",
    },
    "4": null
  }
}
```
---

### POST `/api/games/lobby/{game_id}`

- 指定したゲームの待機列を更新
- 1プレイ分のユーザー(複数)を一度に追加(残っている場合は上書き)
- 配列の要素数は必ず4つ。 空きスロットは`null`で表現する
- リクエストにはユーザーIDの配列を含める
- レスポンスには更新後の待機列情報を含める

#### リクエスト例
```JSON
{
  "lobby": [
    "69a6af40-4795-4879-a8d6-d1b660c5f6bd",
    "7ff08778-4ffa-4752-bb92-561db98042dd",
    "708325d6-77dd-4a38-b71c-c6ed04481a9c",
    null
  ]
}
```

#### レスポンス例
```JSON
{
  "game_id": "shooting",
  "lobby": {
    "1": {
      "user_id": "69a6af40-4795-4879-a8d6-d1b660c5f6bd",
      "user_name": "ほげほげ子",
      "personality": "2",
    },
    "2": {
      "user_id": "7ff08778-4ffa-4752-bb92-561db98042dd",
      "user_name": "ほげほげ夫",
      "personality": "1",
    },
    "3": {
      "user_id": "708325d6-77dd-4a38-b71c-c6ed04481a9c",
      "user_name": "ほげほげ郎",
      "personality": "3",
    },
    "4": null
  }
}
```
---

### DELETE `/api/games/lobby/{game_id}`
- 指定したゲームの待機列を削除
- レスポンスは特に無し
---

### POST `/api/games/result`

- ゲームシステムがゲーム結果を登録する
- リクエストボディにゲーム結果を含める
- レスポンスは特に無し

#### リクエスト例
```JSON
{
  "game_id": "coin",
  "play_id": 12,
  "start_time": "2025-08-27T14:32:15Z",
  "results": {
    "1": {
      "user_id": "69a6af40-4795-4879-a8d6-d1b660c5f6bd",
      "user_name": "ほげほげ子",
      "score": 85
    },
    "2": {
      "user_id": "7ff08778-4ffa-4752-bb92-561db98042dd",
      "user_name": "ほげほげ夫",
      "score": 72
    },
    "3": {
      "user_id": "708325d6-77dd-4a38-b71c-c6ed04481a9c",
      "user_name": "ほげほげ郎",
      "score": 64
    },
    "4": null
  }
}
```
---

### GET `/api/games/result/{user_id}`

- 指定したユーザーのゲーム結果を取得
- 一般ユーザー向け
- ユーザーID, ゲーム結果の配列を返す
- ゲーム結果の配列はプレイ開始時間(降順: 新しい順)でソートされる
- ランキングはそのゲームタイトル内でのランキング
- 総プレイヤー数はそのゲームタイトル内での総プレイヤー数

#### レスポンス例
```JSON
{
  "user_id": "69a6af40-4795-4879-a8d6-d1b660c5f6bd",
  "results": [
    {
      "game_id": "shooting",
      "play_id": 12,
      "slot": "1",
      "score": 85,
      "ranking": 1, // ランキング
      "played_at": "2025-08-27T14:32:15Z", // プレイ開始時刻
      "total_player": 120 // 総プレイヤー数
    },
    {
      "game_id": "coin",
      "play_id": 5,
      "slot": "2",
      "score": 120,
      "ranking": 3,
      "played_at": "2025-08-26T11:20:00Z",
      "total_player": 156
    }
    // 他のゲーム結果も続く...
  ]
}
```
---

### GET `/api/games/result/summary`

- ゲーム結果のサマリーを取得
- 同一プレイヤーが複数回プレイした場合は、プレイヤーの最大スコアを代表スコアとして扱う(-> 同一プレイヤーがランキングを独占することを防ぐ)
- 同率順位は同じ順位とし、次の順位は飛ばす(1位, 2位, 2位, 4位...)
- 同率順位によりランキングの数が増える場合があることも許容する

#### レスポンス例

```JSON
{
  "total_players": 120,
  "ranking_limit": 10,
  "games": [
    {
      "id": "coin",
      "players": 100,
      "players_by_personality": {
        "0": 50,
        "1": 30,
        "2": 20
      },
      "score_trend":{
        "mean": 88.5,
        "max": 105,
        "min": 90
      },
      "ranking": [
        {
          "rank": 1,
          "user_name": "ほげほげ子",
          "personality": "01",
          "score": 99
        },
        {
          "rank": 2,
          "user_name": "ほげほげ夫",
          "personality": "0",
          "score": 88
        },
        {
          "rank": 2,
          "user_name": "ほげほげ郎",
          "personality": "1",
          "score": 88
        }
      ],
    },{
      "id": "shooting",
      "players": 120,
      "players_by_personality": {
        "0": 60,
        "1": 40,
        "2": 20
      },
      "score_trend":{
        "mean": 90.0,
        "max": 120,
        "min": 45
      },
      "ranking": [
        {
          "rank": 1,
          "user_name": "ほげほげ子",
          "personality": "0",
          "score": 99
        },
        {
          "rank": 2,
          "user_name": "ほげほげ夫",
          "personality": "0",
          "score": 88
        },
        {
          "rank": 3,
          "user_name": "ほげほげ郎",
          "personality": "1",
          "score": 87
        }
      ]
    }
  ]
}
```
---

## その他
### ユーザーIDについて
~~ユーザーIDは現在UUID形式とするようにしているが、ユーザーにも公開されるため、より短く覚えやすい形式にすることも検討する。~~
~~具体的には、10桁程度の英数字(0-9, a-z)のランダムな文字列にすることを考えている。~~
-> UUID形式は廃止し、10桁のランダムな英数字(0-9, a-z, o,lは除く)の文字列にすることに決定。

#### 実装例
```Go
package main

import (
    "crypto/rand"
    "math/big"
)

// 小文字英字 + 数字, ただし紛らわしい文字(o, l)は除外
const charset = "abcdefghijkmnpqrstuvwxyz0123456789"

func GenerateID(length int) (string, error) {
    result := make([]byte, length)
    for i := 0; i < length; i++ {
        n, err := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
        if err != nil {
            return "", err
        }
        result[i] = charset[n.Int64()]
    }
    return string(result), nil
}

// 呼び出し
id, _ := GenerateID(12)

```

#### 衝突リスクについて
- IDの長さ：$L$
- 可能な組み合わせ数：$N = 34^L$ (小文字英字 + 数字 - "ol" = 34文字)
- 生成する ID 数：$k$（数百〜数千程度）

とすると、衝突確率（近似）は誕生日のパラドックスの式より：

$$
p \approx \frac{k^2}{2N}
$$

k = 5000 とするとp(L)は以下の通り:

$$
p(6) \approx \frac{5000^2}{2 \times 34^6} \approx 8.092 \times 10^{-3} \\
p(8) \approx \frac{5000^2}{2 \times 34^8} \approx 6.700 \times 10^{-6} \\
p(10) \approx \frac{5000^2}{2 \times 34^{10}} \approx 6.055 \times 10^{-9} \\
p(12) \approx \frac{5000^2}{2 \times 34^{12}} \approx 5.238 \times 10^{-12} \\
$$

したがって、L=8で十分に低い確率、L=10でほぼ衝突しないと考えられる
