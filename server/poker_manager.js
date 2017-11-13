
/**
 * Module exports.
 */

module.exports = PokerManager;


/**
 * PokerManager constructor.
 *
 * @param
 */
function PokerManager(){
	this.genAllPokers();
}

/**
*	洗牌
*	返回 map
*/
PokerManager.prototype.genAllPokers = function(){
	let pokerList = shuffle();
	let p1List = []//玩家0，1，2的牌
	let p2List = [];
	let p3List = [];
	let p4List = [];//抢地主的三张牌

	for (let i = 0; i < 17; i++) {
		p1List.push(pokerList[i]);
	}
	for (let i = 17; i < 34; i++) {
		p2List.push(pokerList[i]);
	}
	for (let i = 34; i < 51; i++) {
		p3List.push(pokerList[i]);
	}
	for (let i = 51; i < 54; i++) {
		p4List.push(pokerList[i]);
	}

	let map = {};
	map[0] = p1List;
	map[1] = p2List;
	map[2] = p3List;
	map[3] = p4List;

	return map;
};



let ColourType = {
	heitao:'heitao',
	hongxin:'hongxin',
	meihua:'meihua',
	fangzhuan:'fangzhuan',
	dawang:'dawang',
	xiaowang:'xiaowang'
};

function Poker(colourType, num){
	this.colourType = colourType;
	this.num = num;
	this.name = colourType + '_' + num;

	/**
	 * 牌大小值
	 * 同一个num的值一样大，出王外
	 * @return
	 */
	let value = 0;
	if(this.num >= 3 && this.num <= 13)
		value = this.num;
	else if(this.num == 0){//
		value = this.colourType == ColourType.dawang ? 17 : 16;
	}
	else if(this.num == 1){
		value = 14;
	}
	else if(this.num == 2){
		value = 15;
	}
	this.value = value;


	/**
	* 排序大小
	*/
	let sortValue = 0;
	if(this.colourType == ColourType.dawang || this.colourType == ColourType.xiaowang){
		sortValue = this.value;
	}
	else if(this.colourType == ColourType.heitao){
		sortValue = this.value + 0.4;	
	}
	else if(this.colourType == ColourType.hongxin){
		sortValue = this.value + 0.3;	
	}
	else if(this.colourType == ColourType.meihua){
		sortValue = this.value + 0.2;	
	}
	else{
		sortValue = this.value + 0.1;		
	}
	this.sortValue = sortValue;
}

// 洗牌
function shuffle(){
	let list = new Array();

	list.push(new Poker(ColourType.dawang, 0));
	list.push(new Poker(ColourType.xiaowang, 0));

	for(let i = 1; i <= 4; i++){
		let type = '';
		if(i==1)
			type = ColourType.heitao;
		else if(i==2)
			type = ColourType.hongxin;
		else if(i==3)
			type = ColourType.meihua;
		else
			type = ColourType.fangzhuan;

		for (let j = 1; j <= 13; j++) {
			list.push(new Poker(type, j));
		}
	}

	list.shuffle();

	return list;
}

//数组洗牌
Array.prototype.shuffle = function() {
	let input = this;
	for (let i = input.length-1; i >=0; i--) {
		let randomIndex = Math.floor(Math.random()*(i+1)); 
		let itemAtIndex = input[randomIndex]; 
		input[randomIndex] = input[i]; 
		input[i] = itemAtIndex;
	}
	return input;
}

// ======== test ==========

// let list = shuffle();
// console.log(JSON.stringify(list));

// let pm = new PokerManager();
// let map = pm.genAllPokers();
// console.log(JSON.stringify(map));

// console.log(-1%3);



// let PokerPlayHelp = require('./poker_play');
// let pokerList = new Array();

// 单个
// let poker1 = new Poker(ColourType.meihua, 3);
// pokerList.push(poker1);

// 一对
// let poker1 = new Poker(ColourType.meihua, 3);
// let poker2 = new Poker(ColourType.heitao, 3);
// pokerList.push(poker1);
// pokerList.push(poker2);

