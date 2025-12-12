const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

// 静的ファイル（index.html, app.js, style.cssなど）を配信します。
app.use(express.static(__dirname));

// 共有するゲームの状態
let connectedPlayers = [];
let MAX_PLAYERS = 2;
// 標準入力からプレイヤー人数を受け取りサーバーを起動するための readline は
// ファイル下部の server.listen 呼び出しの代わりに使用します。

// サーバーサイドの職業定義
const STATUS = {
    swordsman: { HP: 40, MP: 20, money: 20 },
    wizard:    { HP: 30, MP: 80, money: 40 },
    warrior:   { HP: 50, MP: 10, money: 20 },
    royalty:   { HP: 30, MP: 0, money: 60 },
};

// 職業別アイテム情報
const Items = {
    //剣士
    swordsman:[
        //武器
        {name: "木のオタマ", power: 1, price: 1, element: "無", category: "weapon", probability: 1, info: "ただの木のオタマ", img: "img/kiNoOtama.jpg"},
        {name: "ムチ", power: 3, price: 2, element: "無", category: "weapon", probability: 1, info: "勢いよく打ち付ける道具、衝撃が強い", img: "img/whip.jpg"},
        {name: "ナイフ", power: 4, price: 3, element: "無", category: "weapon", probability: 2, info: "小型で扱いやすい刃物、切れ味は抜群だ", img: "img/knife.jpg"},
        {name: "兵士の剣", power: 6, price: 5, element: "無", category: "weapon", probability: 4, info: "戦いのときに使用される一般的な剣", img: "img/warriorsword.jpg"},
        {name: "鋼の剣", power: 7, price: 5, element: "無", category: "weapon", probability: 3, info: "鉄を加工して作成された強固な剣、兵士の剣より強力だ", img: "img/steelsword.jpg"},
        {name: "弓と矢", power: 8, price: 6, element: "無", category: "weapon", probability: 3, info: "遠距離から攻撃可能な武器、威力も申し分ない", img: "img/bowandarrow.jpg"},
        {name: "ゴーストソード", power: 9, price: 7, element: "無", category: "weapon", probability: 3, info: "切り裂く斬撃を残さない特殊な剣", img: "img/ghost.jpg"},
        {name: "大剣", power: 12, price: 10, element: "無", category: "weapon", probability: 3, info: "一振りが大変だが、攻撃力は高い", img: "img/greatsword.jpg"},
        {name: "ダイヤモンドの剣", power: 14, price: 11, element: "無", category: "weapon", probability: 5, info: "貴重なダイヤ鉱石を使った希少性の高い剣", img: "img/diamondsword.jpg"},
        {name: "伝説の剣", power: 25, price: 25, element: "無", category: "weapon", probability: 2, info: "存在しないとされていた伝説の剣、攻撃力は魔王を一撃で葬るほど高い。", img: "img/legendarysword.jpg"},
        {name: "たいまつ", power: 3, price: 2, element: "火", category: "weapon", probability: 2, info: "あたりを照らす道具、あまり殺傷性はない", img: "img/taimatu.jpg"},
        {name: "熱したナイフ", power: 5, price: 7, element: "火", category: "weapon", probability: 2, info: "掠るだけでも火傷を負わす、小型武器", img: "img/fireknife.jpg"},
        {name: "フレイムソード", power: 7, price: 9, element: "火", category: "weapon", probability: 2, info: "火を纏った戦闘用武器、火をあたりにまき散らす", img: "img/framesword.jpg"},
        {name: "つらら", power: 2, price: 3, element: "水", category: "weapon", probability: 2, info: "持つと冷たい先の尖った氷柱、持つと冷たい", img: "img/icicle.jpg"},
        {name: "水剣", power: 4, price: 6, element: "水", category: "weapon", probability: 2, info: "水剣ではない、水剣（すいけん）だ（？）", img: "img/watersword.jpg"},
        {name: "フローズンソード", power: 7, price: 11, element: "水", category: "weapon", probability: 2, info: "水を凍らせ、殺傷性を高めた氷の剣。", img: "img/frozensword.jpg"},
        {name: "シビレ包丁", power: 3, price: 2, element: "雷", category: "weapon", probability: 2, info: "帯電をさせた包丁、あまり強くはない", img: "img/numbnesskitchenKnife.jpg"},
        {name: "イカ・ヅチ", power: 5, price: 6, element: "雷", category: "weapon", probability: 2, info: "槌で殴った後も相手を痺れにより相手を苦しめる", img: "img/thunderHammer.jpg"},
        {name: "封雷剣", power: 7, price: 12, element: "雷", category: "weapon", probability: 2, info: "詠唱をすれば究極奥義を放てるらしい…？", img: "img/furaiken.jpg"},
        {name: "光の剣", power: 3, price: 3, element: "光", category: "weapon", probability: 2, info: "聖なる力を宿した剣、相手を浄化させる", img: "img/rightsword.jpg"},
        {name: "シャイニングブレード", power: 6, price: 10, element: "光", category: "weapon", probability: 2, info: "輝かしき大剣、闇すらも切り裂く", img: "img/shiningblade.jpg"},
        {name: "聖剣エクスカリバー", power: 9, price: 15, element: "光", category: "weapon", probability: 2, info: "約束された勝利の剣…と記されている", img: "img/excalibur.jpg"},
        {name: "闇喰剣", power: 3, price: 4, element: "闇", category: "weapon", probability: 2, info: "闇ですべてを飲み込むおぞましい剣", img: "img/darkeatersword.jpg"},
        {name: "宵闇の大剣", power: 4, price: 2, element: "闇", category: "weapon", probability: 2, info: "これを刺されたものは意識が消える", img: "img/greatSwordofTwilight.jpg"},
        {name: "政宗", power: 7, price: 12, element: "闇", category: "weapon", probability: 2, info: "なにやら片翼が生える噂がある…？", img: "img/masamune.jpg"},

        //防具
        {name: "ナベのフタ", power: 1, price: 2, element: "無", category: "armor", probability: 5, info: "ただのナベのフタ", img: "img/nabeNoFuta.jpg"},  
        {name: "兵士の兜", power: 5, price: 5, element: "無", category: "armor", probability: 2, info: "一般的に普及している兜", img: "img/Soldierhelmet.jpg"},
        {name: "フライパン", power: 3, price: 5, element: "無", category: "armor", probability: 2, info: "反撃にも使えなくはない鉄製の料理器具", img: "img/fryingpan.jpg"},
        {name: "兵士の鎧", power: 6, price: 8, element: "無", category: "armor", probability: 3, info: "一般的に普及している鎧", img: "img/soldierarmor.jpg"},
        {name: "金の鎧", power: 6, price: 20, element: "無", category: "armor", probability: 2, info: "金色に輝く鎧、価値は高い", img: "img/goldenarmor.jpg"},
        {name: "ガントレット", power: 8, price: 13, element: "無", category: "armor", probability: 3, info: "顔を守ってくれる、銃弾すらはじき返す", img: "img/gauntlet.jpg"},
        {name: "ガラス細工の美しい盾", power: 9, price: 20, element: "無", category: "armor", probability: 3, info: "職人が手掛ける世にも珍しいガラスの盾", img: "img/glassshield.jpg"},
        {name: "勇者の盾", power: 14, price: 20, element: "無", category: "armor", probability: 3, info: "かつて伝説の勇者の語り継がれる盾", img: "img/heroshield.jpg"},
        {name: "アルテマシールド", power: 25, price: 15, element: "無", category: "armor", probability: 2, info: "究極であり、最高の素材を掛け合わせた一品", img: "img/altemashield.jpg"},
        {name: "バーニングヘルム", power: 3, price: 7, element: "火", category: "armor", probability: 2, info: "頭は燃えずに強固な守りを見せるヘルム", img: "img/burninghelmet.jpg"},
        {name: "消防服", power: 6, price: 11, element: "火", category: "armor", probability: 3, info: "消防隊に支給されている装備、防火性能はばっちり", img: "img/firefightinggear.jpg"},
        {name: "レインブーツ", power: 3, price: 7, element: "水", category: "armor", probability: 2, info: "軽やかに動けるレインブーツ、ゴム製", img: "img/rainboots.jpg"},
        {name: "サーフボード", power: 5, price: 9, element: "水", category: "armor", probability: 3, info: "縦長のため意外と使い勝手は悪くない", img: "img/surfboard.jpg"},
        {name: "ライトニングブーツ", power: 4, price: 7, element: "雷", category: "armor", probability: 2, info: "雷を纏う脛あて、感電はしないようだ", img: "img/lightningboots.jpg"},
        {name: "雷雨の頭巾", power: 7, price: 11, element: "雷", category: "armor", probability: 3, info: "電気も雨も通さない特殊な頭巾", img: "img/ThunderstormHood.jpg"},
        {name: "天ノ盾", power: 4, price: 6, element: "光", category: "armor", probability: 2, info: "天から降り落ちた盾、神々しい", img: "img/skyshield.jpg"},
        {name: "エンジェルズバリア", power: 8, price: 12, element: "光", category: "armor", probability: 4, info: "天使の力でバリアを展開する", img: "img/angelsbarrier.jpg"},
        {name: "ダークシールド", power: 4, price: 7, element: "闇", category: "armor", probability: 2, info: "闇の地底世界で作られたもの、常人には扱えない", img: "img/darkshield.jpg"},        
        {name: "ヘルズプロテクター", power: 8, price: 13, element: "無", category: "armor", probability: 3, info: "地獄で作られたアーマー、物理と闇に対しての耐性が高い", img: "img/hellsprotector.jpg"},
        
        //魔法
        {name: "＜オーラ＞", power: 0, price: 10, element: "無", category: "magic", probability: 5, info: "攻撃力を倍にする", img: "img/attackaura.jpg"},
        {name: "＜オ一ラ＞", power: 10, price: 5, element: "無", category: "magic", probability: 2, info: "目に見えないフィールドを展開し、相手の攻撃を無効化する", img: "img/aura.jpg"},
        {name: "＜ビ一ム＞", power: 3, price: 3, element: "光", category: "magic", probability: 2, info: "光の下級魔法、当たると焦げる", img: "img/beam.jpg"},
        {name: " ＜ファイア＞ ", power: 3, price: 3, element: "火", category: "magic", probability: 2, info: "火の下級魔法、威力は控えめ", img: "img/fire.jpg"},
        {name: " ＜アイス＞ ", power: 3, price: 3, element: "水", category: "magic", probability: 2, info: "水の下級魔法、相手の動きを鈍らせる", img: "img/ice.jpg"},
        {name: " ＜サンダー＞ ", power: 4, price: 4, element: "雷", category: "magic", probability: 2, info: "雷の下級魔法、相手を痺れさせる", img: "img/thunder.jpg"},
        {name: " ＜ダーク＞ ", power: 3, price: 3, element: "闇", category: "magic", probability: 2, info: "", img: "闇の下級魔法、掠るだけでも致命傷になりかねない",  img: "img/dark.jpg"},

    ],
    //魔法使い
    wizard:[
        //武器
        {name: "木の杖", power: 1, price: 1, element: "無", category: "weapon", probability: 1, info: "これで殴れば打撲くらいはできる", img: "img/woodenstaff.jpg"},
        {name: "魔法使いの杖", power: 3, price: 3, element: "無", category: "weapon", probability: 1, info: "杖で殴るなんて...品性のかけらもないっ！", img: "img/wizard'swand.jpg"},
        {name: "炎の杖", power: 5, price: 5, element: "火", category: "weapon", probability: 2, info: "先端に炎を帯びた杖", img: "img/firestaff.jpg"},
        {name: "氷の杖", power: 5, price: 5, element: "水", category: "weapon", probability: 2, info: "先端に氷を帯びた杖", img: "img/waterstaff.jpg"},
        {name: "雷の杖", power: 5, price: 5, element: "雷", category: "weapon", probability: 2, info: "先端に雷を帯びた杖", img: "img/thunderstaff.jpg"},

        //防具
        {name: "ローブ", power: 4, price: 7, element: "無", category: "armor", probability: 4, info: "魔法使い御用達のローブ", img: "img/robe.jpg"},
        {name: "魔法の帽子", power: 4, price: 6, element: "無", category: "armor", probability: 4, info: "魔法使い御用達の帽子", img: "img/magichat.jpg"},
        {name: "魔導書", power: 4, price: 10, element: "無", category: "armor", probability: 4, info: "魔法使い御用達の魔導書", img: "img/grimoire.jpg"},
        {name: "ブーツ", power: 4, price: 5, element: "無", category: "armor", probability: 4, info: "魔法使い御用達のブーツ", img: "img/boots.jpg"},

        //魔法
        {name: "＜ニードル＞", power: 3, price: 2, element: "無", category: "magic", probability: 1, info: "鋭い針を出し攻撃する無属性魔法", img: "img/needle.jpg"},
        {name: "＜一般攻撃魔法＞", power: 4, price: 3, element: "無", category: "magic", probability: 1, info: "別名ゾル〇ラーク", img: "img/ippannkougekimahou.jpg"},
        {name: "＜バリア＞", power: 3, price: 2, element: "無", category: "magic", probability: 1, info: "前方に障壁を展開し、攻撃を防ぐ", img: "img/barrior.jpg"},
        {name: "＜シールド＞", power: 6, price: 4, element: "無", category: "magic", probability: 1, info: "バリアよりも固い障壁を展開できる", img: "img/shield.jpg"},
        {name: "＜オ一ラ＞", power: 8, price: 6, element: "無", category: "magic", probability: 1, info: "目に見えないフィールドを展開し、相手の攻撃を無効化する", img: "img/aura.jpg"},
        {name: "＜イージスガード＞", power: 12, price: 8, element: "無", category: "magic", probability: 1, info: "アテナの力を借りて完成した強固な守備魔法", img: "img/aegisguard.jpg"},
        {name: "＜ファイア＞", power: 3, price: 3, element: "火", category: "magic", probability: 1, info: "火の下級魔法、威力は控えめ", img: "img/fire.jpg"},
        {name: "＜バーニング＞", power: 5, price: 5, element: "火", category: "magic", probability: 1, info: "ファイアの威力の数倍を放てる", img: "img/burning.jpg"},
        {name: "＜ギガフレア＞", power: 7, price: 7, element: "火", category: "magic", probability: 1, info: "直線状に長い距離を燃やし尽くす", img: "img/gigaflare.jpg"},
        {name: "＜プロミネンス＞", power: 15, price: 15, element: "火", category: "magic", probability: 1, info: "爆発的に周囲を巻き込む", img: "img/prominence.jpg"},
        {name: "＜エクスプロージョン＞", power: 25, price: 20, element: "火", category: "magic", probability: 1, info: "圧倒的範囲で全てを燃やす、危険な魔法", img: "img/explosion.jpg"},
        {name: "＜アイス＞", power: 3, price: 3, element: "水", category: "magic", probability: 1, info: "水の下級魔法、相手の動きを鈍らせる", img: "img/ice.jpg"},
        {name: "＜フロスト＞", power: 6, price: 6, element: "水", category: "magic", probability: 1, info: "アイスを元に応用して作られた中級魔法", img: "img/frost.jpg"},
        {name: "＜ブリザード＞", power: 10, price: 10, element: "水", category: "magic", probability: 1, info: "雪嵐を起こし、相手を凍らせる", img: "img/blizzard.jpg"},
        {name: "＜メイルシュトローム＞", power: 14, price: 14, element: "水", category: "magic", probability: 1, info: "大きな渦を起こし、相手を飲み込む", img: "img/malestrom.jpg"},
        {name: "＜アブソリュートゼロ＞", power: 20, price: 17, element: "水", category: "magic", probability: 1, info: "絶対零度、それだけで説明は十分だ。", img: "img/absolutezero.jpg"},
        {name: "＜サンダー＞", power: 4, price: 4, element: "雷", category: "magic", probability: 1, info: "雷の下級魔法、相手を痺れさせる", img: "img/thunder.jpg"},
        {name: "＜スパーク＞", power: 6, price: 6, element: "雷", category: "magic", probability: 1, info: "周囲に雷で覆われたフィールドを生成する", img: "img/spark.jpg"},
        {name: "＜ライトニング＞", power: 9, price: 9, element: "雷", category: "magic", probability: 1, info: "目にも見えない速さで電撃が走る", img: "img/lightning.jpg"},
        {name: "＜エレクトリックガン＞", power: 12, price: 12, element: "雷", category: "magic", probability: 1, info: "電撃を銃のように発射し、貫く", img: "img/electricgun.jpg"},
        {name: "＜テンペスト＞", power: 18, price: 18, element: "雷", category: "magic", probability: 1, info: "風と雷を纏い、周囲をすべて吹き飛ばす嵐を作り出す", img: "img/tempest.jpg"},
        {name: "＜ビーム＞", power: 3, price: 3, element: "光", category: "magic", probability: 1, info: "光の下級魔法、当たると焦げる", img: "img/beam.jpg"},
        {name: "＜フラッシュ＞", power: 5, price: 5, element: "光", category: "magic", probability: 1, info: "あたり一面を光で覆いつくし視界を奪う", img: "img/flash.jpg"},
        {name: "＜シャイニング＞", power: 7, price: 7, element: "光", category: "magic", probability: 1, info: "輝きを放ち、焼き尽くす", img: "img/shining.jpg"},
        {name: "＜プリズム＞", power: 10, price: 10, element: "光", category: "magic", probability: 1, info: "光を分散し、相手に致命傷を与える", img: "img/prism.jpg"},
        {name: "＜サンバースト＞", power: 15, price: 15, element: "光", category: "magic", probability: 1, info: "太陽の爆発したかのような瞬間的な光を放つ", img: "img/sunburst.jpg"},
        {name: "＜ダーク＞", power: 3, price: 3, element: "闇", category: "magic", probability: 1, info: "闇の下級魔法、掠るだけでも致命傷になりかねない",  img: "img/dark.jpg"},
        {name: "＜ナイトフォール＞", power: 5, price: 5, element: "闇", category: "magic", probability: 1, info: "あたりを暗くし、何も見えなくする", img: "img/nightfall.jpg"},
        {name: "＜ファントム＞", power: 7, price: 7, element: "闇", category: "magic", probability: 1, info: "幻影を発生させ、相手に恐怖を植え込む", img: "img/phamtom.jpg"},
        {name: "＜エクリプス＞", power: 10, price: 10, element: "闇", category: "magic", probability: 1, info: "日食、月食を起こし、相手を蝕む", img: "img/eclipse.jpg"},
        {name: "＜ブラックホール＞", power: 15, price: 15, element: "闇", category: "magic", probability: 1, info: "すべてを飲み込む、決して何も見えることのない穴", img: "img/blackhole.jpg"},
    ],

    //戦士
    warrior:[
        //武器
        {name: "木の枝", power: 1, price: 1, element: "無", category: "weapon", probability: 1, info: "どこにでもある木の枝", img: "img/treebranch.jpg"},
        {name: "ツルハシ", power: 2, price: 2, element: "無", category: "weapon", probability: 1, info: "鉱石を取るために使う道具", img: "img/pickaxe.jpg"},
        {name: "木こりオノ", power: 4, price: 3, element: "無", category: "weapon", probability: 2, info: "木こりをするために使う斧のため、そこまで攻撃力はない", img: "img/axe.jpg"},
        {name: "鎖鎌", power: 6, price: 5, element: "無", category: "weapon", probability: 3, info: "一撃性はないが、素早く動ける特殊な武器", img: "img/chainsickle.jpg"},
        {name: "弓と矢", power: 7, price: 6, element: "無", category: "weapon", probability: 5, info: "古くから使われる遠距離の武器", img: "img/bowandallow.jpg"},
        {name: "メリケンサック", power: 8, price: 6, element: "無", category: "weapon", probability: 4, info: "指にはめて相手に殴り込む道具", img: "img/mericansack.jpg"},
        {name: "ハンマー", power: 10, price: 8, element: "無", category: "weapon", probability: 5, info: "一振りが強力だが、隙も大きい", img: "img/hammer.jpg"},
        {name: "モーニングスター", power: 12, price: 10, element: "無", category: "weapon", probability: 5, info: "相手に勢いよくぶつけてダメージを与える凶悪な道具", img: "img/morningstar.jpg"},
        {name: "地雷", power: 18, price: 15, element: "無", category: "weapon", probability: 5, info: "15世紀に作られた、火薬を用いる高火力遠距離武器", img: "img/landmine.jpg"},
        {name: "ロケットランチャー", power: 20, price: 20, element: "無", category: "weapon", probability: 2, info: "すべてを吹き飛ばす爆発武器", img: "img/grenadelauncher.jpg"},
        {name: "線香花火", power: 4, price: 7, element: "火", category: "weapon", probability: 3, info: "夏の風物詩、人に向けるものではない", img: "img/hanabi.jpg"},
        {name: "フレアックス", power: 7, price: 10, element: "火", category: "weapon", probability: 5, info: "炎を纏った斧、フレアックス", img: "img/flaraxe.jpg"},
        {name: "マキシマムソード", power: 10, price: 16, element: "火", category: "weapon", probability: 3, info: "超高温で熱した剣、高火力", img: "img/maximumsword.jpg"},
        {name: "冷刀", power: 3, price: 5, element: "水", category: "weapon", probability: 5, info: "水で形成された刀、切れ味は悪くない", img: "img/coldblade.jpg"},
        {name: "マリンアロー", power: 5, price: 7, element: "水", category: "weapon", probability: 4, info: "刺されば水の膨張による攻撃を行う", img: "img/marineallow.jpg"},
        {name: "アイスピック", power: 8, price: 11, element: "水", category: "weapon", probability: 5, info: "氷を砕くために使われる、人体にやられるとやはり痛い", img: "img/icepick.jpg"},
        {name: "スタンガン", power: 3, price: 5, element: "雷", category: "weapon", probability: 3, info: "相手に近づいて痺れさせる武器", img: "img/stungun.jpg"},
        {name: "雷のオーブ", power: 6, price: 10, element: "雷", category: "weapon", probability: 3, info: "雷が周囲に発射、相手に致命傷を与える", img: "img/thunderorb.jpg"},
        {name: "グレネードランチャー", power: 10, price: 15, element: "雷", category: "weapon", probability: 3, info: "着弾時周囲に電撃を放出し広範囲に被害を与える", img: "img/grenadelauncherL.jpg"},
        {name: "閃光クロスボウ", power: 4, price: 6, element: "光", category: "weapon", probability: 3, info: "閃光弾を放ち視界を奪う", img: "img/crossbow.jpg"},
        {name: "希望の旗", power: 7, price: 12, element: "光", category: "weapon", probability: 3, info: "奇跡をもたらす旗、相手を（物理で）消滅させる", img: "img/hopesflag.jpg"},
        {name: "サン＆ムーンチャク", power: 11, price: 17, element: "光", category: "weapon", probability: 3, info: "それぞれの持ち手に太陽と月の力を宿したヌンチャク", img: "img/sunandmoon.jpg"},
        {name: "闇双剣", power: 3, price: 5, element: "闇", category: "weapon", probability: 3, info: "二本のとても軽い剣、ダメージは小さい", img: "img/darktwinsword.jpg"},
        {name: "アトミックボム", power: 7, price: 12, element: "闇", category: "weapon", probability: 3, info: "原子爆発を起こし虚無を生成する", img: "img/atomicboom.jpg"},
        {name: "次元斬", power: 11, price: 17, element: "闇", category: "weapon", probability: 3, info: "次元を切り裂く斬撃、無へと誘う", img: "img/dimensionlift.jpg"},

        //防具
        {name: "防弾チョッキ", power: 4, price: 5, element: "無", category: "armor", probability: 15, info: "銃弾を防ぐために作られたチョッキ", img: "img/bulletproofvest.jpg"},        
        {name: "ボディアーマー", power: 6, price: 8, element: "無", category: "armor", probability: 12, info: "割と高品質なアーマー", img: "img/bodyArmor.jpg"},
        
        
        //魔法
        {name: "＜エレキ砲＞", power: 8, price: 5, element: "雷", category: "magic", probability: 3, info: "腕から電気の球を放出する", img: "img/electriccannon.jpg"},
        {name: "＜オ一ラ＞", power: 10, price: 5, element: "無", category: "magic", probability: 3, info: "目に見えないフィールドを展開し、相手の攻撃を無効化する", img: "img/aura.jpg"},
        {name: "＜エレキフィールド＞", power: 15, price: 10, element: "雷", category: "magic", probability: 3, info: "周囲に電気の膜を展開し、敵の攻撃を防ぐ", img: "img/electricfield.jpg"},

    ],
    //貴族
    royalty:[
        //武器
        {name: "銅の延べ棒", power: 3, price: 5, element: "無", category: "weapon", probability: 2, info: "銅を焼いて伸ばしたもの", img: "img/copperbar.jpg"},
        {name: "銀の延べ棒", power: 5, price: 10, element: "無", category: "weapon", probability: 2, info: "銀を焼いて伸ばしたもの", img: "img/silverbar.jpg"},
        {name: "金の延べ棒", power: 7, price: 15, element: "無", category: "weapon", probability: 1, info: "金を焼いて伸ばしたもの", img: "img/goldbar.jpg"},
        {name: "エメラルド・ソード", power: 8, price: 12, element: "無", category: "weapon", probability: 5, info: "エメラルド製で高価、ただし強度はそこそこ", img: "img/emeraldsword.jpg"},
        {name: "ルビーの指輪", power: 5, price: 10, element: "火", category: "weapon", probability: 1, info: "赤く煌めく貴重なルビーを使った指輪", img: "img/rubyring.jpg"},
        {name: "サファイアガラス", power: 5, price: 10, element: "水", category: "weapon", probability: 1, info: "人工的に作られたアルミニウムを用いて作られたもの", img: "img/sapphireglass.jpg"},
        {name: "ラピスラズリ", power: 3, price: 7, element: "水", category: "weapon", probability: 2, info: "世界最古のパワーストーン、幸運を招く", img: "img/lapislazuli.jpg"},
        {name: "古の勾玉", power: 4, price: 12, element: "闇", category: "weapon", probability: 1, info: "儀式や信仰の一環で数多く利用された物", img: "img/magatama.jpg"},
        {name: "ジュエリーネックレス", power: 2, price: 15, element: "無", category: "weapon", probability: 1, info: "貴金属や宝石を使用した高級装飾品", img: "img/jewelrynecklace.jpg"},
        {name: "アメジストのかけら", power: 2, price: 8, element: "無", category: "weapon", probability: 2, info: "紫色に輝く石、別名:紫石英", img: "img/amethyst.jpg"},
        {name: "輝く水晶", power: 6, price: 12, element: "光", category: "weapon", probability: 1, info: "無色透明の美しい鉱石、名称クォーツ", img: "img/crystal.jpg"},
        {name: "翡翠石", power: 3, price: 15, element: "無", category: "weapon", probability: 2, info: "様々な鉱石が集まってできた物、鉱物の色や成分で色が変わるのが特徴", img: "img/jadestone.jpg"},
        {name: "ダイヤモンドの剣", power: 20, price: 25, element: "無", category: "weapon", probability: 0.5, info: "もっとも自然界で硬い鉱物、剣で切りつけることでさらにその硬さを実感できる", img: "img/diamondsword.jpg"},
        //防具
        {name: "市民", power: 5, price: 1, element: "無", category: "armor", probability: 4, info: "一般人、いわば身代わりだ。", img: "img/citizen.jpg"},
        {name: "兵士", power: 7, price: 3, element: "無", category: "armor", probability: 3, info: "訓練された兵、ある程度は戦える。", img: "img/soldier.jpg"},
        {name: "弓兵", power: 6, price: 5, element: "無", category: "armor", probability: 3, info: "遠くからの攻撃で支援する兵、耐久力はそこまでない。", img: "img/archer.jpg"},
        {name: "騎兵", power: 7, price: 5, element: "無", category: "armor", probability: 3, info: "馬に乗り戦場を駆け巡る兵士、速さで勝負。", img: "img/cavalry.jpg"},
        {name: "工兵", power: 7, price: 3, element: "無", category: "armor", probability: 2, info: "真っ先に行動開始する先駆者的存在。", img: "img/engineer.jpg"},
        {name: "斥候兵", power: 8, price: 7, element: "無", category: "armor", probability: 1, info: "状況や地形を把握するために派遣される少数の兵、常に相手の行動を監視する。", img: "img/scout.jpg"},
        {name: "傭兵", power: 13, price: 9, element: "無", category: "armor", probability: 1, info: "金で雇われた兵士が、研ぎ澄まされた精神力で戦場を制圧する。", img: "img/mercenary.jpg"},
        {name: "騎士", power: 18, price: 12, element: "無", category: "armor", probability: 1, info: "直属で護衛する騎士、戦闘力はかなり高い。", img: "img/knight.jpg"},
    ]
}

