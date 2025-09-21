# PersonaGo API 仕様書

## 型定義

```TypeScript
// 基本型
type UserId = string; // ID (8桁のランダムな英数字(0-9, a-z, o,lは除く)の文字列を2ブロック、ハイフンで区切った形式 xxxx-xxxx)
type UserName = string; // ユーザー名（重複可）
type PersonalityId = string; // 性格ID
type AttractionId = "mbti" | "picture" | "games" | "battle" | "prize"; // 出し物ID(性格診断, 景品も含む)
type StaffName = string; // QRコードを読み取ったスタッフの名前（重複可）
type GameId = "coin" | "shooting"; // ゲームの種類(タイトル)ID
type GamePlayId = number; // ゲームプレイのID(同じGameId内で一意)
type GameSlot = "1" | "2" | "3" | "4"; // ゲームのスロット番号(1P, 2P, 3P, 4P)
type GameScore = number; // ゲームのスコア

// オブジェクト型(汎用的なもののみ)
// ユーザー情報
type User = {
  id: UserId; // ID
  name: UserName; // ユーザー名
  originalPersonality: PersonalityId; // オリジナル性格ID(最初に設定した性格)
  currentPersonality: PersonalityId; // 現在の性格ID
  attractions: AttractionId[]; // 体験済みアトラクション
};

// ゲーム待機室情報
type Lobby = Record<GameSlot, { id: UserId; name: UserName; personality: PersonalityId } | null>;

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
  staff VARCHAR(50), -- スタッフ名(StaffName)
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
  "id": "tujy-q055",
  "name": "ほげほげ夫",
  "originalPersonality": "1",
  "currentPersonality": "2",
  "attractions": ["games", "picture"]
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
  "personality": "2"
}
```

#### レスポンス例

```JSON
{
  "id": "1tc5-4kh5",
  "name": "ほげほげ子",
  "originalPersonality": "2",
  "currentPersonality": "2",
  "attractions": []
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
  "originalPersonality": null,
  "currentPersonality": null,
  "attractions": null
}
```

#### レスポンス例

```JSON
{
  "id": "1tc5-4kh5",
  "name": "ほげほげ美",
  "originalPersonality": "2",
  "currentPersonality": "2",
  "attractions": []
}
```

---

### PATCH `/api/user/{user_id}/personality`

