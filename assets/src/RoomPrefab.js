cc.Class({
    extends: cc.Component,

    properties: {
        label: cc.Label,
        button: cc.Button,
        roomNum: 0,
    },

    // use this for initialization
    onLoad() {

    },

    joinCallback(event) {
        Global.roomNum = this.roomNum;
        Global.roomWaitType = 'join';
        cc.director.loadScene('RoomWait');
    },

    enableButton(flag) {
        this.button.enabled = flag;
    }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
