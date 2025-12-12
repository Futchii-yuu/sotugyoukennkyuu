let pickItemsFlg = true;
let pickItems_tFlg = false;
let sellFlg = false;
let shopFlg = false;
let shopping = false;
let picked = false;

//レイアウトパーツ
const game_layout = {
    playersInfo : document.getElementById('playersInfo'),
    itemsArea : document.getElementById('items_area'),
    pickup_item : document.getElementById('pickup_item'),
    current_p : document.getElementById('current_p'),
    pickItems : document.getElementById('pickItems'),
    pickItems_d : document.getElementById('pickItems_d'),
    target : document.getElementById('target'),
    targetArrow : document.getElementById('targetArrow'),
    pickItems_t : document.getElementById('pickItems_t'),
    Below_pickItems : document.getElementById('Below_pickItems'),
    Below_pickItems_t : document.getElementById('Below_pickItems_t'),
    shopBtn : document.getElementById('shopBtn'),
    shopBoxContainer : document.getElementById('shopBoxContainer'),
    sellBtn : document.getElementById('sellBtn'),
    sellBox : document.getElementById('sellBox'),
    shopItems_area : document.getElementById('shopItems_area'),
    pickItems_shop : document.getElementById('pickItems_shop'),
}

//ゲームシステム
class catsField_gameSys {
    constructor(playerData){
        this.name = playerData.name;
        this.job = playerData.job;
        this.HP = playerData.HP;
        this.MP = playerData.MP;
        this.money = playerData.money;
        this.items = playerData.items; // サーバーから渡されたアイテムをセット
    }

    //文字数取り出し
    getVisualLength(str) {
        let length = 0;
        for (let i = 0; i < str.length; i++) {
        // 全角文字（2バイト相当）
        if (str.charCodeAt(i) > 255) {
            length += 2;
        } else {
            length += 1;
        }
        }
        return length;
    }

    showPlayers(){
        let playerInfo = document.createElement("div");
        playerInfo.classList.add("playersInfo");
        if(this.HP <= 0){
            playerInfo.style.display = "none";
        }

        //丸ポチ
        let circle = document.createElement("div");
        circle.classList.add("circle");
        switch(this.job){
            case 'swordsman':
                circle.style.backgroundColor = '#06f';
                break;
            case 'wizard':
                circle.style.backgroundColor = '#a21d97ff';
                break;
            case 'warrior':
                circle.style.backgroundColor = '#d00';
                break;
            case 'royalty':
                circle.style.backgroundColor = '#cc0';
                break;
        }
        playerInfo.appendChild(circle);

        //名前
        let playerName = document.createElement("div");
        playerName.classList.add("playersName");
        playerName.textContent = this.name;
        if (this.getVisualLength(this.name) > 10) {
            playerName.style.fontSize = "1rem";
        }else if(this.getVisualLength(this.name) > 6){
            playerName.style.fontSize = "1.4rem";
        }else{
            playerName.style.fontSize = "1.7rem";
        }
        playerInfo.appendChild(playerName);

        //ステータス
        let playerStatus = document.createElement("div");
        game_layout.playersInfo.appendChild(playerInfo);
        playerStatus.textContent = "HP" + this.HP + " "
                            + "MP" + this.MP + " "
                            + "¥" + this.money;
        playerStatus.classList.add("playersStatus");
        playerInfo.appendChild(playerStatus);

        // Add hover events for background color change
        playerInfo.onpointerover = () => {
            // Only highlight if it's this player's turn to act
            if(game_layout.current_p.innerText === gameSysInfo.thisPlayerName && pickItemsFlg){
                playerInfo.style.backgroundColor = "rgb(221, 224, 234)"; // Hover color
            }
        };

        playerInfo.onpointerout = () => {
            // Revert to the original color on mouse out
            playerInfo.style.backgroundColor = "rgb(208, 212, 224)";
        };

        //クリックイベントを付与
        playerInfo.onclick = () => {
            if(game_layout.current_p.innerText === gameSysInfo.thisPlayerName && pickItemsFlg){
                this.showTarget(this.name);
            }
        }
    }

