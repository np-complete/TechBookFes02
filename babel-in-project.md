# プロジェクトの中のBabel

前章で、実際のプロジェクトでは `babel` コマンドを使わないと書きました。
それではどのような呼び出し方をされるのでしょうか。
実は、Babelを使う上で一番難しく、引っかかる部分はここなのではないかと思います。

プロジェクトの中では、`npm` でインストールできる様々なJavaScriptソフトウェアが使われます。
例えば、ユニットテストをする `mocha` や、みんな大好き[^1] `webpack` などがあります。
これらのソフトウェアは、本来は古いJavaScriptしか理解できないはずですが、
多くの場合内部でBabelを使う方法を**それぞれ独立して**持っています。

とてもめんどくさい。

[^1]: 俺は嫌い

## 例: mocha

mochaはユニットテストのフレームワークです。
もちろんBabelを使わなければ、
ソースコードにもテストコードにも最新のECMAScriptは使えません。

mochaの場合、このようなオプションを渡すと、
ソースコードもテストコードもどちらもBabelでトランスパイルできます。

    $ mocha --require babel-register --compilers js:babel-register test/*.test.js

意味のわからないオプションですね。
`babel-cli` は不要で、 `babel-register` だけインストールされていれば動きます。

## 例: webpack

webpackは、スクリプトだけでなくCSSや画像までをも、Web配信に適した形にまとめるソフトウェアです。
webpackは様々なフォーマットのファイルをJavaScriptで読み込める形にするために、**loader** という仕組みを使います。

例えば、 `json-loader` は、JSONファイルを `require` すると、ただのJSONではなく

```js
module.exports = ファイルをJSONとして解釈したデータ
```

という形に変換されたファイルを `require` します[^2]。

Babelを使いたいのなら、 `babel-loader` を設定すれば簡単にトランスパイルできます。
`babel-cli` は必要ありません。

    $ npm install -D webpack babel-loader json-loader

`webpack.config.js` はこのようになります

```js
module.exports = {
  module: {
    loaders: [
      { test: /\.js$/,   loader: 'babel' },
      { test: /\.json$/, loader: 'json'  }
    ]
  }
}
```

[^2]: これも思想はBabelと一緒ですね

## 例: 手動

これらのオプションを使わない、またはこういうオプションがない場合、
手動でトランスパイルする必要があります。
例えばmochaなら、

- `src/*` を `lib/*`
- `src.test/*` を `test/*`

にトランスパイルし[^3]、

    $ NODE_PATH=./lib mocha ./test/*.test.js

を実行するとおそらく正しくテストができるはずです。

ただこの場合、失敗したテストのスタックトレースなどは、
**トランスパイル後のファイル**に準じるので、非常に不便を感じることになるでしょう。

[^3]: babel --watch でファイルの更新をフックするとよいでしょう

## まとめ

それぞれのソフトウェアごとに、**正しいBabelの設定方法**を把握しないといけません。
かなりダルいです。
全部違います。
非常にダルいです。

## おまけ: npmにパッケージを公開する

npmにパッケージを公開する場合、そのコードは**素のNode.jsで実行できないといけません**[^4]。
よって最新のECMAScriptで書かれたソースコードは、公開前にトランスパイルしなければなりません。

多くの場合、 `src/` のECMAScriptコードを `lib/` に出力するようにしています。
`package.json` に

```
{
  "scripts": {
     "prepublish": "babel -d lib src"
  }
}
```

と書いておけば、publish時に自動でトランスパイルしてくれるようになります。

gitリポジトリには `src/` のみをコミットし、npmには `lib/` のみをpublishします。
これには `.gitignore` と `.npmignore` を利用します。

`.gitignore` には

```
node_modules/
lib/
```

を

`.npmignore` には

```
node_modules/
src/
```

を含めるようにします。
`.npmignore` が無いと `.gitignore` が代わりに使われてしまうので、
公開されたパッケージになぜか `lib/` が存在しないという気づきにくい罠にハマってしまいます。

[^4]: 公開できないわけではなく、Babelを使わない人が困るだけ
