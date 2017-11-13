cc.Class({
    extends: require('NetComponent'),

    properties: {
        editbox: cc.EditBox,

    },

    // use this for initialization
    onLoad() {
        this._super();
        //连接服务器
        Network.initNetwork();
    },


    //创建房间
    createCallback(event) {
        let playerName = this.editbox.string;
        // alert(playerName);
        if (playerName == '') {
            alert('请输入昵称');
        } else {
            Global.playerName = playerName;
            // 跳转房间等候场景
            Global.roomWaitType = 'create';
            cc.director.loadScene('roomwait');
        }
    },

    //加入房间
    joinCallback(event) {
        let playerName = this.playerNameBox.string;
        // alert(playerName);
        if (playerName == '') {
            alert('请输入昵称');
        }
        else {
            Global.playerName = playerName;
            // 跳转房间等候场景
            cc.director.loadScene('roomlist');
        }
    },

    getNetData(event) {
        let data = event.detail;
    },

    netStart (event) {
        this._super();
        //登录
    },


    // called every frame, uncomment this function to activate update callback
    // update  (dt) {

    // },
});
