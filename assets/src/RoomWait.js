cc.Class({
    extends: require('NetComponent'),

    properties: {
        roomNumLabel: cc.Label,
        playerListLabel: cc.Label,
    },

    // use this for initialization
    onLoad() {
        this._super();
        if (Global.roomWaitType == 'create') {
            Network.send({ f: 'createRoom', msg: Global.playerName });
        }
        if (Global.roomWaitType == 'join') {

            Network.send({ f: 'joinRoom', msg: Global.playerName + ',' + Global.roomNum });
        }

    },

    //接受数据
    getNetData(event) {
        this._super(event);
        let data = event.detail;
        if (data && data.f) {
            let msg = data.msg || {};
            switch (data.f) {
                case 'createRoom':
                    this.onCreateRoom(msg);
                    break;
                case Global.roomNum + 'joinRoom':
                    this.onRoomNumJoin(msg);
                    break;
                case 'joinRoom':
                    this.onJoin(msg);
                    break;
                case Global.roomNum+'gameStart':
                    this.onGameStart(msg);
                    break;
                default:
                    cc.log('can not find func');
                    break;
            }
        }
    },

    //创建房间成功
    onCreateRoom(msg) {
        let room = msg;
        this.doCreat(room);
        Global.roomNum = room.roomNum;
        Global.roomIndex = 0;//创建者的位置序号为0（第一个）
    },

    onRoomNumJoin(msg) {
        let room = msg;
        this.doCreat(room);
    },

    //当前玩家的桌位序号
    onJoin(msg) {
        Global.roomIndex = Number(msg);
    },

    doCreat(room) {
        this.roomNumLabel.string = room.roomNum;
        let labelStr = room.playerList.length + '个人(';
        for (let i = 0; i < room.playerList.length; i++) {
            let name = room.playerList[i].name;
            labelStr += name;
            if (i != room.playerList.length - 1) {
                labelStr += ',';
            }
        }
        labelStr += ')';

        this.playerListLabel.string = labelStr;
    },

    onGameStart(msg){
         cc.director.loadScene('playing');
    },








    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