    showItems(){
        this.deleteChild(game_layout.itemsArea);
        for(let i = 0; i < this.items.length; i++){
            //枠追加
            let item = document.createElement("div");
            item.classList.add('items');
            game_layout.itemsArea.appendChild(item);
            
            //画像
            let itemImg = document.createElement("img");
            itemImg.src = this.items[i].img;
            itemImg.classList.add("itemImg");
            item.appendChild(itemImg);

            //文字
            let item_char = document.createElement("div");
            item_char = this.getItem_char(i, item_char);
            item_char = this.getColoring(this.items[i], item_char);
            item_char.classList.add('items_char');
            item.appendChild(item_char);

            //ピックアップ表示
            item.onpointerover = () => {
                this.deleteChild(game_layout.pickup_item);
                //名前
                let itemName = document.createElement("div");
                itemName.textContent = this.items[i].name;
                itemName = this.getColoring(this.items[i], itemName);
                itemName.classList.add("itemName");
                if(this.getVisualLength(itemName.textContent) < 20){
                    itemName.style.fontSize = '1.74rem';
                }else{
                    itemName.style.fontSize = '1.4rem';
                }
                game_layout.pickup_item.appendChild(itemName)

                //画像
                let itemImg = document.createElement("img");
                itemImg.src = this.items[i].img;
                itemImg.classList.add("itemImg");
                game_layout.pickup_item.appendChild(itemImg);

                //詳細情報
                let itemInfo = document.createElement("div");
                itemInfo = this.getItem_char(i, itemInfo);
                if(this.items[i].category === 'magic'){
                    itemInfo.innerHTML += '<br>MP：-' + this.items[i].price;
                }else{
                    itemInfo.innerHTML += '<br>売価：¥' + this.items[i].price;
                }

                itemInfo.innerHTML += '<br>属性：' + this.items[i].element;
                itemInfo.classList.add("itemInfo");
                game_layout.pickup_item.appendChild(itemInfo);

                //説明文
                let infoText = document.createElement('div');
                infoText.innerHTML = this.items[i].info;
                infoText.classList.add("infoText");
                game_layout.pickup_item.appendChild(infoText);
            }

            //クリックイベントを付与
            item.onclick = () => {
                this.itemClickEvent(i, this.items[i]);
            }
        }
    }

    showCurrent_p(){
        game_layout.current_p.innerHTML = this.name;
    }

    getItem_char(i, item){
        switch(this.items[i].category){
            case 'weapon':
                item.innerHTML += '攻';
                break;
            case 'armor':
                item.innerHTML += '守';
                break;
        }
        item.innerHTML += this.items[i].power + ' ';
        return item;
    }

    getColoring(item, element){
        switch(item.element){
            case '無':
                element.style.color = '#333';
                break;
            case '火':
                element.style.color = '#d00';
                break;
            case '水':
                element.style.color = '#06f';
                break;
            case '氷':
                element.style.color = '#1abccaff';
                break;
            case '雷':
                element.style.color = '#cc0';
                break;
            case '光':
                element.style.color = '#aaa478ff';
                break;
            case '闇':
                element.style.color = '#a21d97ff';
                break;
        }
        return element;
    }