// アイテムをランダムに取得するサーバーサイド関数
function getItemForJob(job) {
    const jobItems = Items[job];
    if (!jobItems) return null;

    const probabilities = jobItems.map(item => item.probability);
    const sum = probabilities.reduce((a, b) => a + b, 0);
    let rand = Math.random() * sum;
    
    for (let i = 0; i < jobItems.length; i++) {
        if (rand < probabilities[i]) {
            return jobItems[i]; // Return the full item object
        }
        rand -= probabilities[i];
    }
    return null; // Should not happen if probabilities are set correctly
}

//dataがlistの何番目に入っているか探索する
function searchindex(data, list) {
  return index = list.indexOf(data);
}

const roomplayerName = [];
const roomplayersocketid = [];
let gamestartflg = 0;

// クライアントが接続してきたときの処理
io.on('connection', (socket) => {

  // プレイヤーが名前を入力して参加するのを待つ
  socket.on('joinGame', (playerName) => {
    
    socket.playerName = playerName;
    roomplayerName[roomplayerName.length] = socket.playerName;
    roomplayersocketid[roomplayersocketid.length] = socket.id;

    // 新しいプレイヤーを追加
    connectedPlayers.push({ id: socket.id, name: playerName });
    
    // 現在のプレイヤー数を全員に通知
    io.emit('showPNum', connectedPlayers.length, MAX_PLAYERS);

    // ゲーム開始条件（プレイヤー数）を満たした場合
    if (connectedPlayers.length === MAX_PLAYERS) {
      
      let gameSysInfo = {
          playersNum : MAX_PLAYERS,
          phase : 1,
          jobs : ['swordsman', 'wizard', 'warrior', 'royalty'],
          players : [],
      };

      // 職業をシャッフルして重複なく割り当てる
      const shuffledJobs = [...gameSysInfo.jobs].sort(() => 0.5 - Math.random());

      // プレイヤー情報を生成
      for(let i = 0; i < connectedPlayers.length; i++){
          const playerJob = shuffledJobs[i];
          const playerStatus = STATUS[playerJob];
          
          // プレイヤーの初期アイテムを生成
          let startingItems = [];
          for (let j = 0; j < 9; j++) {
              const item = getItemForJob(playerJob);
              if (item) {
                  startingItems.push(item);
              }
          }

          gameSysInfo.players.push({
              id: connectedPlayers[i].id,
              name: connectedPlayers[i].name,
              job: playerJob,
              HP: playerStatus.HP,
              MP: playerStatus.MP,
              money: playerStatus.money,
              items: startingItems, // アイテムリストを追加
              playerNum: i
          });
      }
      
      // 各プレイヤーに、自分がどのプレイヤー番号であるかを個別に通知
      gameSysInfo.players.forEach((player, index) => {
          io.to(player.id).emit('up_thisPlayerNum', index);
      });

      // 全員にゲームの初期情報を送信
      io.emit('gameSysInfo', gameSysInfo);

      gamestartflg = 1;
    }
    
  });

  //カードをリロードする
  socket.on('reloadItem', (p_num, removeItems, player) => {
    //カードを削除
    removeItems.sort((a, b) => b - a);
    for(const itemIndex of removeItems){
      player.items.splice(itemIndex, 1);
    }
    //この時点でのカードの状態をリクエスターに送りたい
    socket.emit('showItems', player.items);
    //カードを補充
    for(let i = 0; i < removeItems.length; i++){
      player.items.push(getItemForJob(player.job));
    }
    //リロード後のitemsをブロードキャスト
    io.emit('overWrite_items', p_num, player.items);
  });

    //カードを補充する
  socket.on('getItem', (p_num, player) => {
    player.items.push(getItemForJob(player.job))
    //補充後のitemsをブロードキャスト
    io.emit('overWrite_items', p_num, player.items);
  });

  //カードを削除する
  socket.on('removeItem', (p_num, removeItems, player) => {
    removeItems.sort((a, b) => b - a);
    for(const itemIndex of removeItems){
      player.items.splice(itemIndex, 1);
    }
    socket.emit('showItems', player.items);
    io.emit('overWrite_items', p_num, player.items);
  });

  //ショップからアイテムを入手(BC)
  socket.on('BC_getFromShop', (p_num, getItem) => {
    io.emit('getFromShop', p_num, getItem);
  });

  //ダメージ情報をブロードキャストする
  socket.on('BC_damage', (damage) => {
    io.emit('in_damage', damage);
  });

  //mp_sumを同期
  socket.on('BC_mp_sum', (mp_sum) => {
    io.emit('in_mp_sum', mp_sum);
  });

  //フェーズをincrementしてブロードキャストする
  socket.on('increment_phase', (phase) => {
    phase++;
    io.emit('in_phase', phase);
  });

  //pickItemsなどの初期化
  socket.on('BC_reset', () => {
    io.emit('reset');
  });

  //ステータスの変動(hp)させるようにブロードキャストする
  socket.on('BC_overWrite_hp', (p_num, damage, defense) => {
    let damage_result = 0;
    if(damage > defense){
      damage_result = damage - defense;
    }
    if(damage < 0){
      damage_result = damage;
    }
    
    //ここから内部と表示を変更させる(ブロードキャスト)
    io.emit('overWrite_hp', p_num, damage_result);
  
  });

  //ステータスの変動(mp)させるようにブロードキャストする
  socket.on('BC_overWrite_mp', (p_num, mp) => {
    io.emit('overWrite_mp', p_num, mp);
  });

  //ステータスの変動(price)させるようにブロードキャストする
  socket.on('BC_overWrite_price', (p_num, price) => {
    io.emit('overWrite_price', p_num, price);
  });

  //オープン
  socket.on('openShow', (targetName, damage) => {
    io.emit('showTarget', targetName);
    io.emit('showPickItems');
    io.emit('showDamage', damage);
    io.emit('showDefense_to_target');
  });

  socket.on('openShow_d', (targetName) => {
    io.emit('showTarget', targetName);
    io.emit('showPickItems_d');
  });

  socket.on('openShow_t', (targetNum, defense) => {
    io.emit('showPickItems_t', targetNum);
    io.emit('showDefense', defense);
  });

  socket.on('openShow_p', (sellBox, priceSum) => {
    io.emit('showTarget', '雑貨屋（買取）');
    io.emit('showSellBox', sellBox);
    io.emit('showPrice', priceSum);
  });

  socket.on('openShow_s', (Amount) => {
    io.emit('showTarget_s', '雑貨屋（購入）');
    io.emit('showAmount', Amount);
  });

  //pickItemsの同期
  socket.on('BC_pickItems', (pickItems) => {
    io.emit('inPickItems', pickItems);
  });
  //pickItems_dの同期
  socket.on('BC_pickItems_d', (pickItems_d) => {
    io.emit('inPickItmes_d', pickItems_d);
  });
  //pickItems_tの同期
  socket.on('BC_pickItems_t', (pickItems_t, targetNum) => {
    io.emit('inPickItems_t', pickItems_t, targetNum);
  });

  //flgの同期
  socket.on('BC_pickItemsFlgs', (flg, t_flg) => {
    io.emit('inPickItemsFlgs', flg, t_flg);
  });

  //targetにnextTurnを出させる
  socket.on('makeNextTurn', () => {
    io.emit('nextTurn_t');
  });

  // クライアントが切断したときの処理
  socket.on('disconnect', () => {
    if(gamestartflg == 1){
      //切断したやつを殺す
      io.emit('overWrite_hp', searchindex(socket.id, roomplayersocketid), 999);

      //切断したやつのインデックスを返す
      io.emit('currentPlayercheck', searchindex(socket.id, roomplayersocketid));

    }else{
      //重複チェックに使うリストの中身を削除
      roomplayerName.splice(searchindex(socket.playerName, roomplayerName), 1);
      roomplayersocketid.splice(searchindex(socket.id, roomplayersocketid), 1);
    }

    // 切断したプレイヤーをリストから削除
    connectedPlayers = connectedPlayers.filter(player => player.id !== socket.id);
    
    // 現在のプレイヤー数を全員に通知
    io.emit('showPNum', connectedPlayers.length, MAX_PLAYERS);

    if(connectedPlayers.length < 1){
      gamestartflg = 0;
      for(let i = 0; i < roomplayersocketid.length; i++){
        roomplayersocketid.splice(0);
        roomplayerName.splice(0);
      }
    }
  });

  socket.on('checkname', function(checkname) {

    if(gamestartflg){
      //ゲーム中だったらここ
      io.to(socket.id).emit('nowgame');
    }else{
      for(let i = 0; i < roomplayerName.length; i++){
        if(roomplayerName[i] == checkname){
          io.to(socket.id).emit('nameduplication');
          return;
        }
      }
      //ゲーム開始前だったらここ
      io.to(socket.id).emit('addplayer', checkname);
    }

  });

  socket.on('endgame', function(){
    gamestartflg = 0;
    for(let i = 0; i < roomplayersocketid.length; i++){
      roomplayersocketid.splice(0);
      roomplayerName.splice(0);
    }
  });

  socket.on('chat', function(msg){
    /*if(selectuser){
        if(msg.match(/\S/g)){
            io.to(socket.id).emit('chat', 'あなたから' + selectuser + 'へ:' + msg);
            io.to(socketid[searchindex(selectuser, userlist)]).emit('chat', socket.userName + 'からあなたへ:' + msg);
        }
    }else{*/
        //空白のみを送れないようにしている
        if(msg.match(/\S/g)){
          io.emit('chat', socket.playerName + ' : ' + msg);
        }
    //}
  });
});

// server.listen は起動時にユーザー入力を受け取ってから実行するため、
// 下記の askMaxPlayersAndStart を使って開始します。
const readline = require('readline');

function askMaxPlayersAndStart() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question(`プレイヤー人数を入力してください (デフォルト:${MAX_PLAYERS}｜最大:4): `, (answer) => {
    const n = parseInt(answer, 10);
    if (!isNaN(n) && n > 1 && n < 5) {
      MAX_PLAYERS = n;
      console.log(`プレイヤー人数を${MAX_PLAYERS} に設定しました。`);
    } else if (answer.trim() !== '') {
      console.log(`無効な入力です。デフォルト:${MAX_PLAYERS} を使用します。`);
    } else {
      console.log(`デフォルト:${MAX_PLAYERS} を使用します。`);
    }
    rl.close();

    server.listen(3000, () => {
      console.log(`listening on *:3000 (プレイヤー人数:${MAX_PLAYERS})`);
      console.log();
      console.log('※ 終了する場合は Ctrl+C を押してください。');
    });
  });
}

// 自動でプロンプトを出す（node で起動したときに標準入力から設定可能にする）
askMaxPlayersAndStart();