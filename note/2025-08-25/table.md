## User

- id: UUID
- name: String
- personality: PersonalityId

## Visit

- id: UUID
- attractionId: string
- time: DateTime
- name: string

## GameResult

- userId: UUID
- gameId: string
- score: number
- rank: number // 定期的に DB 側で更新

## Game

- id: string
- type: string
- time: DateTime

## GameLobby

- id