    deleteChild(parent){
        while (parent.firstChild) {
            parent.removeChild(parent.firstChild);
        }
    }
    //クリックイベント(ピックアイテム)
    itemClickEvent(i, item){
        game_layout.pickItems.style.display = 'flex';
        game_layout.pickItems_d.style.display = 'none';
        let current_p_index = (gameSysInfo.phase - 1) % gameSysInfo.playersNum;
        let next_p_index = (current_p_index + 1) % gameSysInfo.playersNum;

        while(gameSysInfo.players[next_p_index].HP <= 0){
            next_p_index = (next_p_index + 1) % gameSysInfo.playersNum;
        }

        let isDrug = false;
        if(game_layout.current_p.innerText === gameSysInfo.thisPlayerName && pickItemsFlg){
            this.deleteChild(game_layout.pickItems);
            this.deleteChild(game_layout.pickItems_d);

            if(gameSysInfo.pickItems.includes(i)){
                gameSysInfo.pickItems = gameSysInfo.pickItems.filter(_ => _ !== i);
                gameSysInfo.pickItems_d.length = 0;
            }else{
            switch(item.category){
                case 'weapon':
                    gameSysInfo.pickItems.length = 0;
                    gameSysInfo.pickItems_d.length = 0;
                    gameSysInfo.pickItems.push(i);
                    this.showTarget(gameSysInfo.playerNames[next_p_index % gameSysInfo.playersNum]);
                    break;
                case 'magic':
                    gameSysInfo.pickItems_d.length = 0;
                    switch(item.name){
                        case '＜オーラ＞':
                            gameSysInfo.pickItems.push(i);
                            this.showTarget(gameSysInfo.playerNames[next_p_index % gameSysInfo.playersNum]);
                            break;

                        case '＜防御魔法＞':
                        case '＜バリア＞':
                        case '＜シールド＞':
                        case '＜オ一ラ＞':
                        case '＜イージスガード＞':
                        case '＜エレキフィールド＞':
                            break;

                        default:
                            gameSysInfo.pickItems.length = 0;
                            gameSysInfo.pickItems.push(i);
                            this.showTarget(gameSysInfo.playerNames[next_p_index % gameSysInfo.playersNum]);
                            break;
                        }
                        break;
                case 'drug':
                    switch(item.name){
                        case 'ムキムキ薬':
                        case '伝説のムキムキ薬':
                            gameSysInfo.pickItems.push(i);
                            this.showTarget(gameSysInfo.playerNames[next_p_index % gameSysInfo.playersNum]);
                            break
                        case '伝説のカチコチ薬':
                            break
                        case '初級回復ポーション':
                        case '中級回復ポーション':
                        case '上級回復ポーション':
                        case '初級魔力ポーション':
                        case '中級魔力ポーション':
                        case '上級魔力ポーション':
                            if(gameSysInfo.pickItems_d[0] === i){
                                gameSysInfo.pickItems_d.length = 0;
                            }else{
                                gameSysInfo.pickItems.length = 0;
                                gameSysInfo.pickItems_d.length = 0;
                                game_layout.pickItems.style.display = 'none';
                                game_layout.pickItems_d.style.display = 'flex';
                                gameSysInfo.pickItems_d.push(i);
                                isDrug = true;
                            }
                            
                            break
                            
                        default:
                            gameSysInfo.pickItems.length = 0;
                            gameSysInfo.pickItems_d.length = 0;
                            gameSysInfo.pickItems.push(i);
                            this.showTarget(gameSysInfo.playerNames[next_p_index % gameSysInfo.playersNum]);
                            break
                    }
                    break
                }
            }
            if(!isDrug){
                this.showPickItems();
                game_layout.Below_pickItems.style.display = 'flex';
                this.showBelow_pickItems(this.damageCalculation());
            }else{
                this.showTarget(gameSysInfo.thisPlayerName)
                this.showPickItems_d();
                game_layout.Below_pickItems.style.display = 'none';
            }
            
        }else if(game_layout.target.innerText === gameSysInfo.thisPlayerName && pickItems_tFlg){
            if(this.judgeTrueElement(item.element) || item.name === '伝説のカチコチ薬' || item.name === '虹のエネルギー'){
                this.deleteChild(game_layout.pickItems_t);
                if(gameSysInfo.pickItems_t.includes(i)){
                    gameSysInfo.pickItems_t = gameSysInfo.pickItems_t.filter(_ => _ !== i);
                }else{
                    switch(item.category){
                        case 'armor':
                            gameSysInfo.pickItems_t.push(i);
                            break
                        case 'magic':
                            switch(item.name){
                                case '＜オーラ＞':
                                case '＜ビ一ム＞':
                                case ' ＜ファイア＞ ':
                                case ' ＜アイス＞ ':
                                case ' ＜サンダー＞ ':
                                case ' ＜ダーク＞ ':
                                case '＜エレキ砲＞':
                                    break
                                default:
                                    gameSysInfo.pickItems_t.push(i);
                            }
                        case 'drug':
                            switch(item.name){
                                case '伝説のカチコチ薬':
                                case 'エネルギー':
                                case '火のエネルギー':
                                case '水のエネルギー':
                                case '雷のエネルギー':
                                case '光のエネルギー':
                                case '闇のエネルギー':
                                case '虹のエネルギー':
                                    gameSysInfo.pickItems_t.push(i);
                                    break
                                
                            }
                    }
                }
            
            this.showPickItems_t();
            this.showBelow_pickItems_t(this.defenseCalculation());
            }
        }else if(sellFlg){
            if(item.category === 'magic'){
                return
            }
            this.deleteChild(game_layout.sellBox);
            if(gameSysInfo.sellBox.includes(i)){
                gameSysInfo.sellBox = gameSysInfo.sellBox.filter(_ => _ !== i);
            }else{
                gameSysInfo.sellBox.length = 0;
                gameSysInfo.sellBox.push(i);
            }
            this.showSellBox();
            this.showPrice(this.priceCalculation());
        }
    }

