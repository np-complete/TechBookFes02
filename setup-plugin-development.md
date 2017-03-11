## プラグインを作る準備

`babel-plugin-transowrm-es2015-arrow-functions` を参考に、プラグインのセットアップ方法をまとめます。

    $ mkdir babel-plugin-transform-sample
    $ cd babel-plugin-transform-sample
    $ npm init

テストランナーに `mocha` と `babel-helper-plugin-test-runner` を使っているようです。

`test/index.js` は、決められたコードを書くだけのようです。

```js
import runner from 'babel-helper-plugin-test-runner';

runner(__dirname);
```

`import` を使うので `babel-preset-es2015` が使えるようにしておいてください。

`test/fixtures/{プラグイン名}` 以下に、テスト項目ごと[^2]にディレクトリを作り、`actual.js` と `expected.js` を置きます。

最も大事なこととして、 `test/fixtures/options.json` というファイルで、
**作ろうとしているプラグインを読み込む** 設定ファイルを書くことです。

```json
{
  "plugins": ["transform-sample"]
}
```

`package.json` にタスクを追加しましょう。
上述の設定ファイルの都合上、**自分自身を呼び出せなければならない**ので、`require-self` というコマンドを使います。

```json
{
  "name": "babel-plugin-transform-sample",
  "main": "lib/index.js",
  "scripts": {
    "build": "babel -d lib src",
    "require-self": "npm run build && require-self",
    "mocha": "npm run require-self && mocha --compilers js:babel-register test/index.js"
  }
}
```

必要なパッケージのインストールをまとめると、

    $ npm install -D babel-cli babel-preset-es2015
          babel-helper-plugin-test-runner mocha npm-run-all require-self

となります。
この状態で

    $ npm run mocha

を実行すると、`actual.js` と `expected.js` を比較したテストが実行されます。

[^2]: mocha の describe にあたるくらいの概念
