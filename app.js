// Connect to the server
const socket = io();

// Define a global game state object. The classes in definition.js unfortunately rely on this.
let gameSysInfo = {
    thisPlayerNum: -1,
    players: [],
    pickItems: [],
    pickItems_d:[],
    pickItems_t: [],
    sellBox: [],
    pickItems_shop: [],
};

// Make it available on the window object for the classes in definition.js
window.gameSysInfo = gameSysInfo;

// --- DOM Elements ---
const nameScreen = document.getElementById('nameScreen');
const nameInput = document.getElementById('nameInput');
const joinButton = document.getElementById('joinButton');
const waitingScreen = document.getElementById('waitingScreen');
const waitingMessage = document.getElementById('waitingMessage');
const gameContainer = document.getElementById('gameContainer');
const chat = document.getElementById('chat');
const chatbox = document.getElementById('chatbox');
const message = document.getElementById('message');
const button = document.getElementById('button');
const text = document.querySelector('.text');
const topmessage = document.getElementById('topmessage')
const form = document.forms.form;

// --- Socket Event Handlers ---

// Update player count display
socket.on('showPNum', (pNum, maxPNum) => {
    if (waitingMessage) {
        waitingMessage.textContent = `他プレイヤーの参加を待っています...　${pNum} / ${maxPNum}`;
    }
});

// Store this client's player number
socket.on('up_thisPlayerNum', (num) => {
    gameSysInfo.thisPlayerNum = num;
    // Also store the player's name for reference in UI checks
});

// Main event to start and update the game
socket.on('gameSysInfo', (serverState) => {
    if (waitingScreen) waitingScreen.style.display = 'none';
    if (gameContainer) gameContainer.style.display = 'block';

    // Update the global state
    Object.assign(gameSysInfo, serverState);

    // Populate playerNames for other parts of the code that rely on it
    gameSysInfo.playerNames = serverState.players.map(p => p.name);
    
    // The constructor in definition.js is not ideal, as it generates its own data.
    // We will instantiate it and then overwrite its properties with the authoritative data from the server.
    gameSysInfo.players = serverState.players.map(playerData => {
        return new catsField_gameSys(playerData);
    });
    
    // After receiving the full player list, find this client's name
    if (gameSysInfo.players[gameSysInfo.thisPlayerNum]) {
        gameSysInfo.thisPlayerName = gameSysInfo.players[gameSysInfo.thisPlayerNum].name;
    }

    // Initial UI setup
    setupUI();
    updateTurn();
});


// --- UI and Game Flow Functions ---

function setupUI() {
    const playersInfoEl = document.getElementById('playersInfo');
    // Clear previous player info
    while (playersInfoEl.firstChild) {
        playersInfoEl.removeChild(playersInfoEl.firstChild);
    }

    // Display all players
    gameSysInfo.players.forEach(p => p.showPlayers());

    // Display this player's hand
    const thisPlayer = gameSysInfo.players[gameSysInfo.thisPlayerNum];
    if (thisPlayer) {
        thisPlayer.showItems();
    }
}

function updateTurn() {
    let cnt = 0;
    for(let i = 0; i < gameSysInfo.playersNum; i++){
        if(gameSysInfo.players[i].HP <= 0) cnt++;
        if(cnt >= gameSysInfo.playersNum - 1){
            for(const p of gameSysInfo.players){
                if(p.HP != 0){
                    alert(p.name + 'の勝利！');
                    pickItemsFlg = false;
                    socket.emit('BC_pickItems', pickItemsFlg);
                    setupUI();
                    //socket.emit('endgame')
                    return
                }
            }
        }
    }
    const current_p_index = (gameSysInfo.phase - 1) % gameSysInfo.playersNum;
    const currentPlayer = gameSysInfo.players[current_p_index];

    //順番飛ばし
    if(currentPlayer.HP <= 0)socket.emit('increment_phase', gameSysInfo.phase);
    //カレントプレイヤーの表示
    if (currentPlayer)currentPlayer.showCurrent_p();

    // Enable/disable controls based on whose turn it is
    if (current_p_index === gameSysInfo.thisPlayerNum) {
        pickItemsFlg = true;
    } else {
        pickItemsFlg = false;
    }
    setupUI();
}

// --- Main Event Listeners ---

