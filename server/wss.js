'use strict'

const webSocketServer = require('ws').Server; //ws服务
let wss = null;

let PokerManager = require('./poker_manager');
let pm = new PokerManager(); // 扑克管理器

let PokerPlayHelp = require('./poker_play');
let pph = new PokerPlayHelp();

let roomMap = {};//房间号对应的房间
let playerRoomMap = {};//人对应的房间
let playerMap = {}; //人名对应的人
let currentName = '';

function Player(name, index) {
	this.name = name;
	this.index = index;
	this.isPass = false;
	this.pokerList = new Array();
	this.noGrab = null; //不抢地主
	this.resetNoGrab = function () {
		this.noGrab = null;
	}
};

function Room(roomNum) {
	this.roomNum = roomNum;//房号
	this.playerList = new Array();//玩家列表
	this.readyCount = 0;
	this.join = function (playerName) {
		let player = new Player(playerName, this.playerList.length);
		playerMap[playerName] = player;

		this.playerList.push(player);
		playerRoomMap[playerName] = this;
	};
	this.leave = function (player) {
		this.playerList.splice(player.index, 1);
	};

	roomMap[this.roomNum] = this;

	this.addReadyCount = function () {
		this.readyCount++;
	};
	this.resetReadyCount = function () {
		this.readyCount = 0;
	};
};

function PlayController(room) {
	this.room = room;
	// 正在出牌的序号（0,1,2）
	this.currentPlayingIndex;
	//上一首牌
	this.lastPokers;
	//上一手牌的牌型包装器
	this.lastPokerWraper;
	// 第一手牌
	this.isFirstPoker;
	// 地主牌
	this.dizhuPokers;

	this.lastGrabIndex = -1;	//最后抢地主的序号
	this.passCount = 0;	//不抢的次数
	this.remainCount = 4;	//剩余抢地主次数
	this.resetGrab = function () {
		this.lastGrabIndex = -1;
		this.passCount = 0;	//不抢的次数
		this.remainCount = 4;	//剩余抢地主次数
	}
};

let roomControllerMap = {};

let roomArray = [];

function hook(ws, _open, _message, _close, _error) {
	ws.on('open', _open);
	ws.on('message', _message);
	ws.on('close', _close);
	ws.on('error', _error);
};

exports.start = () => {
	console.log('ws start');
	wss = new webSocketServer({ port: 3000 });
	wss.on('connection', (ws) => {
		console.log('client connected');
		hook(ws,
			onOpen.bind(ws),
			onMessage.bind(ws),
			onClose.bind(ws),
			onError.bind(ws));
	});
};

//广播  
function broadcast(msg) {
	// console.log(ws);  
	wss.clients.forEach(function (client) {
		client.send(stringifyJson(msg));
	});
};

function onOpen(event) {
	console.log('open');

	//登陆返回clientId
	let clientId = Date.parse(new Date()) / 1000;
	this.send('hello', clientId);

};

function onMessage(event) {
	let self = this;
	let msg = parseJson(event);
	console.log(msg);
	if (msg && msg.f) {
		let m = msg.msg || {};
		switch (msg.f) {
			case 'createRoom':
				onCreateRoom.call(self, m);
				break;
			case 'roomList':
				onRoomList.call(self, m);
				break;
			case 'joinRoom':
				onJoinRoom.call(self, m);
				break;
			case 'ready':
				onReady.call(self, m);
				break;
			case 'qiangdizhu':
				onQiangDizhu.call(self, m);
				break;
			case 'play':
				onPlayCard.call(self, m);
				break;
			default:
				break;
		}
	} else {
		console.log('bad package');
	}
};

function onClose(event) {
	console.log('onClose');
	let room = playerRoomMap[currentName];
	let player = playerMap[currentName];
	console.log('---' + room);
	if (room && player) {
		room.leave(player);
		let roomNum = room.roomNum;
	}
};

function onError(event) {
	console.log('onError');
};

