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

function Player(name, index){
	this.name = name;
	this.index = index;
	this.isPass = false;
	this.pokerList = new Array();
	this.noGrab = null; //不抢地主
	this.resetNoGrab = function(){
		this.noGrab = null;
	}
};

function Room(roomNum){
	this.roomNum = roomNum;//房号
	this.playerList = new Array();//玩家列表
	this.readyCount = 0;
	this.join = function(playerName){
		let player = new Player(playerName, this.playerList.length);
		playerMap[playerName] = player;

		this.playerList.push(player);
		playerRoomMap[playerName] = this;
	};
	this.leave = function(player){
		this.playerList.splice(player.index, 1);
	};

	roomMap[this.roomNum] = this;

	this.addReadyCount = function(){
		this.readyCount++;
	};
	this.resetReadyCount = function(){
		this.readyCount = 0;
	};
};

function PlayController(room){
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

	this.lastGrabIndex=-1;	//最后抢地主的序号
	this.passCount=0;	//不抢的次数
	this.remainCount=4;	//剩余抢地主次数
	this.resetGrab = function(){
		this.lastGrabIndex=-1;
		this.passCount=0;	//不抢的次数
		this.remainCount=4;	//剩余抢地主次数
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

exports.start = ()=>{
	console.log('ws start');
	wss = new webSocketServer({port:3000});
	wss.on('connection',(ws)=>{
		console.log('client connected');
		hook(ws,
				onOpen.bind(ws),
				onMessage.bind(ws),
				onClose.bind(ws),
				onError.bind(ws));
	});
};

function onOpen(event){
	console.log('open');
	
	//登陆返回clientId
	let clientId = Date.parse(new Date())/1000;
	this.send('hello', clientId);

};

function onMessage(event){
	let self = this;
	let msg = parseJson(event);
	console.log(msg);
	if(msg&&msg.f){
		let m = msg.msg||{};
		switch(msg.f){
			case 'createRoom':
				onCreateRoom.call(self,m);
				break;
			case 'roomList':
				onRoomList.call(self,m);
				break;
			case 'joinRoom':
				onJoinRoom.call(self,m);
				break;
			default:
				break;
		}
	}else{
		console.log('bad package');
	}
};

function onClose(event){
	console.log('onClose');
	let room = playerRoomMap[currentName];
	let player = playerMap[currentName];
	console.log('---' + room);
	if(room && player){
		room.leave(player);
		let roomNum = room.roomNum;
	}
};

function onError(event){
	console.log('onError');
};

//创建房间
function onCreateRoom(msg){
	let playerName = msg;
	currentName = playerName;
	// console.log(clientId + 'creating room .');
	let roomNum = roomArray.length + 1;
	let room = new Room(roomNum);

	roomArray.push(room);

	room.join(playerName);
	console.log('playerRoomMap:' + JSON.stringify(playerRoomMap[playerName]));
	// console.log('room num is ' + JSON.stringify(room));
	let _msg = {f:'createRoom',msg:room};
	this.send(stringifyJson(_msg));
	
	this.send();
};

//房间列表
function onRoomList(msg){
	let _msg = {f:'roomList',msg:stringifyJson(roomArray)};
	this.send(stringifyJson(_msg));
};

// 加入房间 msg=playerName,roomNum
function onJoinRoom(msg){
	console.log('join room:' + msg)
	let arr = msg.split(',');
	let playerName = arr[0];
	let roomNum = arr[1];

	currentName = playerName;

	let room = roomMap[roomNum];
	if(room){
		room.join(playerName);
		// 发送加入房间的消息，全局
		console.log('nitify joinRoom');
		let _msg = {f:'joinRoom',msg:room.playerList.length-1};
		this.send(stringifyJson(_msg));
		socket.emit('joinRoom', room.playerList.length-1);
		io.emit(roomNum+'joinRoom', JSON.stringify(room));

		//如果够三个人，就开始
		if(room.playerList.length == 3){
			io.emit(roomNum+'gameStart', JSON.stringify(room));
		}
	}
};


//登录
// function onLogin(msg){
	// console.log('onLogin');
	// if(msg.msg){
		// let _msg = {f:'login',msg:'user '+msg.msg+' login success'};
		// this.send(stringifyJson(_msg));
	// }

// }

//字符串转json
function parseJson(s){
	try{
		return JSON.parse(s);
	}catch(e){}
};

//json转字符串
function stringifyJson(j){
	try{
		return JSON.stringify(j);
	}catch(e){}
};

//检测变量是否存在
function checkExist(obj){
	return typeof obj!= 'undefined';
};