    showPickItems(){
        for(const i of gameSysInfo.pickItems){
            game_layout.pickItems.appendChild(this.createClickedItem(i, this.items[i], gameSysInfo.pickItems));
        }
    }
    showPickItems_d(){
        for(const i of gameSysInfo.pickItems_d){
            game_layout.pickItems_d.appendChild(this.createClickedItem(i, this.items[i], gameSysInfo.pickItems_d));
        }
    }
    showPickItems_t(){
        for(const i of gameSysInfo.pickItems_t){
            game_layout.pickItems_t.appendChild(this.createClickedItem(i, this.items[i], gameSysInfo.pickItems_t));
        }
    }
    showSellBox(){
        for(const i of gameSysInfo.sellBox){
            game_layout.sellBox.appendChild(this.createClickedItem(i, this.items[i], gameSysInfo.sellBox));
        }
    }
    showPickItems_shop(i){
        let container = document.createElement('div');
        container.classList.add('c_container');

        let itemImg = document.createElement("img");
        itemImg.src = shopItems[i].img;
        itemImg.classList.add("c_itemImg");
        container.appendChild(itemImg)

        let itemName = document.createElement("div");
        itemName.textContent = shopItems[i].name;
        switch(shopItems[i].element){
            case '無':
                itemName.style.color = '#333';
                break;
            case '火':
                itemName.style.color = '#d00';
                break;
            case '水':
                itemName.style.color = '#06f';
                break;
            case '氷':
                itemName.style.color = '#1abccaff';
                break;
            case '雷':
                itemName.style.color = '#cc0';
                break;
            case '光':
                itemName.style.color = '#aaa478ff';
                break;
            case '闇':
                itemName.style.color = '#a21d97ff';
                break;
        }
        itemName.classList.add("c_itemName");
        if(this.getVisualLength(itemName.textContent) < 18){ 
            itemName.style.fontSize = '1rem';
        }else{
            itemName.style.fontSize = '0.75rem';
        }
        container.appendChild(itemName)
        
        let itemInfo = document.createElement("div");
        //文字
        itemInfo.innerHTML = shopItems[i].power + ' ';
        itemInfo.innerHTML += '¥' + shopItems[i].price;
        
        switch(shopItems[i].element){
            case '無':
                itemInfo.style.color = '#333';
                break;
            case '火':
                itemInfo.style.color = '#d00';
                break;
            case '水':
                itemInfo.style.color = '#06f';
                break;
            case '氷':
                itemInfo.style.color = '#1abccaff';
                break;
            case '雷':
                itemInfo.style.color = '#cc0';
                break;
            case '光':
                itemInfo.style.color = '#aaa478ff';
                break;
            case '闇':
                itemInfo.style.color = '#a21d97ff';
                break;
        }
        itemInfo.classList.add("c_itemInfo");
        container.appendChild(itemInfo);

        let infoText = document.createElement('div');
        infoText.innerHTML = shopItems[i].info;
        infoText.classList.add("c_infoText");
        container.appendChild(infoText);

        game_layout.pickItems_shop.appendChild(container);
    }