joinButton.addEventListener('click', () => {
    const playerName = nameInput.value.trim();
    if (playerName) {
        socket.emit('checkname', playerName);
    } else {
        alert('名前を入力してください');
    }
});

let damage = 0;
let defense = 0;
let current_p_index = 0;
let mp_sum = 0;
let priceSum = 0;

//カレントプレイヤーの行動選択
game_layout.pickItems.addEventListener('click', () => {
    damage = 0;
    defense = 0;
    current_p_index = (gameSysInfo.phase - 1) % gameSysInfo.playersNum;

    if (gameSysInfo.thisPlayerNum !== current_p_index || !(pickItemsFlg)) {
        return;
    }

    if (gameSysInfo.pickItems.length === 0) {
        const currentPlayer = gameSysInfo.players[current_p_index];
        if (currentPlayer.searchWeapon()) {
            pickItemsFlg = false;
            picked = true;
            document.getElementById('pickItems').style.backgroundColor = '#ececec';
            
            //武器の補充
            //サーバー側で補充する
            socket.emit('getItem', current_p_index, gameSysInfo.players[current_p_index]);
            //その結果をブロードキャストしてもらい、上書きする
            setTimeout(nextTurn, 2000);
        } else {
            alert("武器を所持していると補充できません");
        }
        
    } else {
        //MPチェック
        mp_sum = gameSysInfo.players[gameSysInfo.thisPlayerNum].MP_Calculation(gameSysInfo.pickItems);
        if(mp_sum > gameSysInfo.players[gameSysInfo.thisPlayerNum].MP){
            alert('MPが足りません');
            mp_sum = 0;
            return
        }

        pickItemsFlg = false;
        picked = true;
        pickItems_tFlg = true;
        document.getElementById('pickItems').style.backgroundColor = '#ececec';
        
        //flgたちの同期
        socket.emit('BC_pickItemsFlgs', pickItemsFlg, pickItems_tFlg);
        //pickItemsの同期
        socket.emit('BC_pickItems', gameSysInfo.pickItems);
        let targetName = document.getElementById('target').textContent;
        if(!(targetName)){
            targetName = gameSysInfo.players[current_p_index].name;
            socket.emit('openShow', targetName, gameSysInfo.players[current_p_index].damageCalculation());
            damage = gameSysInfo.players[current_p_index].damageCalculation()[0];
            socket.emit('BC_damage', damage);
            socket.emit('BC_mp_sum', mp_sum);
            socket.emit('reloadItem', current_p_index, gameSysInfo.pickItems, gameSysInfo.players[current_p_index]);
            
            setTimeout(nextTurn, 3000);
            return
        }
        socket.emit('openShow', targetName, gameSysInfo.players[current_p_index].damageCalculation());
        damage = gameSysInfo.players[current_p_index].damageCalculation()[0];
        socket.emit('BC_damage', damage);
        socket.emit('BC_mp_sum', mp_sum);
        socket.emit('BC_overWrite_mp', gameSysInfo.thisPlayerNum, mp_sum);
        socket.emit('reloadItem', current_p_index, gameSysInfo.pickItems, gameSysInfo.players[current_p_index]);

    }
});

game_layout.pickItems_d.addEventListener('click', () => {
    if (!pickItemsFlg) {
        return;
    }
    pickItemsFlg = false;
    picked = true;
    game_layout.pickItems_d.style.backgroundColor = 'transparent';
    let targetName = document.getElementById('target').textContent;
    let p = gameSysInfo.players[gameSysInfo.thisPlayerNum];
    mp_sum = p.MP_Calculation(gameSysInfo.pickItems_d);
    mp_sum *= -1;
    damage = 0;
    defense = 0;
    switch(p.items[gameSysInfo.pickItems_d[0]].name){
        case '初級回復ポーション':
        case '中級回復ポーション':
        case '上級回復ポーション':
            damage = p.items[gameSysInfo.pickItems_d[0]].power * -1;
    }

    current_p_index = (gameSysInfo.phase - 1) % gameSysInfo.playersNum;
    socket.emit('BC_pickItems_d', gameSysInfo.pickItems_d);

    if(!(targetName)){
        //自分を回復させる
        targetName = gameSysInfo.players[current_p_index].name;
        socket.emit('openShow_d', targetName, gameSysInfo.players[current_p_index].damageCalculation());
        socket.emit('reloadItem', current_p_index, gameSysInfo.pickItems_d, gameSysInfo.players[current_p_index]);
        setTimeout(nextTurn, 3000);
    }else{
        //ターゲットを回復させる
        socket.emit('openShow_d', targetName, gameSysInfo.players[current_p_index].damageCalculation());
        socket.emit('reloadItem', current_p_index, gameSysInfo.pickItems_d, gameSysInfo.players[current_p_index]);
        socket.emit('BC_damage', damage);
        socket.emit('BC_mp_sum', mp_sum);
        socket.emit('makeNextTurn');
    }
});

