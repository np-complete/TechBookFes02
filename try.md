# やってみた

実際にプラグインを作ってみましょう。
まずは単純なものから。
なお、この章で作るプラグインは、リポジトリの [`./try-babel`](https://github.com/np-complete/TechBookFes02/tree/master/try-babel) で実際に試すことができます。

## === とか死ねばいいのにプラグイン

ECMAScriptでは比較演算子に `==` と `===` の2種類がありますが、アプリケーションでは厳密な比較をする `===` しかほぼ使いません。
これは `console.log(1 == '1')` を試してみたら一瞬で理解できるはずです。
ただし、**nullと比較するときだけ**、 ほとんどの場合 `null` と `undefined` を区別しない `==` を使います。
こんな演算子2つも要らないのでどちらも `==` で良きに計らって欲しいですね。
Babelを使って演算子をひとつにまとめてみましょう[^1]。

[^1]: 普通はESLintに自動修正させます

### 考え方

変換したいのは比較演算子です。
これは値を返すので、**何かの式**であることが分かります。
仮に**比較式**とでも名づけておきましょう。
この比較式のどちらかの辺が `null` なら `==`、 そうでなければ `===` を使うように演算子を書き換えます。

### "比較式"を見つける

Babylonで"比較式"を見つけましょう。
リポジトリに[AST仕様書](https://github.com/babel/babylon/blob/6.x/ast/spec.md)があるのでこの中から調べます。
まず `===` で検索すると **BinaryOperator** の一種であることが分かります。
ではBinaryOperatorを使っている式を探すと、すぐその上に **BinaryExpression** が見つかりました。
変換したいのは比較式ではなくBinaryExpressionであり、
BinaryOperatorには `==` 以外にもたくさんの演算子を含むことが分かりました。

### Visitorを書いてみる

まず、お約束のような雛形です。

```js
export default ({types: t}) => ({
  visitor: {
    BinaryExpression: (path) => {
    }
  }
});
```

この関数の中身を書いていけばよいわけですが、その前にテストを書きましょう。

`test/fixtures/equal/equal` ディレクトリを作り、その中に `actual.js` と `expected.js` を書いていきます[^2]。

`actual.js` には変換前のコードを書きます。
変換パターンを網羅しましょう。

```js
1 == 2;1 == null;1 == undefined;null == undefined;
1 === 2;1 === null;1 === undefined;null === undefined;
1 != 2;1 != null;1 != undefined;null != undefined;
1 !== 2;1 !== null;1 !== undefined;null !== undefined;
```

`expected.js` には変換後のコードを書きます。

```js
1 === 2;1 == null;1 === undefined;null == undefined;
1 === 2;1 == null;1 === undefined;null == undefined;
1 !== 2;1 != null;1 !== undefined;null != undefined;
1 !== 2;1 != null;1 !== undefined;null != undefined;
```

テストを実行して失敗する状態を確認しましょう。
スペースの都合で1行にまとめましたが、本来はきちんと改行したり、テストパターンごとにディレクトリを分けたほうがよいでしょう。
これ以外の演算子に影響がないことや、左右辺を入れ替えたり、
実際にはもっとパターンを増やす必要があります。

[^2]: 詳しくはプラグイン作成の準備の章を参照してください

### 関数を実装する

まず `console.log(path.node);` を追加し、テストを動かしてみましょう。
すると `left`, `operator`, `right` のキーがあることが分かるので、
後はこれで場合分けすれば良さそうです。

関数の中身はこのようになります。

```js
const { left, right, operator} = path.node;
const matched = operator.match(/([!|=])==?/);
if (matched) {
  if ((t.isNullLiteral(left) || t.isNullLiteral(right))) {
    path.node.operator = `${matched[1]}=`;
  } else {
    path.node.operator = `${matched[1]}==`;
  }
}
```

正規表現で `operator` をマッチさせ、左右どちらかが `null` かどうかで書き換える演算子を変えています。
ノードの判定は、 `left === null` のような単純な方法ではなく、 `t.isNullLiteral` を使わなければならないことに注意です。
テストを動かすと綺麗な緑色の文字が見えることでしょう。

## Reactiveの実験プラグイン

前章で書き換えは *Reactive* に動くと書きましたが、それを実証するプラグインを書いてみましょう。

```js
if(true) {
  function a() {
    return 1;
  }
}
```

このようなコードを入力したとき、 `return` 文の**親をたどり** `function a` を置き換え、

```js
if (true) {
  if (false) {
  }
}
```

のように変換するプラグインを作ります。
`IfStatement` にログ出力を追加しておき、`return` 文の書き換え後に `IfStatement` のログが出力されるのを確認します。

```js
export default ({types: t}) => ({
  visitor: {
    IfStatement: (path) => {
      console.log('If Statement');
    },
    ReturnStatement: (path) => {
      console.log('Return Statement');
      path.parentPath.parentPath.replaceWith(
        t.ifStatement(
          t.booleanLiteral(false),
          t.blockStatement([])
        )
      );
    }
  }
});
```

`ReturnStatement` の親の親が `function` 文です。
このコードを実行すると、

```
If Statement
Return Statement
If Statement
```

と出力され、親を書き換えた `if` 文に対してもVisitorが作用していることが分かります。

## プラグイン読み込み順を調べる

最後に、以前の約束を果たしましょう。
`plugin` と `preset` がたくさん読み込まれた場合、実行される順序を把握しておかないと思わぬ事故にあう可能性があります。
他のプラグインにより先に変換されてしまい、自分のプラグインが想定した通り動かないことがありそうです。

大量のプラグインが必要なときは、 `require-self` のコードを参考にします。

`node_modules/babel-plugin-a1.js` に

```js
module.exports = require('../plugin-a1');
```

と言うファイルを、 `plugin-a1`, `plugin-a2`, `plugin-b1`, `plugin-b2`, `plugin-c`, `plugin-d`, `preset-a`, `preset-b` のぶん作ります。

さらに、それぞれのプラグインでは単純に

```js
{
  visitor: {
    Program: (path) => {
      console.log('a1');
    }
  }
}
```

のようなログ出力をすれば、出力順でプラグインが呼ばれる順番を確認できます。

`.babelrc` は、

```json
{
  "presets": ["a", "b"],
  "plugins": ["c", "d"]
}
```

です。

これを実行すると、

```
c
d
b1
b2
a1
a2
```

の順でプラグインが実行されることが分かりました。`preset-a` と `preset-b` の呼ばれる順は意外でしたね。