//创建房间
function onCreateRoom(msg) {
	let playerName = msg;
	currentName = playerName;
	// console.log(clientId + 'creating room .');
	let roomNum = roomArray.length + 1;
	let room = new Room(roomNum);

	roomArray.push(room);

	room.join(playerName);
	console.log('playerRoomMap:' + JSON.stringify(playerRoomMap[playerName]));
	// console.log('room num is ' + JSON.stringify(room));
	let _msg = { f: 'createRoom', msg: room };
	this.send(stringifyJson(_msg));
};

//房间列表
function onRoomList(msg) {
	let _msg = { f: 'roomList', msg: roomArray };
	this.send(stringifyJson(_msg));
};

// 加入房间 msg=playerName,roomNum
function onJoinRoom(msg) {
	let arr = msg.split(',');
	let playerName = arr[0];
	let roomNum = arr[1];

	currentName = playerName;

	let room = roomMap[roomNum];
	if (room) {
		room.join(playerName);
		// 发送加入房间的消息，全局
		console.log('nitify joinRoom');
		let _msg = { f: 'joinRoom', msg: room.playerList.length - 1 };
		this.send(stringifyJson(_msg));
		let _msg2 = { f: roomNum + 'joinRoom', msg: room };
		broadcast(_msg2);

		//如果够三个人，就开始
		if (room.playerList.length == 3) {
			let _msg3 = { f: roomNum + 'gameStart', msg: room }
			broadcast(_msg3);
		}
	}
};

function onReady(msg) {
	console.log('onReady');
	let arr = msg.split(',');
	let playerName = arr[0];
	let roomNum = arr[1];

	let room = roomMap[roomNum];
	if (room) {
		room.addReadyCount();

		if (room.readyCount == 3) {
			dealingCard(room);
		}
	}
};

//抢地主逻辑
function onQiangDizhu(msg) {
	console.log('onQiangDizhu');
	let msgBean = msg;

	let playerName = msgBean.playerName;
	let roomNum = msgBean.roomNum;
	let qiangdizhu = msgBean.qiangdizhu;

	let room = roomMap[roomNum];
	let pc = roomControllerMap[roomNum];
	let player = playerMap[playerName];
	player.noGrab = !qiangdizhu;

	if (room && pc && player) {
		if (qiangdizhu) {
			pc.lastGrabIndex = player.index;
		}
		pc.remainCount--;

		if (pc.passCount >= 2) {
			if (pc.lastGrabIndex == -1) {//重新发牌
				dealingCard(room);
			} else {//通知出牌
				notifyPlayerPlay(room, pc);
			}
		} else {
			if (pc.remainCount <= 0) {
				if (pc.lastGrabIndex == -1) {//重新发牌
					dealingCard(room);
				}
				else {//通知出牌
					notifyPlayerPlay(room, pc);
				}
			} else {
				if (qiangdizhu == false)
					pc.passCount++;

				//下一家是否不抢
				let nextIndex = (player.index + 1) % 3;
				let nextPlayer = room.playerList[nextIndex];
				console.log('noGrab:', nextPlayer.noGrab);
				if (nextPlayer.noGrab === null || !nextPlayer.noGrab) {//下一家上一次抢地主为空或抢地主，则通知再抢地主
					let _msg = { f: nextPlayer.name + 'qiangdizhu', msg: 'qiangdizhu' };
					broadcast(_msg);
				} else {
					//判断下下家
					let doubleNextIndex = (player.index + 2) % 3;
					let doubleNextPlayer = room.playerList[doubleNextIndex];
					console.log('下下家：', doubleNextIndex, ' lastGrabIndex:', pc.lastGrabIndex);
					if (doubleNextIndex == pc.lastGrabIndex) {//通知下下出牌
						notifyPlayerPlay(room, pc);
					}
					else {//通知下下家抢地主
						let _msg = { f: doubleNextPlayer.name + 'qiangdizhu', msg: 'qiangdizhu' };
						broadcast(_msg);
					}
				}
			}
		}
	}

};