//ターゲットプレイヤーの行動選択
game_layout.pickItems_t.addEventListener('click', () => {
    //該当プレイヤー以外はretarn
    if (gameSysInfo.players[gameSysInfo.thisPlayerNum].name !== document.getElementById('target').textContent || !(pickItems_tFlg)) {
        return
    }
    //MPチェック
    mp_sum = gameSysInfo.players[gameSysInfo.thisPlayerNum].MP_Calculation(gameSysInfo.pickItems_t);
    if(mp_sum > gameSysInfo.players[gameSysInfo.thisPlayerNum].MP){
        alert('MPが足りません');
        return
    }
    pickItems_tFlg = false;
    document.getElementById('pickItems_t').style.backgroundColor = '#ececec';
    //pickItems_tの同期
    socket.emit('BC_pickItems_t', gameSysInfo.pickItems_t);
    socket.emit('openShow_t', gameSysInfo.thisPlayerNum, gameSysInfo.players[gameSysInfo.thisPlayerNum].defenseCalculation());
    defense = gameSysInfo.players[gameSysInfo.thisPlayerNum].defenseCalculation()[0];
    socket.emit('reloadItem', gameSysInfo.thisPlayerNum, gameSysInfo.pickItems_t, gameSysInfo.players[gameSysInfo.thisPlayerNum]);
    //ターンを数秒後に進める
    setTimeout(nextTurn, 3000);
});

//アイテム売却
game_layout.sellBox.addEventListener('click', () => {
    if(!sellFlg || gameSysInfo.sellBox.length === 0){
        return
    }
    current_p_index = (gameSysInfo.phase - 1) % gameSysInfo.playersNum;
    sellFlg = false;
    game_layout.sellBox.style.backgroundColor = 'transparent';
    //sellBoxの同期
    socket.emit('BC_sellBox', gameSysInfo.sellBox);
    priceSum = gameSysInfo.players[gameSysInfo.thisPlayerNum].priceCalculation();
    socket.emit('openShow_p', gameSysInfo.sellBox, priceSum);
    socket.emit('removeItem', current_p_index, gameSysInfo.sellBox, gameSysInfo.players[current_p_index]);
    //ターンを数秒後に進める
    setTimeout(nextTurn, 3000);
});

//アイテム購入
game_layout.pickItems_shop.addEventListener('click', () => {
    if(!shopFlg || gameSysInfo.pickItems_shop.length === 0){
        return
    }
    current_p_index = (gameSysInfo.phase - 1) % gameSysInfo.playersNum;
    //moneyチェック
    priceSum = shopItems[gameSysInfo.pickItems_shop[0]].price;
    if(priceSum > gameSysInfo.players[current_p_index].money){
        alert('お金が足りません');
        priceSum = 0;
        return
    }

    shopFlg = false;
    shopping = true;
    game_layout.pickItems_shop.style.backgroundColor = 'transparent';
    //情報の表示・同期(何を買ったのかは表示しない)
    socket.emit('openShow_s', shopItems[gameSysInfo.pickItems_shop[0]].price);
    priceSum = -1 * shopItems[gameSysInfo.pickItems_shop[0]].price;
    //アイテムを与える
    socket.emit('BC_getFromShop', current_p_index, gameSysInfo.pickItems_shop, gameSysInfo.players[current_p_index]);
    game_layout.shopBoxContainer.style.display = 'none';

    setTimeout(nextTurn, 3000);
});


const nextTurn = () => {
    current_p_index = (gameSysInfo.phase - 1) % gameSysInfo.playersNum;
    //ステータスの変動
    //server.jsでやる
    socket.emit('BC_overWrite_hp', gameSysInfo.thisPlayerNum, damage, defense);
    socket.emit('BC_overWrite_mp', gameSysInfo.thisPlayerNum, mp_sum);
    socket.emit('BC_overWrite_price', gameSysInfo.thisPlayerNum, priceSum);
    //pickItemsなどを初期化する(ブロードキャスト)
    socket.emit('BC_reset');
    //ターンを進める
    socket.emit('increment_phase', gameSysInfo.phase);
}