// 三个
// let poker1 = new Poker(ColourType.meihua, 3);
// let poker2 = new Poker(ColourType.heitao, 3);
// let poker3 = new Poker(ColourType.fangzhuan, 3);
// let poker4 = new Poker(ColourType.heitao, 4);
// let poker5 = new Poker(ColourType.hongxin, 4);
// pokerList.push(poker1);
// pokerList.push(poker2);
// pokerList.push(poker3);
// pokerList.push(poker4);
// pokerList.push(poker5);


// 王炸
// let poker1 = new Poker(ColourType.dawang, 0);
// let poker2 = new Poker(ColourType.xiaowang, 0);
// pokerList.push(poker1);
// pokerList.push(poker2);
// 炸弹
// let poker1 = new Poker(ColourType.meihua, 3);
// let poker2 = new Poker(ColourType.heitao, 3);
// let poker3 = new Poker(ColourType.fangzhuan, 3);
// let poker4 = new Poker(ColourType.hongxin, 3);

// pokerList.push(poker1);
// pokerList.push(poker2);
// pokerList.push(poker3);
// pokerList.push(poker4);

//四个
// let poker1 = new Poker(ColourType.meihua, 3);
// let poker2 = new Poker(ColourType.heitao, 3);
// let poker3 = new Poker(ColourType.fangzhuan, 3);
// let poker4 = new Poker(ColourType.hongxin, 3);
// let poker5 = new Poker(ColourType.hongxin, 8);
// let poker6 = new Poker(ColourType.hongxin, 9);

// pokerList.push(poker1);
// pokerList.push(poker2);
// pokerList.push(poker3);
// pokerList.push(poker4);
// pokerList.push(poker5);
// pokerList.push(poker6);

//顺子
// let poker1 = new Poker(ColourType.meihua, 3);
// let poker2 = new Poker(ColourType.heitao, 4);
// let poker3 = new Poker(ColourType.fangzhuan, 5);
// let poker4 = new Poker(ColourType.hongxin, 6);
// let poker5 = new Poker(ColourType.hongxin, 7);
// let poker6 = new Poker(ColourType.hongxin, 8);

// pokerList.push(poker1);
// pokerList.push(poker2);
// pokerList.push(poker3);
// pokerList.push(poker4);
// pokerList.push(poker5);
// pokerList.push(poker6);

// 连对
// let poker1 = new Poker(ColourType.meihua, 3);
// let poker2 = new Poker(ColourType.heitao, 3);
// let poker3 = new Poker(ColourType.fangzhuan, 4);
// let poker4 = new Poker(ColourType.hongxin, 4);
// let poker5 = new Poker(ColourType.hongxin, 5);
// let poker6 = new Poker(ColourType.heitao, 5);

// pokerList.push(poker1);
// pokerList.push(poker2);
// pokerList.push(poker3);
// pokerList.push(poker4);
// pokerList.push(poker5);
// pokerList.push(poker6);


// 飞机
// let poker1 = new Poker(ColourType.meihua, 3);
// let poker2 = new Poker(ColourType.heitao, 3);
// let poker3 = new Poker(ColourType.fangzhuan, 3);
// let poker4 = new Poker(ColourType.fangzhuan, 4);
// let poker5 = new Poker(ColourType.hongxin, 4);
// let poker6 = new Poker(ColourType.heitao, 4);
// let poker7 = new Poker(ColourType.hongxin, 5);
// let poker8 = new Poker(ColourType.heitao, 5);

// pokerList.push(poker1);
// pokerList.push(poker2);
// pokerList.push(poker3);
// pokerList.push(poker4);
// pokerList.push(poker5);
// pokerList.push(poker6);
// pokerList.push(poker7);
// pokerList.push(poker8);

// try{
// 	let pph = new PokerPlayHelp();
// 	let pw = pph.getPokerWraper(pokerList);
// 	console.log('pw : ' + JSON.stringify(pw));	
// } catch(err){
// 	err;

// 	console.log(err);
// }