    //clickedアイテムを作成
    createClickedItem(i, item, containerType){
        let container = document.createElement('div');
        container.classList.add('c_container');

        let itemImg = document.createElement("img");
        itemImg.src = item.img;
        itemImg.classList.add("c_itemImg");
        container.appendChild(itemImg)

        let itemName = document.createElement("div");
        itemName.textContent = item.name;
        itemName = this.getColoring(item, itemName);
        itemName.classList.add("c_itemName");
        if(this.getVisualLength(itemName.textContent) < 18){ 
            itemName.style.fontSize = '1rem';
        }else{
            itemName.style.fontSize = '0.75rem';
        }
        container.appendChild(itemName)
        
        let itemInfo = document.createElement("div");
        itemInfo = this.getItem_char(i, itemInfo);
        if(item.category === 'magic'){
            itemInfo.innerHTML += '-' + item.price;
        }else{
            itemInfo.innerHTML += '¥' + item.price;
        }
        
        itemInfo = this.getColoring(item, itemInfo);
        itemInfo.classList.add("c_itemInfo");
        
        container.appendChild(itemInfo)

        if(containerType.length < 6){
            let infoText = document.createElement('div');
            infoText.textContent = item.info;
            infoText.classList.add("c_infoText");
            container.appendChild(infoText)
        }

        return container
    }

    //攻撃対象を表示する
    showTarget(name){
        this.deleteChild(game_layout.target);
        game_layout.target.classList.remove('target');
        this.deleteChild(game_layout.targetArrow);
        game_layout.targetArrow.classList.remove('targetArrow');
        game_layout.targetArrow.classList.remove('targetArrow_r');
        let targetArrow = document.createElement('img');
        targetArrow.src = 'img/targetArrow.jpg';
        if(name === game_layout.current_p.textContent){
            targetArrow.classList.add('targetArrow_r');
            game_layout.targetArrow.appendChild(targetArrow);
        }else{
            let target = document.createElement('div');
            target.textContent = name;
            game_layout.target.classList.add('target');
            game_layout.target.appendChild(target);
            targetArrow.classList.add('targetArrow');
            game_layout.targetArrow.appendChild(targetArrow);
        }
    }

    //weaponがないか探索
    searchWeapon(){
        for(const item of this.items){
            if(item.category === 'weapon'){
                return false
            }
        }
        return true
    }

    //ダメージ計算
    damageCalculation(){
        let damageSum = 0;
        let dmgElement = '';

        for(const pickItem of gameSysInfo.pickItems){
            switch(this.items[pickItem].category){
                case 'weapon':
                    damageSum += this.items[pickItem].power;
                    break

                case 'magic':
                    switch(this.items[pickItem].name){
                        case '＜オーラ＞':
                            damageSum *= 2;
                            break

                        default:
                            damageSum += this.items[pickItem].power;
                            break
                    }
                    break
                case 'drug':
                    switch(this.items[pickItem].name){
                        case 'ムキムキ薬':
                            damageSum *= 2;
                            break
                        case '伝説のムキムキ薬':
                            damageSum *= 3;
                            break

                        default:
                            damageSum += this.items[pickItem].power;
                            break
                    }
            }

            dmgElement = this.judgeElement(this.items[pickItem].element, dmgElement);
        }
        return [damageSum, dmgElement];
    }

    //属性ジャッジ
    judgeElement(element, dmgElement){
        if(dmgElement === ''){
            dmgElement = element;
        }else if(dmgElement !== element){
            dmgElement = '無'
        }

        return dmgElement
    }
    
    //ダメージ表示
    showBelow_pickItems(dmg_and_Element){
        if(gameSysInfo.pickItems.length <= 0){
            game_layout.Below_pickItems.style.backgroundColor = 'rgb(166,170,181)';
            game_layout.Below_pickItems.style.border = '4px solid rgb(166,170,181)';
            game_layout.Below_pickItems.style.color = '#f5f5f5';
            game_layout.Below_pickItems.textContent = '補充';
        }else{
            game_layout.Below_pickItems.style.backgroundColor = '#f5f5f5';
            let color = '#333';
            switch(dmg_and_Element[1]){
                case '無':
                    color = '#333';
                    break;
                case '火':
                    color = '#d00';
                    break;
                case '水':
                    color = '#06f';
                    break;
                case '雷':
                    color = '#cc0';
                    break;
                case '光':
                    color = '#aaa478ff';
                    break;
                case '闇':
                    color = '#a21d97ff';
                    break;
            }
            game_layout.Below_pickItems.style.border = '4px solid ' + color;
            game_layout.Below_pickItems.style.color = color;
            game_layout.Below_pickItems.textContent = '攻' + dmg_and_Element[0];
        }
    }

    //売価計算
    priceCalculation(){
        let priceSum = 0;
        for(const item of gameSysInfo.sellBox){
            priceSum += this.items[item].price;
        }
        return priceSum;
    }

