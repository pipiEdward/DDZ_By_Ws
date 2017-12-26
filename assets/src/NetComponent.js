//网络组件
let NetworkComponent = cc.Class({
    extends: cc.Component,

    properties: {
    },
    onLoad () {
        NetTarget.on('net', this.getNetData,this);
        NetTarget.on('netstart', this.netStart,this);
        NetTarget.on('netclose', this.netClose,this);
    },
    onDestroy () {
        cc.log('destroy');
        NetTarget.off('net', this.getNetData,this);
        NetTarget.off('netstart', this.netStart,this);
        NetTarget.off('netclose', this.netClose,this);
    },
    /**
     * 获取服务端数据
     */
    getNetData (event) {
        let data = event.detail;
        let str = "接受数据：" + JSON.stringify(data);
        cc.log(str);
    },
    /**
     * 网络连接开始
     */
    netStart (event) {
        cc.log("net start");
    },
    /**
     * 网络断开
     */
    netClose (event) {
        cc.log("net close");
    },
});