function onPlayCard(msg) {
	let msgBean = msg;
	let player = playerMap[msgBean.playerName];
	let pokerList = msgBean.pokerList;
	let isPass = msgBean.isPass;

	player.isPass = isPass;

	if (player) {
		let room = playerRoomMap[player.name];
		let pc = roomControllerMap[room.roomNum];
		if (room && pc) {
			if (player.index != pc.currentPlayingIndex) {//不是当前玩家
				let _msg = { f: 'playError', msg: '还不到你出牌' }
				this.send(stringifyJson(_msg));
			} else {
				if (pc.isFirstPoker) {//一手牌
					if (!pokerList || pokerList.length == 0) {
						let _msg = { f: 'playError', msg: '选择你要出的牌' }
						this.send(stringifyJson(_msg));
						return;
					}

					try {
						let pw = pph.getPokerWraper(pokerList);
						console.log('pw : ' + JSON.stringify(pw));
						pc.lastPokerWraper = pw;
					} catch (err) {
						// err;
						let _msg = { f: 'playError', msg: err }
						this.send(stringifyJson(_msg));
						console.log(err);
						return;
					}

					//是否已出完牌
					arrayPokerDifference(player.pokerList, pokerList);
					console.log('剩余牌数量： ' + player.pokerList.length);
					if (player.pokerList.length == 0) {
						let _msg = { f: room.roomNum + 'gameOver', msg: '游戏结束' };
						broadcast(_msg);
						return;
					}
					let _msg = { f: 'playSuccess', msg: 'ok' };
					this.send(stringifyJson(_msg));

					// 通知下一家跟牌
					let command = CmdType.follow;
					let playType = PlayType.follow;
					notifyNextPlayer(pc, player, room, pokerList, command, playType);
				} else {//跟牌
					// 校验牌型是否一样，是否能管上
					if (!isPass) {// 玩家跟牌
						// 校验 TODO
						if (!pokerList || pokerList.length == 0) {
							let _msg = { f: 'playError', msg: '选择你要出的牌' };
							this.send(stringifyJson(_msg));
							return;
						}
						try {
							//是否能管上
							let result = pc.lastPokerWraper.follow(pokerList);
							if (!result.canFollow) {
								let _msg = { f: 'playError', msg: '你的牌不够大' };
								this.send(stringifyJson(_msg));
								return;
							}

							pc.lastPokerWraper = result.targetPokerWraper;
						} catch (err) {
							// err;
							let _msg = { f: 'playError', msg: err }
							this.send(stringifyJson(_msg));
							console.log(err);
							return;
						}

						//是否已出完牌
						arrayPokerDifference(player.pokerList, pokerList);
						console.log('剩余牌数量： ' + player.pokerList.length);
						if (player.pokerList.length == 0) {
							let _msg = { f: room.roomNum + 'gameOver', msg: '游戏结束' };
							broadcast(_msg);
							return;
						}

						let _msg = { f: 'playSuccess', msg: 'ok' };
						this.send(stringifyJson(_msg));

						// 通知下一家跟牌
						let command = CmdType.follow;
						let playType = PlayType.follow;
						notifyNextPlayer(pc, player, room, pokerList, command, playType);
					} else {//通知下一家跟牌或重新出牌
						let _msg = { f: 'playSuccess', msg: 'ok' };
						this.send(stringifyJson(_msg));

						//判断上一家是否也是过牌，是则通知下一家重新出牌
						let preIndex = (player.index + 2) % 3;// +2除以3求余就是上一家的index
						let prePlayer = room.playerList[preIndex];
						let command;
						console.log('preplayer is pass ' + prePlayer.isPass);
						if (prePlayer.isPass)
							command = CmdType.lead;
						else
							command = CmdType.follow;

						let playType = PlayType.pass;

						notifyNextPlayer(pc, player, room, null, command, playType);
					}
				}
			}
		}
	}
};

function notifyNextPlayer(pc, player, room, pokerList, command, playType) {
	// 通知下一家出牌
	let nextIndex = (player.index + 1) % 3;

	let nextPlayer = room.playerList[nextIndex];

	pc.currentPlayingIndex = nextIndex;
	pc.lastPokers = pokerList;
	pc.isFirstPoker = CmdType.lead == command;

	let playMsg = {};
	playMsg.pokerList = pokerList;
	playMsg.command = command;
	playMsg.playType = playType;

	let _msg = { f: nextPlayer.name + 'play', msg: playMsg };
	broadcast(_msg);

	// 通知每个玩家 每个玩家的状态
	let roomMsg = {};
	for (let i = 0; i < room.playerList.length; i++) {
		let p = room.playerList[i];
		roomMsg[i] = p.pokerList.length;
	}
	roomMsg.currPlay = {
		index: player.index,
		pokerList: pokerList,
		playType: playType
	}
	_msg = { f: room.roomNum + 'play', msg: roomMsg };
	broadcast(_msg);
};