    //売価表示
    showPrice(priceSum){
        game_layout.Below_pickItems.style.backgroundColor = '#f5f5f5';
        game_layout.Below_pickItems.style.border = '4px solid #333';
        game_layout.Below_pickItems.style.color = '#333';
        game_layout.Below_pickItems.textContent = '+¥' + priceSum;
    }

    showPrice_t(priceSum){
        game_layout.Below_pickItems.style.backgroundColor = '#f5f5f5';
        game_layout.Below_pickItems.style.border = '4px solid #333';
        game_layout.Below_pickItems.style.color = '#333';
        game_layout.Below_pickItems.textContent = '-¥' + priceSum;
    }

    //防御計算
    defenseCalculation(){
        let dfSum = 0;
        let dfElement = '';

        for(const pickItem of gameSysInfo.pickItems_t){
            switch(this.items[pickItem].category){
                case 'armor':
                    dfSum += this.items[pickItem].power;
                    break

                case 'magic':
                    dfSum += this.items[pickItem].power;
                    break

                case 'drug':
                    dfSum += this.items[pickItem].power;
                    break
            }

            dfElement = this.judgeElement(this.items[pickItem].element, dfElement);
        }
        return [dfSum, dfElement];
    }

    //防御表示
    showBelow_pickItems_t(num_and_Element){
        if(gameSysInfo.pickItems_t.length <= 0){
            game_layout.Below_pickItems_t.style.backgroundColor = 'rgb(195, 58, 58)';
            game_layout.Below_pickItems_t.style.border = '4px solid rgb(195, 58, 58)';
            game_layout.Below_pickItems_t.style.color = '#f5f5f5';
            game_layout.Below_pickItems_t.textContent = '許す';
        }else{
            game_layout.Below_pickItems_t.style.backgroundColor = '#f5f5f5';
            let color = '#333';
            switch(num_and_Element[1]){
                case '無':
                    color = '#333';
                    break;
                case '火':
                    color = '#d00';
                    break;
                case '水':
                    color = '#06f';
                    break;
                case '雷':
                    color = '#cc0';
                    break;
                case '光':
                    color = '#aaa478ff';
                    break;
                case '闇':
                    color = '#a21d97ff';
                    break;
            }
            game_layout.Below_pickItems_t.style.border = '4px solid ' + color;
            game_layout.Below_pickItems_t.style.color = color;
            game_layout.Below_pickItems_t.textContent = '守' + num_and_Element[0];
        }

        game_layout.Below_pickItems_t.style.opacity = 1
    }

    //防御できる属性かジャッジする
    judgeTrueElement(element){
        //ダメージ表示の色で属性判断
        switch(game_layout.Below_pickItems.style.borderColor){
            case 'rgb(51, 51, 51)':
                return true
            case 'rgb(221, 0, 0)':
                if(element === '水')return true
                break;
            case 'rgb(0, 102, 255)':
                if(element === '火')return true
                break;
            case 'rgb(204, 204, 0)':
                if(element === '雷')return true
                break;
            case 'rgb(170, 164, 120)':
                if(element === '闇')return true
                break;
            case 'rgb(162, 29, 151)':
                if(element === '光')return true
                break;
        }
        return false
    }

    MP_Calculation(container){
        let mp_sum = 0;
        for(const item_index of container){
            if(this.items[item_index].category === 'magic'){
                mp_sum += this.items[item_index].price;
            }else{
                switch(this.items[item_index].name){
                    case '初級魔力ポーション':
                    case '中級魔力ポーション':
                    case '上級魔力ポーション':
                        mp_sum += this.items[item_index].power;
                }
            }
        }

        return mp_sum
    }

}

//onpointerイベント
game_layout.pickItems.onpointerover = () => {
    if(game_layout.current_p.innerText === gameSysInfo.thisPlayerName && pickItemsFlg){
        game_layout.pickItems.style.backgroundColor = "#f5f5f5";
    }
}
game_layout.pickItems.onpointerout = () => {
    if(game_layout.current_p.innerText === gameSysInfo.thisPlayerName && pickItemsFlg){
        game_layout.pickItems.style.backgroundColor = "transparent";
    }
}

