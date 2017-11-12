cc.Class({
    extends: require('NetComponent'),

    properties: {
        layout: cc.Node,
        roomPrefab: cc.Prefab,
    },

    // use this for initialization
    onLoad() {
        let roomPre = this.roomPrefab;
        let layout = this.layout;

        //发送消息
        Network.send({ f: 'roomList', msg: Global.playerName });

    },

    //接受数据
    getNetData(event) {
        this._super(event);
        let data = event.detail;
        if (data && data.f) {
            let msg = data.msg || {};
            switch (data.f) {
                case 'roomList':
                    this.roomCallback(data.msg);
                    break;
                default:
                    cc.log('can not find func');
                    break;
            }
        }
    },

    roomCallback(msg) {
        console.log(msg);
        let roomList = eval('(' + msg + ')');

        for (let i = 0; i < roomList.length; i++) {
            let room = roomList[i];
            let roomNum = room.roomNum;
            let playerNameListStr = '';

            let playerList = room.playerList;
            for (let j = 0; j < playerList.length; j++) {
                playerNameListStr += playerList[j].name + ',';
            }

            let roomPrefabScipt = cc.instantiate(roomPrefab).$('RoomPrefab');
            let labelStr = '房间: ' + roomNum + '(' + playerNameListStr + ')';
            roomPrefabScript.label.string = labelStr;
            roomPrefabScipt.roomNum = roomNum;
            roomPrefabScipt.enableButton(playerList.length < 3);

            layout.addChild(roomPrefabScipt.node);
        }
    }


    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
