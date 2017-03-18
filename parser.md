## Parse

Parseは、ソースコードを構文木に変換する作業です。
また、そのような作業をするソフトウェアを **Parser** といいます。
Babelが利用するParserは、[Babylon](https://github.com/babel/babylon)というパッケージにまとまっています。

さて、ここで大変残念なお知らせがあります。
実はこの本の目的のひとつとして、**Parserを拡張して新しい構文を追加する** ことを設定していました。
しかし、[ソースコード](https://github.com/babel/babylon/tree/7.0/src/parser)を読んでみたところ、構文を変更することは**完全に無理**ということが分かりました。

しかし、世の中にはどう考えてもECMAScriptではない文法を導入しているプラグインがあります。
型を導入する **flow** やReactの **jsx** などです。

```js
class Button extends Component {
    render() {
        const text: string = this.state.text;
        return <div>{text}</div>;
    }
}
```

もちろん、ECMAScriptの仕様には(今のところ) `text: string` のようなflowの文法や、
`<div></div>;` のようなjsxの文法は存在しません。
なぜこれらのプラグイン[^1]は文法の拡張ができているのでしょうか?

ソースコードを読んで絶望しました。
これらは、[Babylon本体が提供](https://github.com/babel/babylon/tree/7.0/src/plugins)しているのです。
ズルい・・・

同じような方法で拡張しようにも、BabylonのParserや文法拡張pluginsを登録する配列は**exportされていない**ので、どうにも手を出せないことが確定しました。

[^1]: babel-preset-react と babel-preset-flow

### Parserの動作を読んでみる

Parserはどのようにソースコードをパースしているのでしょうか。
構文解析といえば、非常に重要な要素として、[式](https://github.com/babel/babylon/blob/7.0/src/parser/expression.js)と[文](https://github.com/babel/babylon/blob/7.0/src/parser/statement.js)があり、それぞれに対応したParserが用意されています。

どちらも、 `Parser.prototype` (変数 `pp` )に様々なメソッドを登録しています。

### 式と文

式は**評価**した結果を利用するもの、文はそれ以外[^2]と捉えれば**だいたいあってます**。
プログラム自体は、**文を繋げたもの**です。

```js
const a = 2;
const b = a * a;
if(a > b) {
  console.log(b);
}
```

この場合 `const a = 2;` 、 `const b = a * a;`、 `if ~~~`, `console.log(b)` が文であり、`2`、 `a * a`、 `a > b`, `b` が式です。

式と文は、言語によっても大きく違います。
ECMAScriptでは `a = 1` を評価すると `undefined` ですが、 Rubyでは文も評価値を持ち(あるいはすべてが式であり)、 `a = 1` を評価すると `1` になります。

Rubyでは、

```ruby
a = if true
  'hello'
else
  'world'
end

puts a
#=> 'hello'
```

と書けますが、

```js
const a =  if (true) {
  return 'hello'; // そもそもifの中にreturnは書けない
} else {
  return 'world';
}
```
のようには書けません。

[^2]: 一言で言うと「if文」や「for文」と呼んでいるか、ケツに ; がついた「1文」

### Statementを読んでみる

プログラムは文の集合なので、[`parseStatement`](https://github.com/babel/babylon/blob/7.0/src/parser/statement.js#L56)を見てみましょう。
名前から、**文**をパースする一番大事なメソッドだと考えられます。

この中では、`switch` 文で `starttype` により処理を分割しています。
上から `brake` や `continue`、 `do` や `for` などお馴染みのキーワードが並んでいますね。
それぞれ別の `parseXXXX` メソッドに引き継いでいます。

`parseXXX` は、構文チェックや、さらに別の `parseXXX` を呼ぶなどして、構文木を作っていきます。

### if 文

例えば `if` を処理する [`parseIfStatement`](https://github.com/babel/babylon/blob/7.0/src/parser/statement.js#L283) は、まず `parseParenExpression` を呼び、次に続く(はずの)`( 式 )` をパースし、ifの構文木の `test` というプロパティに設定します。
`parseParenExpression` の中では、`this.expect(tt.parenL)` という処理で、次の文字が `(` であることを期待しています。
もし次に続くものが `(` でない場合、このメソッドが例外を吐くことで、文法の正しさをチェックしています。

次に、`parseStatement` を呼んで `consequent` というプロパティに設定しています。
ここまで来たらもう後の部分も解読できるでしょう。
全体を読むと `if` のノードは、 `if ( 式 ) 文 else文?` の形式であることが分かります。
もちろん、 `{ 文; 文; 文; }` も文、 `if ...` も文なので、みなさんのよく知っている、

```js
if ( 式 ) {
  文; 文; 文;
} else if (式) {
  文; 文; 文;
} else if (式)
  文
else 文
```

という記述[^3]がパースできるのです。
` } else if (...) { ` は、 `else` までが最初の `parseIfStatement` で、次の `if` からは新たな `parseStatement` から呼ばれた 次の `parseIfStatement` なんですね。

[^3]: 実際の業務のコードで {} のないStatementを書いたら殺します

### function

`function` という構文を処理してみましょう。
ECMAScriptで `function` を書くパターンはいくつかあります。

```js
function foo(a, b) {
  return a + b;
}

const bar = function(a, b) {
  return a - b;
}
```

上は**function文**であり、下は**function式**です。
試しにリポジトリ内を `parseFunction` で検索してみると、`statement.js` には `parseFunctionStatement`、 `expression.js` には `parseFunctionExpression` が見つかります。
完全に予測可能な結果です。驚き最小の原則に従ってうまく設計されていますね。
どちらも内部で最終的に [`parseFunction`](https://github.com/babel/babylon/blob/7.0/src/parser/statement.js#L578) を呼んでいます[^4]。
`parseFunction` の内部では、いろいろな条件はさくっと無視すると `parseFunctionParams` と `parseFunctionBody` を呼び出していることが分かります。

[^4]: これがstatement.jsにあるのは少し謎

### 文法拡張プラグインの正体

ここでおもむろに [flow文法プラグイン](https://github.com/babel/babylon/blob/7.0/src/plugins/flow.js)に意識を飛ばしてみましょう。

先ほどの `parseFunctionParams` や `parseFunctionBody` で検索してみてください。
`instance.extend` という処理で、それぞれのメソッドがオーバーライドされています。

`parseFunctionParams` の場合は、 (function fooの)次に `<` の文字が来たら、flowのテンプレート宣言 `function foo<T> ( ... ) ... ` であると判断し `<T>` の処理をし、残りの `(` 以降を元のメソッドに引き継いでいます。
`parseFunctionBody` の場合は、 (Paramsの)次に ':' の文字が来たら、 メソッドの戻り値の型を宣言する `: number { ...` であると判断し、 `: number` の処理をし、 残りの `{` 以降を元のメソッドに引き継いでいます。

他にも様々なメソッドが同様の方法でオーバーライドされ、
flowの文法を**受理**できるように拡張されています。

### 文法を拡張するには

ユーザが文法拡張することは現状できません。
Parserさえexportされればできるという感じでもなさそうです。
ここから先に出てくるコードは、実際には試せていないので**全て妄想**です。

まず、文法に新しいキーワード(ifやfunctionなどの予約語)を追加したい場合、**Tokenizer**に[キーワード登録](https://github.com/babel/babylon/blob/7.0/src/tokenizer/types.js)が必要です。
Tokenizerクラスでは、このキーワード情報をファイルスコープの変数として扱っているので、外部から操作することができません。
キーワード情報をクラスの内部に変数で持つようになればプラグインから操作可能になるでしょう。
このキーワード情報は他のファイルからもいくつか参照されており、同様に操作不可能になっています。
`types.js` 自体にプラグイン機構がないと無理そうです。

ただ、キーワードに登録できなくても、不明な文字列は全て `name` というトークンとして処理されるので、`parseXXX` 側でがんばるという選択肢が残っています[^5]。

次に、実際にパースするところを拡張します。
文法を拡張する程度ならflowプラグインの実装が参考になるでしょう。
新しいキーワードを実装するなら、基本的に `parseStatement` や `parseExpression` から攻めていくのが良さそうです。
ちょうど、[async](https://github.com/babel/babylon/blob/7.0/src/parser/statement.js#L114)がやっているような感じです。

```js
export default function(instance) {
  instance.extend("parseStatement", function(inner) {
    return function(declaration, topLevel) {
      const starttype = this.state.type;
      const node = this.startNode();
      switch(starttype) {
         case tt.name:
           if (this.state.value === 'unless') {
              return this.parseIfStatement(node);
           }
     }
     return inner.call(this, declaration, topLevel);
  }
});
```

これで、 `unless` の文字列を見た場合、それ以降を `IfStatement` としてパースしてくれるようになりそうです[^6]。
もちろん、 `parseXXX` を追加すれば、どんな文法でもパースできるようになるはずです。

[^5]: これをがんばれるならParserがexportされていれば文法拡張可能
[^6]: この段階ではまだパースが成功するだけということに注意
