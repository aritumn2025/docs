# OpenAPI 仕様書

# PersonaGo-backend

## 型定義

```TypeScript
type Id = string; // UUID
type Name = string; //ニックネーム（重複可）
type PersonalityId = 0 | 1 | 2 | 3; //性格識別(文字可, 1種類）
type AttractionId = 0 | 1 | 2 | 3; //出し物識別(景品など、5種類？）

//フロントに返すもの
//テーブルを分ける？
//DB内のテーブルは全て仕様書通りで記載（例：userテーブルの属性にはIdがある。）
//Userテーブル
type User = {
  id: Id; //uuid
  name: Name;
  personality: PersonalityId; //性格ID
  attraction: AttractionId[]; //アトラクションフラグ？
};

//visitorテーブル
type AttractionBoard = {
  visitors: User[], // 直近n人の来訪者数（時間も？）
  totalVisitors: number,
};

//visitテーブル
type WholeBoard = {
  visitors: Record<AttractionId, number>;
  totalVisitors: number;
};

```

## API

- RESTful
- JSON 形式でリクエスト・レスポンス
- 認証はひとまずなしで

### `GET /api/user/{id}`

- ユーザー情報を取得
  - `User`型のデータを返す
  - 一般ユーザー・スタッフ向け
  - 関数名: `GetUser`

### `POST /api/user/`

- ユーザーを新規作成
- `name`, `personalityId`をリクエストボディに含める
- `User`型のデータを返す
- 一般ユーザー向け
- 関数名: `CreateUser`

<!--
  ### `PUT /api/user/{id}`

  - ユーザー情報を更新
  - `name`, `personalityId`をリクエストボディに含める
  - `User`型のデータを返す
  - 名前の訂正とか
  - 関数名 `UpdateUser`
  - 実際には使わないかも？

  ### `DELETE /api/user/delete/{id}`

  - ユーザーを削除
  - 関数名 `DeleteUser`
  - 実際には使わないかも？
-->

### `PATCH /api/user/{id}/personality`

- ユーザーの性格を更新
- 全部回ったら変更
- できなかったら 400 番台
- PATCH は部分的な変更
- `personalityId`をリクエストボディに含める
- `User`型のデータを返す
- 一般ユーザー向け

#### 関数名

- `UpdatePersonality`

### `GET /api/staff/attraction/{attractionId}`

- そのアトラクションの詳細情報を取得
- `AttractionBoard`型のデータを返す
- スタッフ向け

### `POST /api/staff/attraction/{attractionId}/entry`

- ユーザーの体験済みのアトラクションを更新
- `UserId`をリクエストボディに含める
- `User`型のデータを返す
- スタッフ向け
- スタッフのスマホから QR 読み取る

### `*** /api/staff/attraction/{attractionId}/*******`

- アトラクション特有の API を実装する場合
- スタッフ向け

### `GET /api/staff/trend`

- 各アトラクションの来訪者数を取得
- `WholeBoard`型のデータを返す
- スタッフ向け

### `GET /api/staff/shift`

- スタッフのシフト情報を取得
- `Shift`型のデータを返す
- スタッフ向け