game_layout.pickItems_d.onpointerover = () => {
    if(pickItemsFlg){
        game_layout.pickItems_d.style.backgroundColor = "#f5f5f5";
    }
}
game_layout.pickItems_d.onpointerout = () => {
    if(pickItemsFlg){
        game_layout.pickItems_d.style.backgroundColor = "transparent";
    }
}


game_layout.pickItems_t.onpointerover = () => {
    if(game_layout.target.innerText === gameSysInfo.thisPlayerName && pickItems_tFlg){
        game_layout.pickItems_t.style.backgroundColor = "#f5f5f5";
    }
}
game_layout.pickItems_t.onpointerout = () => {
    if(game_layout.target.innerText === gameSysInfo.thisPlayerName && pickItems_tFlg){
        game_layout.pickItems_t.style.backgroundColor = "transparent";
    }
}

game_layout.sellBox.onpointerover = () => {
    if(sellFlg){
        game_layout.sellBox.style.backgroundColor = "#f5f5f5";
    }
}
game_layout.sellBox.onpointerout = () => {
    if(sellFlg){
        game_layout.sellBox.style.backgroundColor = "transparent";
    }
}

game_layout.pickItems_shop.onpointerover = () => {
    if(shopFlg){
        game_layout.pickItems_shop.style.backgroundColor = "#f5f5f5";
    }
}
game_layout.pickItems_shop.onpointerout = () => {
    if(shopFlg){
        game_layout.pickItems_shop.style.backgroundColor = "transparent";
    }
}


//ショップアイテムの生成
const shopItems = [
    //薬
    {name: "初級回復ポーション", power: 5, price: 5, element: "無", category: "drug", probability: 0, info: "使うとHPが少し回復する", img: "img/HP_potion1.jpg"},
    {name: "中級回復ポーション", power: 10, price: 10, element: "無", category: "drug", probability: 0, info: "使うとHPが回復する", img: "img/HP_potion1.jpg"},
    {name: "上級回復ポーション", power: 20, price: 20, element: "無", category: "drug", probability: 0, info: "使うとHPが大きく回復する", img: "img/HP_potion3.jpg"},
    {name: "初級魔力ポーション", power: 10, price: 5, element: "無", category: "drug", probability: 0, info: "使うとMPが少し回復する", img: "img/MP_potion1.jpg"},
    {name: "中級魔力ポーション", power: 20, price: 10, element: "無", category: "drug", probability: 0, info: "使うとMPが回復する", img: "img/MP_potion1.jpg"},
    {name: "上級魔力ポーション", power: 40, price: 20, element: "無", category: "drug", probability: 0, info: "使うとMPが大きく回復する", img: "img/MP_potion3.jpg"},
    {name: "ムキムキ薬", power: 0, price: 35, element: "無", category: "drug", probability: 0, info: "使うとダメージを2倍にできる", img: "img/mukimuki_potion1.jpg"},
    {name: "伝説のムキムキ薬", power: 0, price: 50, element: "無", category: "drug", probability: 0, info: "使うとダメージを3倍にできる", img: "img/mukimuki_potion2.jpg"},
    {name: "伝説のカチコチ薬", power: 999, price: 40, element: "無", category: "drug", probability: 0, info: "よっぽどのことがなければ属性を無視してダメージを無効にできる", img: "img/katikoti_potion.jpg"},
    {name: "エネルギー", power: 20, price: 10, element: "無", category: "drug", probability: 0, info: "攻撃にも防御にも使えるエネルギー", img: "img/muNoEnergy.jpg"},
    {name: "火のエネルギー", power: 10, price: 10, element: "火", category: "drug", probability: 0, info: "攻撃にも防御にも使える火のエネルギー", img: "img/hiNoEnergy.jpg"},
    {name: "水のエネルギー", power: 10, price: 10, element: "水", category: "drug", probability: 0, info: "攻撃にも防御にも使える水のエネルギー", img: "img/mizuNoEnergy.jpg"},
    {name: "雷のエネルギー", power: 10, price: 10, element: "雷", category: "drug", probability: 0, info: "攻撃にも防御にも使える雷のエネルギー", img: "img/kaminariNoEnergy.jpg"},
    {name: "光のエネルギー", power: 10, price: 10, element: "光", category: "drug", probability: 0, info: "攻撃にも防御にも使える光のエネルギー", img: "img/hikariNoEnergy.jpg"},
    {name: "闇のエネルギー", power: 10, price: 10, element: "闇", category: "drug", probability: 0, info: "攻撃にも防御にも使える闇のエネルギー", img: "img/yamiNoEnergy.jpg"},
    {name: "虹のエネルギー", power: 10, price: 10, element: "無", category: "drug", probability: 0, info: "防御に使う際、属性を無視して防御できる虹のエネルギー", img: "img/rainbowEnergyCore.jpg"},
]

