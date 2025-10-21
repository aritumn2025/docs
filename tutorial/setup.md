# 開発環境の構築方法

以下は PowerShell で実行してください。

## vscode のインストール

- プログラムを書くときに必要

```powershell
winget install -e --id Microsoft.VisualStudioCode
```

## git のインストール

- scoop(コマンドでインストールできるツール)をインストールします
- 強制的に貼り付けは OK で良いです。

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
```

### Git

```powershell
scoop install git
```

### SQLite(データベース)

```powershell
scoop install sqlite
```

### yt-dlp(YouTube の動画をダウンロードするツール)

```powershell
scoop install yt-dlp
```

## git の設定

- ユーザー名とメールアドレスは何でも良いけど、GitHub に登録しているものを使うのが無難

```powershell
git config --global user.name "ユーザー名"
git config --global user.email "メールアドレス"
```

## ssh キーの作成

- GitHub に SSH で接続するための鍵を作成します
- コマンドを入力したらなにか聞かれるけど、全部 Enter で OK(3 回 Enter を押す)

```powershell
ssh-keygen -t rsa
```

## 公開鍵を確認

- メモ帳が開くと思うので` Ctrl + A`で全選択 + `Ctrl + C`でコピー

```powershell
notepad ~/.ssh/id_rsa.pub
```

## GitHub に公開鍵を登録

1. GitHub にログインします
1. GitHub の設定画面を開きます
1. 右上の自分のアイコンをクリックして、`Settings`を選択
1. 左のメニューから`SSH and GPG keys`を選択
1. 緑色の`New SSH key`ボタンをクリック
1. `Title`にわかりやすい名前を入力(例: My PC とか適当に)
1. `Key`に先ほどコピーした公開鍵を貼り付け
1. `Add SSH key`ボタンをクリック

## コードのコピー(クローン)

- カレントディレクトリ下にクローンされるため、事前に文化祭用のフォルダを作って`cd`コマンドで移動しておくと良いです。

```powershell
# 例: 文化祭用のフォルダを作って移動しておく
git clone git@github.com:aritumn2025/PersonaGo-backend.git
git fetch --all
```