//攻撃側がターゲットにnextTurnを実行させる
socket.on('nextTurn_t', () => {
    if (gameSysInfo.players[gameSysInfo.thisPlayerNum].name === document.getElementById('target').textContent) {
        setTimeout(nextTurn, 3000);
    }
});

//先にリクエスターにitemsの情報を受け取りたい
socket.on('showItems', (Items) => {
    gameSysInfo.players[gameSysInfo.thisPlayerNum].items = Items;
    gameSysInfo.players[gameSysInfo.thisPlayerNum].showItems();
});

//BCされたアイテム情報を上書きする
socket.on('overWrite_items', (p_num, Items) => {
    gameSysInfo.players[p_num].items = Items;
});

//BCされたダメージ情報を受け取る
socket.on('in_damage', (Damage) => {
    damage = Damage;
});

//mp_sum同期
socket.on('in_mp_sum', (Mp_sum) => {
    mp_sum = Mp_sum;
});

//フェーズ更新
socket.on('in_phase', (phase) => {
    gameSysInfo.phase = phase;
    updateTurn();
});

//pickItemsなどの初期化
socket.on('reset', () => {
    //pickItems
    gameSysInfo.players[gameSysInfo.thisPlayerNum].deleteChild(game_layout.pickItems);
    gameSysInfo.pickItems.length = 0;
    game_layout.pickItems.style.display = 'flex';
    //その下
    game_layout.Below_pickItems.style.display = 'flex';
    gameSysInfo.players[gameSysInfo.thisPlayerNum].showBelow_pickItems([0, '']);
    //pickItems_d
    gameSysInfo.pickItems_d.length = 0;
    game_layout.pickItems_d.style.display = 'none';
    gameSysInfo.players[gameSysInfo.thisPlayerNum].deleteChild(game_layout.pickItems_d);
    //pickItems_t
    game_layout.pickItems_t.style.backgroundColor = 'transparent';
    gameSysInfo.players[gameSysInfo.thisPlayerNum].deleteChild(game_layout.pickItems_t);
    gameSysInfo.pickItems_t.length = 0;
    //その下
    game_layout.Below_pickItems_t.style.opacity = 0;
    //targetと矢印
    gameSysInfo.players[gameSysInfo.thisPlayerNum].deleteChild(game_layout.target);
    game_layout.target.classList.remove('target');
    gameSysInfo.players[gameSysInfo.thisPlayerNum].deleteChild(game_layout.targetArrow);
    game_layout.targetArrow.classList.remove('targetArrow_r');
    //sellBox
    gameSysInfo.players[gameSysInfo.thisPlayerNum].deleteChild(game_layout.sellBox);
    gameSysInfo.sellBox.length = 0;
    game_layout.sellBox.style.display = 'none';
    //pickItems_shop等
    gameSysInfo.players[gameSysInfo.thisPlayerNum].deleteChild(game_layout.pickItems_shop);
    game_layout.pickItems_shop.style.display = 'none';
    game_layout.shopBoxContainer.style.display = 'none';
    gameSysInfo.pickItems_shop.length = 0;
    pickItemsFlg = true;
    shopping = false;
    priceSum = 0;

    damage = 0;
    defense = 0;
    current_p_index = 0;
    mp_sum = 0;
    picked = false;
});

//ステータス変動(hp)
socket.on('overWrite_hp', (p_num, damage) => {
    //内部
    gameSysInfo.players[p_num].HP -= damage;
    if(gameSysInfo.players[p_num].HP < 0) gameSysInfo.players[p_num].HP = 0;
    if(gameSysInfo.players[p_num].HP > 99) gameSysInfo.players[p_num].HP = 99;
    //表示
    setupUI();
});
//ステータス変動(mp)
socket.on('overWrite_mp', (p_num, mp) => {
    gameSysInfo.players[p_num].MP -= mp;
    if(gameSysInfo.players[p_num].MP > 99) gameSysInfo.players[p_num].MP = 99;
    setupUI();
});
//ステータス変動(price)
socket.on('overWrite_price', (p_num, money) => {
    gameSysInfo.players[p_num].money += money;
    if(gameSysInfo.players[p_num].money > 99) gameSysInfo.players[p_num].money = 99;
    setupUI();
});

