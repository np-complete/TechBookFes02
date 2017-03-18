# 探検 バベルの塔

動作確認ができたので**やっと入門記事**に入れます。
[Babelのソースコード](https://github.com/babel/babel/tree/6.x) をpullして、
どのように変換を行っているか、内部を探索していきましょう。
なおソースコードは現在の安定版である `6.x` ブランチを使います

## .babelrc を読みとく

[configの定義ファイル](https://github.com/babel/babel/blob/6.x/packages/babel-core/src/transformation/file/options/config.js)には様々なオプションが並んでいますが、
この中で変換ルールに深く関わっているのはどうやら `presets` と `plugins` だけです。
今まで目にしたことのある`.babelrc`も、ほとんどこの2つのオプションしかなかったのではないでしょうか?

## presetsを読んでみる

最も使うであろうpresetをまず読んでみようと思います。
有名どころで[babel-preset-es2015](https://github.com/babel/babel/blob/6.x/packages/babel-preset-es2015/) なんてどうでしょうか。

`package.json` には`babel-plugin-*` という名前の様々なプラグインが依存関係に登録されています。
`src/index.js` を見てみると、いろいろな条件分岐がされているものの、結局のところ

```js
{
  plugins: [
    pluginA, pluginB, pluginC,  ...
  ]
}
```

というハッシュを返しているにすぎません。
どうやらpresetとは、presetの名の通り、ただの**pluginの集合体**のようです。

ということは、**pluginさえ理解すれば**バベルの塔は攻略したも同然と言えるでしょう。

実際に、Babel本体の `presets` を処理しているところのコードを読んでみましょう。
[option-manager.js](https://github.com/babel/babel/blob/6.x/packages/babel-core/src/transformation/file/options/option-manager.js#L228)のmergeOptionsメソッドでは、再帰的にそれぞれのpresetのオプションをマージしていき、ひとつのオプションを作っています。
最終的に全てのpluginがフラットな配列に格納されるようです。
処理を読む限り、

```js
{
  "presets": ["presetA", "presetB"],
  "plugins": ["pluginC", "pluginD"]
}
```

という `.babelrc` を与えたら、

```js
["pluginC", "pluginD", "pluginA1", "pluginA2", "pluginB1", "pluginB2"]
```

のような順番になるように読めます。
後で実際にプラグインとプリセットを作り確認してみましょう。

## pluginを読んでみる

大本命のプラグインのコードを読んでみましょう。
es2015に含まれるプラグインのうちいくつか選んで読みます。

処理の中身は全く理解できませんが、共通する部分だけは見えてきます。
どうやら全て、

```js
{
  visitor: {
    foo: function(path, ...) {},
    bar: function(path, ...) {},
    ...
  }
}
```

というオブジェクトを返す関数であることが分かります。
中身はいったんさておき、**Vistorパターン**を使っているらしいことは分かりました。
babelリポジトリを `vistor` で検索すると `pipeline.js` というファイル名が目に入り、**オッ** ってなりますね。
次章で更に深く探っていきましょう。

さきに、今のうちにテストコードも見ておきましょう。
[babel-plugin-transform-es2015-arrow-functions](https://github.com/babel/babel/tree/6.x/packages/babel-plugin-transform-es2015-arrow-functions/test/fixtures/arrow-functions)が非常に良い例です。

テストパターンごとにディレクトリを作り、
変換前のソースコードである `actual.js` と、
正しく変換されたらこうなるべきという `expected.js` を置くだけでテストができてしまうようです。
素晴らしくシンプルで怠惰なテストフレームワーク、最高です。
JavaScript界は**怠惰力が足りない**と常々思っていましたが、
初めて自分より怠惰な存在を見つけたような感覚です。