const showShopItems = (shopItems) => {
    for(let i = 0; i < shopItems.length; i++){
        //枠追加
        let item = document.createElement("div");
        item.classList.add('items');
        game_layout.itemsArea.appendChild(item);
        
        //画像
        let itemImg = document.createElement("img");
        itemImg.src = shopItems[i].img;
        itemImg.classList.add("itemImg");
        item.appendChild(itemImg);

        //文字
        let item_char = document.createElement("div");
        item_char.innerText = shopItems[i].power;
        switch(shopItems[i].element){
            case '無':
                item_char.style.color = '#333';
                break;
            case '火':
                item_char.style.color = '#d00';
                break;
            case '水':
                item_char.style.color = '#06f';
                break;
            case '氷':
                item_char.style.color = '#1abccaff';
                break;
            case '雷':
                item_char.style.color = '#cc0';
                break;
            case '光':
                item_char.style.color = '#aaa478ff';
                break;
            case '闇':
                item_char.style.color = '#a21d97ff';
                break;
        }
        item_char.classList.add('items_char');
        item.appendChild(item_char);

        game_layout.shopItems_area.appendChild(item);
        
        item.onpointerover = () => {
            while (game_layout.pickup_item.firstChild) {
                game_layout.pickup_item.removeChild(game_layout.pickup_item.firstChild);
            }
            //名前
            let itemName = document.createElement("div");
            itemName.textContent = shopItems[i].name;
            switch(shopItems[i].element){
                case '無':
                    itemName.style.color = '#333';
                    break;
                case '火':
                    itemName.style.color = '#d00';
                    break;
                case '水':
                    itemName.style.color = '#06f';
                    break;
                case '氷':
                    itemName.style.color = '#1abccaff';
                    break;
                case '雷':
                    itemName.style.color = '#cc0';
                    break;
                case '光':
                    itemName.style.color = '#aaa478ff';
                    break;
                case '闇':
                    itemName.style.color = '#a21d97ff';
                    break;
            }
            itemName.classList.add("itemName");
            itemName.style.fontSize = '1.74rem';
            game_layout.pickup_item.appendChild(itemName)

            //画像
            let itemImg = document.createElement("img");
            itemImg.src = shopItems[i].img;
            itemImg.classList.add("itemImg");
            game_layout.pickup_item.appendChild(itemImg);

            //詳細情報
            let itemInfo = document.createElement("div");
            itemInfo.innerHTML = shopItems[i].power;
            itemInfo.innerHTML += '<br>売価：¥' + shopItems[i].price;
            itemInfo.innerHTML += '<br>属性：' + shopItems[i].element;
            itemInfo.classList.add("itemInfo");
            game_layout.pickup_item.appendChild(itemInfo);

            //説明文
            let infoText = document.createElement('div');
            infoText.innerHTML = shopItems[i].info;
            infoText.classList.add("infoText");
            game_layout.pickup_item.appendChild(infoText);
            
        }

        item.onclick = () => {
            
            if(shopFlg){
                p = gameSysInfo.players[gameSysInfo.thisPlayerNum];
                p.deleteChild(game_layout.pickItems_shop);
                if(gameSysInfo.pickItems_shop.includes(i)){
                    gameSysInfo.pickItems_shop = gameSysInfo.pickItems_shop.filter(_ => _ !== i);
                }else{
                    gameSysInfo.pickItems_shop.length = 0;
                    gameSysInfo.pickItems_shop.push(i);
                    p.showPrice_t(shopItems[i].price);
                }
                for(const item of gameSysInfo.pickItems_shop){
                    p.showPickItems_shop(item);
                }
                if(gameSysInfo.pickItems_shop.length === 0) p.showPrice_t(0);
            }
        }
    }
}