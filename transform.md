## Transform

Transformは、Parserにより構築された**構文木を操作する**作業です。
Babelのプラグインは、主にこの作業**のみ**をします。

以前に見たように、プラグインは**Visitorパターン**が採用されています。

### Visitorパターンのおさらい

[Visitorパターン](https://ja.wikipedia.org/wiki/Visitor_パターン)は、振る舞いに関するパターンのひとつです。
データ構造を持つオブジェクトと、その処理を行うオブジェクトを分離することができます。
処理を行うオブジェクトを**Visitor(訪問者)**と呼びます。

Visitorがオブジェクトを訪問すると、オブジェクトは自分自身を引数としてVisitorの特定のメソッドを呼び出します。
Visitor側のメソッドは、受け取ったデータ構造を利用し、データを出力したり、変更したり、様々な処理を行うことができます。
お堅い言語の場合 `Interface` を利用して、オブジェクトがどのようなメソッドを要求しているのか明示するでしょう。

```java
interface Visitor {
  void visit(Human h);
}

class Human {
  String name;
  boolean isAlive;

  public Human(String name) {
    this.name = name;
    this.isAlive = true;
  }

  public String getName() {
    return this.name;
  }

  public void setAlive(boolean state) {
    this.isAlive = state;
  }

  public void accept(Visitor v) {
    v.visit(this);
  }
}

class GrimReaper implements Visitor{
  public void GrimReaper(String name) {
    this.name = name;
  }

  public void visit(Human h) {
    System.out.println(this.name + "is killing " + h.getName());
    h.setAlive(false);
    System.out.println("Done");
  }
}

Human human = new Human("渋井丸拓男");
Visitor visitor = new GrimReaper("Luke");
human.accept(visitor);
```

人に死をもたらすことができました。[^1]

昔の人は、死という機能(あるいは現象)を死神の仕業だと考えました。
これはまさにVisitorパターンであり、Visitorパターンは**機能の擬人化**と言えるのではないでしょうか。

単純に人というオブジェクトに死ぬというメソッド `die()` を定義することもできるのですが、
わざわざVisitorパターンを使い、死ぬという機能を分離できていることが分かります。
死神を差し向ければ人は死ぬのです。


[^1]: Javaとか200兆年ぶりに書いた

### BabelプラグインのVisitor

Babelプラグインがどのように動作するかVisitorパターンに当てはめていきましょう。
以前見た時と同じように、今回も `babel-plugin-transform-es2015-arrow-functions` を例にします。
このプラグインの中身は、

```js
{
  visitor: {
    ArrowFunctionExpression: function(path, state) {
    }
  }
}
```

というオブジェクトを返す関数であることが分かります。
以前は分からなかった `ArrowFunctionExpression` の意味、
Parserを攻略した皆さんなら簡単に理解できるでしょう。
もちろん、アロー関数式 `() => {}` のことです。
より正確に言うと、Parserが構築した**ノードの種類**です。

というわけで、このプラグインは **アロー関数式にはこのfunctionを適用する** という宣言をしていることが読み取れます。
同じように他の式や文、特殊なノードである `Program` などを指定できます。
具体的には、Babylonのソースコードを `finishNode` でgrepすると、Visitorに指定できる名前が全てリストアップできます。

### Visitorメソッドの中身

中身も読んでみましょう。
引数で渡される `path` にいろいろな操作をしていることが読み取れます。
`path.node` プロパティでノードにアクセスしたり、 `path.get` や `path.replaceWith` などのメソッドでノードの置き換えを行っていることが分かります。
[API一覧](https://github.com/thejameskyle/babel-handbook/blob/master/translations/ja/plugin-handbook.md#transformation-operations)はハンドブックにあります。

`t.callExpression` などのメソッドは、[`babel-types`](https://github.com/babel/babel/tree/6.x/packages/babel-types)が提供する機能で、新しい構文木を作り出す命令のようです。

```js
t.callExpression(
  t.memberExpression(node, t.identifier("bind")),
  [t.thisExpression()]
)
```

は

```js
node.bind(this);
```

の構文木を作ります。
他にも、[`babel-template`](https://github.com/babel/babel/tree/master/packages/babel-template)で構文木を作ることもできます。

### 変換の手順

最後に変換の手順を見ていきましょう。
構文木は、木というだけあって、全ての根である**ルートノード**から、枝として**ノード**が分かれています。
枝からも枝が分かれ、ノード同士の親子関係を表現しています。
これは**DOMツリー**でよく馴染みがあるのではないでしょうか。

例えば前述の `IfStatement` では、 `if (condition)` の `condition` を表す式を `test` というプロパティに設定していました。
DOMのように単純ではないですが、このように親子関係が作られています。

Transformは、まずルートノードから変換を行い、さらにその子ノードを変換していきます。
変換すべき子ノードのプロパティは [babel-types](https://github.com/babel/babel/blob/6.x/packages/babel-types/src/definitions/core.js#L322) で定義されています。
`IfStatement` なら `test, consequent, aternate` のプロパティを子ノードとして扱うよう定義されています。

子ノードを書き換えた時はもちろん、 親ノードを書き換えた時でも、書き換え後の構文木に対応する変換が実行されます。
このため、あたかも**Reactive**な書き換えが行われているように感じるでしょう。
当然、間違った書き方をすると無限ループに陥る可能性があるので注意が必要です。
