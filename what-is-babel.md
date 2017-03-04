# Babelとはなにか

JavaScriptのエコシステムの中でもとりわけ重要な役割を果たしているBabelとは一体何者でしょうか。
一言でいうと、Babelは**トランスパイラ**(Transpiler)と呼ばれるます。
当然いきなりそう言われても「なんじゃそりゃ?」となるでしょう。

似たような言葉で**コンパイラ**というのは聞いたことがあるでしょう。
コンパイラはソースコードをコンパイルして**バイナリファイル**(正確に言うとオブジェクトファイル)を作るソフトウェアです。
トランスパイラとは、**Trans**(変換)の接頭詞が示す通り、**ソースコードをソースコードに変換**するソフトウェアです。
それでもやっぱり「なんじゃそりゃ??」ってなりますね。
なんでソースコードをソースコードに変換するのか意味がわかりません。
それを知るにはJavaScript、いや**ECMAScript**の歴史を紐解かなければなりません。

なお、この歴史は**インターネットともに生きてきたおっさんのノスタルジー**を徹底的に感じて欲しいので、**あえて資料にあたることを一切せず**、完全に記憶のみを頼りに記述していきます。
そのため、想い出補正により**間違い、誇張、美化**されている可能性があります。

## 生い立ちからGoogle以前

前述の通り、JavaScriptは**ブラウザに雪を降らせるため**開発され、Netscape Navigatorに搭載されました。
元々はLiveScriptという名前だったのが、**Javaが流行ってたから**というクソな理由でJavaScriptと名付けられました。
すべての不幸の始まりです。

直後にMicrosoftも**JScript**という名前でJavaScriptっぽいものをInternet Explorerに搭載しました。
これにより、**互換性のないHTMLと互換性のないJavaScript**という、後に第1次ブラウザ戦争と呼ばれる最悪な時代を迎えます。

このような状況から、JavaScriptは本来の雪を降らすという使命以外に使いみちがなく、
Flashの流行を横目にJavaScriptは完全に要らない子と言われ、
いわゆる**ネット原住民**からは**とりあえずJavaScriptをオフにする**[^1]という扱いを受けてしまいます。
この時代、サーバサイドで動的にHTMLを出力し、動的コンテンツはFlashを使うのが一般的でした。

[^1]: 特に、JavaScriptは遅いという神話が理由であると思う

## GoogleMapの革命

2005年にGoogleMapが登場したことで状況は一変しました。
GoogleMapは、ご存知のようにJavaScriptのXMLHttpRequestとDOM書き換えをフル活用し、プラグイン不要でどんな[^2]ブラウザでも動き、しかも動作が軽快と、これまでのJavaScriptの印象からは全く正反対のアプリケーションでした。
この革命的なアプリケーションにより、人々はJavaScriptの価値を再発見しました。

この**Ajaxの発見**と、ブラウザの互換性を吸収してくれる**jQuery**の普及により、
動的コンテンツの主役は完全にJavaScriptに移りました。
フロントエンドもプログラマの範疇[^3]に変化し、Flash凋落の未来はこの時既に決まっていたのです。

[^2]: まともなものに限る
[^3]: Flashは基本的にデザイナのものでした

## Node.jsの登場

フロントエンドが完全にJavaScriptの支配下になったものの、
この時でさえまだJavaScriptの動作環境は各ブラウザしかありませんでした。
そんな時、サーバサイドもJavaScriptで書きたいという**トチ狂った**一部の人達が、
ブラウザではないJavaScriptの動作環境を作りました。
**Node.js**爆誕です。

Node.jsはノンブロッキングI/Oを採用し、当時問題となっていた**クライアント1万台問題**を解決するなど、実力も話題性も十分でしたが、プログラミングスタイルにだいぶ癖があり[^4]、当初はそこまで爆発的に普及しませんでした。

しかし、このNode.jsを舞台に、
ブラウザのJavaScriptにはなかったモジュールロードの仕組みのCommonJSや、
パッケージリポジトリのnpmなどが整えられていき、
後のJavaScript大躍進の礎となったのです。

[^4]: いわゆるコールバック地獄など

## Flashの死とHTML5

皆に憎まれていたFlashが殺されました。
その代用として用意されたのが、**HTML5**と言われる次世代のHTML(とJavaScript)の規格です。[^5]

このHTML5という規格は、過去のブラウザ戦争の反省から、**実装をベースに規格を作る**というアプローチをとっており、つまり**できてる奴に合わせろ**となるのでブラウザ間の互換性が大幅に向上しました。
JavaScriptも同様に互換性大事ということになり、
JavaScriptの規格として存在はしたものの、
これまであまり重要視されてこなかった**ECMAScript**がにわかに脚光を浴びます。
2009年には10年の沈黙を経て新しいバージョンが策定され、
さらに2015年からは年ごとに、機能単位で新しい仕様が追加されたバージョンが**es2015**といった名前で公開されることになりました。

[^5]: むしろHTML5の目処が付いたからFlashが殺されたとも言える

## Babelの登場

ECMAScriptの活動は活発になったのですが、もちろんブラウザに搭載されたJavaScriptはその進化についていけません。
そこで、新しいECMAScriptの仕様にそって書かれたコードを、
同等の機能を持つ古いJavaScriptに変換するという手法が考案されました。
この役割を担ったのが**Babel**なのです。
Babelの成功により、トランスパイルの可能性は広がり、
今ではECMAScriptを変換するだけでなく、
他の様々な仕様外の機能[^6]がBabelを通して提供されるようになっています。

雪を降らせるだけだったJavaScriptは、いまやECMAScriptと呼ばれ、
以前からは想像できないほど多様な活躍をしています。

[^6]: たとえば型を導入するflowなど