//openShowの中身
socket.on('showTarget', (targetName) => {
    if (gameSysInfo.players[gameSysInfo.thisPlayerNum]) {
        gameSysInfo.players[gameSysInfo.thisPlayerNum].showTarget(targetName);
    }
});
socket.on('showPickItems', () => {
    const current_p_index = (gameSysInfo.phase - 1) % gameSysInfo.playersNum;
    if(game_layout.current_p.textContent !== gameSysInfo.thisPlayerName){
        gameSysInfo.players[current_p_index].showPickItems();
    }
});
socket.on('showDamage', (damage) => {
    if (gameSysInfo.players[gameSysInfo.thisPlayerNum]) {
        gameSysInfo.players[gameSysInfo.thisPlayerNum].showBelow_pickItems(damage);
    }
});
socket.on('showDefense_to_target', () => {
    if(gameSysInfo.players[gameSysInfo.thisPlayerNum].name === document.getElementById('target').textContent){
        gameSysInfo.players[gameSysInfo.thisPlayerNum].showBelow_pickItems_t([0, '']);
    }
});

//openShow_d
socket.on('showPickItems_d', () => {
    game_layout.Below_pickItems.style.display = 'none';
    game_layout.pickItems.style.display = 'none';
    game_layout.pickItems_d.style.display = 'flex';
    const current_p_index = (gameSysInfo.phase - 1) % gameSysInfo.playersNum;
    if(game_layout.current_p.textContent !== gameSysInfo.thisPlayerName){
        gameSysInfo.players[current_p_index].showPickItems_d();
    }
});

//openShow_t
socket.on('showPickItems_t', (targetNum) => {
    if(game_layout.target.textContent !== gameSysInfo.thisPlayerName){
        gameSysInfo.players[targetNum].showPickItems_t();
    }
});
socket.on('showDefense', (defense) => {
    //防御表示
    gameSysInfo.players[gameSysInfo.thisPlayerNum].showBelow_pickItems_t(defense)
});

//pickItemsの同期
socket.on('inPickItems', (pickItems) => {
    gameSysInfo.pickItems = pickItems;
});
socket.on('inPickItmes_d', (pickItems_d) => {
    gameSysInfo.pickItems_d = pickItems_d;
});
//pickItems_tの同期
socket.on('inPickItems_t', (pickItems_t) => {
    gameSysInfo.pickItems_t = pickItems_t;
});

//pickItemsFlgの同期
socket.on('inPickItemsFlgs', (flg, t_flg) => {
    pickItemsFlg = flg;
    pickItems_tFlg = t_flg;
});

//openShow_p
socket.on('showSellBox', (sellBox) => {
    gameSysInfo.sellBox = sellBox;
    const current_p_index = (gameSysInfo.phase - 1) % gameSysInfo.playersNum;
    if(game_layout.current_p.textContent !== gameSysInfo.thisPlayerName){
        game_layout.sellBox.style.display = 'flex';
        gameSysInfo.players[current_p_index].showSellBox();
    }
});
socket.on('showPrice', (priceSum) => {
    gameSysInfo.players[gameSysInfo.thisPlayerNum].showPrice(priceSum);
});

//openShow_s
socket.on('showTarget_s', (target) => {
    if (gameSysInfo.players[gameSysInfo.thisPlayerNum]) {
        p = gameSysInfo.players[gameSysInfo.thisPlayerNum];
        p.showTarget(target);
        p.deleteChild(game_layout.targetArrow)
        let targetArrow = document.createElement('img');
        targetArrow.src = 'img/targetArrow.jpg';
        targetArrow.classList.add('targetArrow_r');
        game_layout.targetArrow.appendChild(targetArrow);
    }
});
socket.on('showAmount', (Amount) => {
    gameSysInfo.players[gameSysInfo.thisPlayerNum].showPrice_t(Amount);
});

//ショップからアイテムを入手
socket.on('getFromShop', (p_num, getItem) => {
    gameSysInfo.players[p_num].items.push(shopItems[getItem]);
});