// 通知玩家的指令
let CmdType = {
	lead: 'lead',   	//领导出牌
	follow: 'follow'	//跟牌
};

let PlayType = {
	follow: 'follow',	//管上
	pass: 'pass'		//过
};

function Command(cmdType) {
	this.cmdType = cmdType;
};

//发牌
function dealingCard(room) {
	let pc = new PlayController(room);
	roomControllerMap[room.roomNum] = pc;

	//开始抢地主序号
	let dizhuIndex = Math.round(Math.random() * 10) % 3;

	//发牌
	let pokerMap = pm.genAllPokers();// 产生54张牌并洗好牌
	let playerList = room.playerList;
	pc.dizhuPokers = pokerMap[3];
	for (let i = 0; i < playerList.length; i++) {
		let msgBean = {};
		let pokerList = pokerMap[i];
		let player = playerList[i];
		let dizhuPokers = null;

		// 保存牌到玩家对象中
		player.pokerList = pokerList.slice();
		player.resetNoGrab();

		if (i == dizhuIndex) {
			msgBean.qiangDizhu = true;
		}

		msgBean.pokerList = pokerList;

		//发送给三个玩家牌
		console.log('dealing cards to ' + player.name);
		let _msg = { f: player.name + 'dealingCards', msg: msgBean };
		broadcast(_msg);
	}

	// 通知每个玩家 每个玩家的状态
	let roomMsg = {};
	for (let i = 0; i < room.playerList.length; i++) {
		let p = room.playerList[i];
		roomMsg[i] = p.pokerList.length;
	}

	let _msg = { f: room.roomNum + 'play', msg: roomMsg };
	broadcast(_msg);

	room.resetReadyCount();
}

//通知出牌
function notifyPlayerPlay(room, pc) {
	let playerList = room.playerList;
	for (let i in playerList) {
		let qiangBean = {};
		qiangBean.dizhuPokers = pc.dizhuPokers;
		if (pc.lastGrabIndex == i) {
			qiangBean.isDizhu = true;
			qiangBean.command = new Command(CmdType.lead);
			pc.currentPlayingIndex = i;
			pc.isFirstPoker = true;

			for (let j in pc.dizhuPokers) {
				if (pc.dizhuPokers[j])
					playerList[i].pokerList.push(pc.dizhuPokers[j]);
			}
			// console.log(JSON.stringify(playerList[i].pokerList));
		}

		let _msg = { f: playerList[i].name + 'qiangEnd', msg: qiangBean };
		broadcast(_msg);

		// 通知每个玩家 每个玩家的状态
		let roomMsg = {};
		for (let b = 0; b < room.playerList.length; b++) {
			let p = room.playerList[b];
			roomMsg[b] = p.pokerList.length;
		}

		_msg = { f: room.roomNum + 'play', msg: roomMsg };
		broadcast(_msg);
	}
}

function arrayPokerDifference(a, b) { // 差集 a - b
	let map = {};
	for (let i = 0; i < b.length; i++) {
		let poker = b[i];
		map[poker.name] = poker;
	}
	let flag = true;
	while (flag) {
		let index = -1;
		for (let i = 0; i < a.length; i++) {
			let poker = a[i];
			if (map[poker.name]) {
				index = i;
				flag = true;
				break;
			}
		}

		if (index == -1)
			flag = false;
		else
			a.splice(index, 1);
	}
}




//字符串转json
function parseJson(s) {
	try {
		return JSON.parse(s);
	} catch (e) { }
};

//json转字符串
function stringifyJson(j) {
	try {
		return JSON.stringify(j);
	} catch (e) { }
};

//检测变量是否存在
function checkExist(obj) {
	return typeof obj != 'undefined';
};