- ユーザーの現在の性格情報(currentPersonality)を更新
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
  "id": "1tc5-4kh5",
  "name": "ほげほげ美",
  "originalPersonality": "1",
  "currentPersonality": "2",
  "attractions": []
}
```

### DELETE `/api/user/{user_id}`

- ユーザーを削除
- `User`型のデータを返す
- 関数名 `DeleteUser`

#### レスポンス例

```JSON
{
  "id": "1tc5-4kh5",
  "name": "ほげほげ美",
  "originalPersonality": "1",
  "currentPersonality": "2",
  "attractions": []
}
```

---

### GET `/api/user/{user_id}/history`

- ユーザーの来訪履歴を取得
- 一般ユーザー・スタッフ向け
- 来訪情報の配列を返す。来訪者の配列は来訪時刻(昇順: 古い順)でソートされる
- 来訪情報にはアトラクションID, スタッフ名, 来訪時刻が含まれる

#### レスポンス例

```JSON
{
  "userId": "1tc5-4kh5",
  "history": [
    {
      "attraction": "game",
      "personality": "1",
      "staff": "スタッフ太郎",
      "visitedAt": "2025-08-25T12:03:51Z"
    },
    {
      "attraction": "ai-port",
      "personality": "2",
      "staff": "スタッフ次郎",
      "visitedAt": "2025-08-25T12:34:56Z"
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
  "all": {
    "visitorsCount": 113,
    "visitorsCountByPersonality": {
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
  "mbti": {
    "visitorsCount": 0,
    "visitorsCountByPersonality": {
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
  "picture": {
      "visitorsCount": 55,
      "visitorsCountByPersonality": {
        "0": 5,
        "1": 7,
        "2": 15,
        // ... 省略 ...
    }
  },
  "games": {
    "visitorsCount": 30,
    "visitorsCountByPersonality": {
      "0": 30,
      "1": 20,
      "2": 10
      // ... 省略 ...
    }
  },
  "battle": {
    "visitorsCount": 20,
    "visitorsCountByPersonality": {
      "0": 10,
      "1": 10,
      "2": 10
      // ... 省略 ...
    }
  },
  "prize": {
    "visitorsCount": 8,
    "visitorsCountByPersonality": {
      "0": 5,
      "1": 5,
      "2": 5,
      "3": 5
      // ... 省略 ...
    }
  }
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

- GET `/api/entry/attraction/games?limit=10` (クエリパラメータ: `limit=10`)

#### レスポンス例

```JSON
{
  "attraction": "games",
  "limit": 10,
  "visitorsCount": 56,
  "visitors": [
    {
    "id": "tujy-q055",
    "name": "ほげほげ夫",
    "personality": "1",
    "visitedAt": "2025-08-25T12:35:51Z"
    },
    {
      "id": "1tc5-4kh5",
      "name": "ほげほげ子",
      "personality": "2",
      "visitedAt": "2025-08-25T12:34:56Z"
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
  "userId": "1tc5-4kh5",
  "staff": "スタッフ太郎"
}
```

#### レスポンス例

```JSON
{
  "attraction": "games",
  "staff": "スタッフ太郎",
  "user": {
    "id": "1tc5-4kh5",
    "name": "ほげほげ子",
    "personality": "2",
    "attractions": []
  }
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
  "gameId": "shooting",
  "lobby": {
    "1": {
      "id": "1tc5-4kh5",
      "name": "ほげほげ子",
      "personality": "2",
    },
    "2": {
      "id": "tujy-q055",
      "name": "ほげほげ夫",
      "personality": "1",
    },
    "3": {
      "id": "dryf-fbhu",
      "name": "ほげほげ郎",
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
  "gameId": "shooting",
  "lobby": {
    "1": "1tc5-4kh5",
    "2": "tujy-q055",
    "3": "dryf-fbhu",
    "4": null
  }
}
```

#### レスポンス例

```JSON
{
  "gameId": "shooting",
  "lobby": {
    "1": {
      "id": "1tc5-4kh5",
      "name": "ほげほげ子",
      "personality": "2",
    },
    "2": {
      "id": "tujy-q055",
      "name": "ほげほげ夫",
      "personality": "1",
    },
    "3": {
      "id": "dryf-fbhu",
      "name": "ほげほげ郎",
      "personality": "3",
    },
    "4": null
  }
}
```

---

### DELETE `/api/games/lobby/{game_id}`

- 指定したゲームの待機列を削除
- レスポンスには削除対象の待機列情報を含める

#### レスポンス例

```JSON
{
  "gameId": "shooting",
  "lobby": {
    "1": {
      "id": "1tc5-4kh5",
      "name": "ほげほげ子",
      "personality": "2",
    },
    "2": {
      "id": "tujy-q055",
      "name": "ほげほげ夫",
      "personality": "1",
    },
    "3": {
      "id": "dryf-fbhu",
      "name": "ほげほげ郎",
      "personality": "3",
    },
    "4": null
  }
}
```

---

### POST `/api/games/result/{game_id}`

- ゲームシステムがゲーム結果を登録する
- リクエストボディにゲーム結果を含める
- レスポンスには登録したゲームIDとプレイIDを含める

#### リクエスト例

```JSON
{
  "startTime": "2025-08-27T14:32:15Z",
  "results": {
    "1": {
      "id": "1tc5-4kh5",
      "name": "ほげほげ子",
      "score": 85
    },
    "2": {
      "id": "tujy-q055",
      "name": "ほげほげ夫",
      "score": 72
    },
    "3": {
      "id": "dryf-fbhu",
      "name": "ほげほげ郎",
      "score": 64
    },
    "4": null
  }
}
```

### レスポンス例

```JSON
{
  "gameId": "shooting",
  "playId": 12
}
```

---

### GET `/api/games/result/player/{user_id}`

- 指定したユーザーのゲーム結果を取得
- 一般ユーザー向け
- ユーザーID, ゲーム結果の配列を返す
- ゲーム結果の配列はプレイ開始時間(降順: 新しい順)でソートされる
- ランキングはそのゲームタイトル内でのランキング
- 総プレイヤー数はそのゲームタイトル内での総プレイヤー数

#### レスポンス例

```JSON
{
  "userId": "1tc5-4kh5",
  "results": [
    {
      "gameId": "shooting",
      "playId": 12,
      "slot": "1",
      "score": 85,
      "ranking": 1, // ランキング
      "playedAt": "2025-08-27T14:32:15Z", // プレイ開始時刻
      "PlayersCount": 120 // 総プレイヤー数
    },
    {
      "gameId": "coin",
      "playId": 5,
      "slot": "2",
      "score": 120,
      "ranking": 3,
      "playedAt": "2025-08-26T11:20:00Z",
      "PlayersCount": 156
    }
    // 他のゲーム結果も続く...
  ]
}
```

---

### GET `/api/games/result/summary/{game_id}?limit={limit}`

- ゲーム結果のサマリーを取得
- 同一プレイヤーが複数回プレイした場合は、プレイヤーの最大スコアを代表スコアとして扱う(-> 同一プレイヤーがランキングを独占することを防ぐ)
- 同率順位は同じ順位とし、次の順位は飛ばす(1位, 2位, 2位, 4位...)
- 同率順位によりランキングの数が増える場合があることも許容する

#### レスポンス例

```JSON
{
  "gameId": "coin",
  "limit": 10,
  "playersCount": 100,
  "playersCountByPersonality": {
    "0": 50,
    "1": 30,
    "2": 20
  },
  "scoreTrend":{
    "mean": 88.5,
    "max": 105,
    "min": 90
  },
  "ranking": [
    {
      "rank": 1,
      "name": "ほげほげ子",
      "personality": "1",
      "score": 99
    },
    {
      "rank": 2,
      "name": "ほげほげ夫",
      "personality": "0",
      "score": 88
    },
    {
      "rank": 2,
      "name": "ほげほげ郎",
      "personality": "1",
      "score": 88
    }
  ]
}
```

---

## その他

### ユーザーIDについて

8桁のランダムな英数字(0-9, a-z, o,lは除く)の文字列を2ブロック、ハイフンで区切った形式とする (例: `abcd-efgh`)

#### 実装例

```Go
package main

import (
    "crypto/rand"
    "fmt"
    "math/big"
    "strings"
)

// 小文字英字 + 数字, ただし紛らわしい文字(o, l)は除外
const charset = "abcdefghijkmnpqrstuvwxyz0123456789"

// Generate は可変長引数で各ブロックの長さを受け取り、ハイフン区切りのIDを生成する
func Generate(lengths ...int) (string, error) {
    parts := make([]string, len(lengths))
    for i, length := range lengths {
        b := make([]byte, length)
        for j := 0; j < length; j++ {
            n, err := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
            if err != nil {
                return "", err
            }
            b[j] = charset[n.Int64()]
        }
        parts[i] = string(b)
    }
    return strings.Join(parts, "-"), nil
}

func main() {
    id, err := Generate(4, 4, 8) // => xxxx-xxxx-xxxxxxxx
    id, err := Generate(4, 4)    // => xxxx-xxxx (今回の仕様)
    if err != nil {
        panic(err)
    }
    fmt.Println(id)
}

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