//切断したプレイヤーがカレントプレイヤーか確認する
socket.on('currentPlayercheck', function(index){
    let current_p_index = (gameSysInfo.phase - 1) % gameSysInfo.playersNum;
    if(current_p_index == index){
        socket.emit('increment_phase', gameSysInfo.phase);
    }
});

//名前の重複チェック
//被りなし
socket.on('addplayer', function(playerName){
    socket.emit('joinGame', playerName);
    nameScreen.style.display = 'none';
    waitingScreen.style.display = 'flex';
});

//被りあり
socket.on('nameduplication', function(){
    alert('その名前は使用されています');
});

//ゲーム中の入室処理
socket.on('nowgame', function(){
    alert('ゲームが終了するまでお待ちください...')
});

//sellBtnクリックイベント
game_layout.sellBtn.onclick = () => {
    current_p_index = (gameSysInfo.phase - 1) % gameSysInfo.playersNum;
    if (gameSysInfo.thisPlayerNum !== current_p_index || shopFlg || shopping || picked) {
        return;
    }
    gameSysInfo.pickItems.length = 0;
    gameSysInfo.pickItems_d.length = 0;
    p = gameSysInfo.players[gameSysInfo.thisPlayerNum];
    p.deleteChild(game_layout.pickItems);
    p.deleteChild(game_layout.pickItems_d);
    p.deleteChild(game_layout.sellBox);

    if(game_layout.sellBox.style.display === 'flex'){
        game_layout.sellBox.style.display = 'none';
        p.deleteChild(game_layout.target);
        game_layout.target.classList.remove('target');
        p.deleteChild(game_layout.targetArrow);
        pickItemsFlg = true;
        p.showBelow_pickItems([0, '']);
        sellFlg = false;
    }else{
        game_layout.sellBox.style.display = 'flex';
        p.showTarget('雑貨屋（買取）');
        p.showPrice(0);
        pickItemsFlg = false;
        sellFlg = true;
    }
}

//shopBtnにクリックイベントを付与
game_layout.shopBtn.onclick = () => {
    if(sellFlg || shopping || picked){
        return
    }
    if(game_layout.shopBoxContainer.style.display === 'flex'){
        game_layout.shopBoxContainer.style.display = 'none';
    }else{
        game_layout.shopBoxContainer.style.display = 'flex';
    }
    current_p_index = (gameSysInfo.phase - 1) % gameSysInfo.playersNum;
    if (gameSysInfo.thisPlayerNum !== current_p_index || sellFlg) {
        return;
    }
    gameSysInfo.pickItems.length = 0;
    gameSysInfo.pickItems_d.length = 0;
    p = gameSysInfo.players[gameSysInfo.thisPlayerNum];
    p.deleteChild(game_layout.pickItems);
    p.deleteChild(game_layout.pickItems_d);
    p.deleteChild(game_layout.pickItems_shop);
    
    if(game_layout.pickItems_shop.style.display === 'flex'){
        game_layout.pickItems_shop.style.display = 'none';
        p.deleteChild(game_layout.target);
        game_layout.target.classList.remove('target');
        p.deleteChild(game_layout.targetArrow);
        p.showBelow_pickItems([0, '']);
        gameSysInfo.pickItems_shop.length = 0;
        pickItemsFlg = true;
        shopFlg = false;
    }else{
        game_layout.pickItems_shop.style.display = 'flex';
        p.showTarget('雑貨屋（購入）');
        p.deleteChild(game_layout.targetArrow)
        let targetArrow = document.createElement('img');
        targetArrow.src = 'img/targetArrow.jpg';
        targetArrow.classList.add('targetArrow_r');
        game_layout.targetArrow.appendChild(targetArrow);
        p.showPrice_t(0);
        pickItemsFlg = false;
        shopFlg = true;
    }
}

showShopItems(shopItems);

//こっからチャット
chat.addEventListener('click', function(){
    if(chatbox.style.display === 'block'){
        chatbox.style.display = 'none';
    }else{
        chatbox.style.display = 'block'
    }
});

form.button.addEventListener('click', function(e){
    e.preventDefault();
    socket.emit('chat', form.text.value);
    form.text.value = '';
});

socket.on('chat', function(msg){
    let li = document.createElement('li');
    li.id = 'msg'
    li.textContent = msg;
    /*上から順に文字を追加したいときはこっち*/
    message.prepend(li);
    /*下に追加したいときはこっち
    message.appendChild(li);*/
    topmessage.textContent = msg;
});