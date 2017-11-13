import { fail } from 'assert';

cc.Class({
    extends: require('NetComponent'),

    properties: {
        poker: cc.Prefab,    //扑克
        myNode: cc.Node,
        displayNode: cc.Node,
        playButton: cc.Button,
        passButton: cc.Button,
        readyButton: cc.Button,
        buqiangButton: cc.Button,
        qiangButton: cc.Button,
        dizhuNode: cc.Node,
        leftHandPokerNode: cc.Node,
        leftDisplayNode: cc.Node,
        rightHandPokerNode: cc.Node,
        rightDisplayNode: cc.Node,
        backPrefab: cc.Prefab,

        backPrefabPool: {        //卡片对象池
            default: null,
            visible: false,
        },
        clickTimeArray: {
            default: [],
            visible: false,
        },
        pokerSpriteFrameMap: {
            default: {},
            visible: false,
        }
    },

    // use this for initialization
    onLoad() {
        this._super();
        this.backPrefab = new cc.NodePool();

        this.node.on('touchstart', this.nodeDoubleClickCallBack, this);

        this.loadRes();
    },

    onDestroy() {
        this.node.off('touchstart',this.nodeDoubleClickCallBack,this);

        //释放资源
    },

    //加载卡片资源
    loadRes() {
        let self = this;
        cc.loader.loadRes('poker', cc.SpriteAtlas, function (err, assets) {
            console.log('====' + assets);

            let sflist = assets.getSpriteFrames();
            for (let i = 0; i < sflist.length; i++) {
                let sf = sflist[i];
                this.pokerSpriteFrameMap[sf._name] = sf;
            }

            self.init();
        });
    },

    init() {
        let pokerPrefab = this.poker;
        let myNode = this.myNode;
        let displayNode = this.displayNode;
        let playButton = this.playButton;
        let passButton = this.passButton;
        let readyButton = this.readyButton;
    },

    //接受数据
    getNetData(event) {
        this._super(event);
        let data = event.detail;
        if (data && data.f) {
            let msg = data.msg || {};
            switch (data.f) {
                case Global.playerName + 'dealingCards':
                    this.onDealingCards(msg);
                    break;
                case Global.playerName + 'qiangEnd':
                    this.onQiangEnd(msg);
                    break;
                case Global.playerName + 'qiangdizhu':
                    this.onQiangDizhu(msg);
                    break;
                case 'playError':
                    this.onPlayErr(msg);
                    break;
                case 'playSuccess':
                    this.onPlaySuccess(msg);
                    break;
                case Global.roomNum + 'gameOver':
                    this.onGameOver(msg);
                    break;
                case Global.playerName + 'play':
                    this.onPlayCard(msg);
                    break;
                case Global.roomNum + 'play':
                    this.onRoomPlayer(msg);
                    break;
                default:
                    cc.log('can not find func');
                    break;
            }
        }
    },

    //出牌
    playBCallBack(event) {
        if (Global.selectPokers.length == 0) {
            alert('请选择要出的牌');
        }
        else {
            let msg = {
                pokerList: Global.selectPokers,
                playerName: Global.playerName,
                isPass: false,
            };
            Global.isPass = msg.isPass;
            Network.send({ f: 'play', msg: JSON.stringify(msg) });
        }
    },

    //不出
    passCallBack(event) {
        let msg = {
            playerName: Global.playerName,
            isPass: true,
        };
        // msg.pokerList = Global.selectPokers;

        Global.isPass = msg.isPass;
        this.readyButton.node.active = false;
        Network.send({ f: 'play', msg: JSON.stringify(msg) });
    },

    //准备
    readyCallBack(event) {
        // 发送准备好的消息
        Network.send({ f: 'ready', msg: Global.playerName + ',' + Global.roomNum })

        this.readyButton.node.active = false;
        this.leftDisplayNode.removeAllChildren();
        this.rightDisplayNode.removeAllChildren();
    },

    //不抢
    buqiangCallBack(event) {
        let msgBean = {
            playerName: Global.playerName,
            roomNum: Global.roomNum,
            qiangdizhu: false
        };
        Network.send({ f: 'qiangdizhu', msg: JSON.stringify(msg) });
        this.buqiangButton.node.active = false;
        this.qiangButton.node.active = false;
    },

    //抢地主
    qiangCallBack(event) {
        let msgBean = {
            roomNum: Global.roomNum,
            qiangdizhu: true
        };
        Network.send({ f: 'qiangdizhu', msg: JSON.stringify(msg) });
        this.buqiangButton.node.active = false;
        this.qiangButton.node.active = false;
    },

    //双击把所选牌归位 
    nodeDoubleClickCallBack(event) {
        let currentTime = new Date().valueOf();
        // console.log(currentTime);

        let preClickTime = this.clickTimeArray.pop();
        if (preClickTime) {//不为空，则对比时间差
            // console.log('time : ', currentTime - preClickTime);
            if (currentTime - preClickTime < 200) {
                // console.log('double click');
                this.myNode.$('MyNodeScript').pokerAllDown();
            }
            else
                this.clickTimeArray.push(currentTime);
        }
        else//为空则入栈
            this.clickTimeArray.push(currentTime);
    },

    onDealingCards(msg) {
        let msgBean = msg;
        let pokerList = msgBean.pokerList;
        Global.allPokers = pokerList;

        pokerList.sort(function (a, b) {//排序
            return b.sortValue - a.sortValue;
        });

        // 显示抢地主按钮
        if (msgBean.qiangDizhu) {
            this.buqiangButton.node.active = true;
            this.qiangButton.node.active = true;
        }

        let myNodeScript = myNode.$('MyNodeScript');
        myNodeScript.displayPokers(pokerList, this.pokerSpriteFrameMap);
    },

    //抢地主结束回调
    onQiangEnd(msg) {
        let msgBean = msg;
        //显示地主牌
        this.displayPokers(msgBean.dizhuPokers, this.dizhuNode, this.poker, this.pokerSpriteFrameMap);

        //显示出牌按钮
        if (msgBean.command) {
            console.log(JSON.stringify(msgBean.command));
            this.playButton.node.active = true;
        }

        //将地主牌加入到玩家牌
        if (msgBean.isDizhu) {
            for (let i in msgBean.dizhuPokers) {
                Global.allPokers.push(msgBean.dizhuPokers[i]);
                Global.allPokers.sort(function (a, b) {
                    return b.sortValue - a.sortValue;
                });
                let myNodeScript = myNode.$('MyNodeScript');
                myNodeScript.displayPokers(Global.allPokers, pokerSpriteFrameMap);
            }
        }
    },

    //监听抢地主
    onQiangDizhu(msg) {
        //显示抢地主按钮
        this.buqiangButton.node.active = true;
        this.qiangButton.node.active = true;
    },

    //出牌不成功
    onPlayErr(msg) {
        alert(msg);
    },

    //出牌成功
    onPlaySuccess(msg) {
        //移除选择的牌，隐藏出牌按钮， 重新渲染牌列表
        this.playButton.node.active = false;
        this.passButton.node.active = false;

        if (!Global.isPass)//点pass的时候不用移除
            this.removePokers(Global.allPokers, Global.selectPokers);

        Global.selectPokers = [];

        let myNodeScript = myNode.$('MyNodeScript');
        myNodeScript.displayPokers(Global.allPokers, this.pokerSpriteFrameMap);
    },

    //游戏结束
    onGameOver(msg) {
        this.playButton.node.active = false;
        this.passButton.node.active = false;
        this.readyButton.node.active = true;

        //清掉牌
        Global.allPokers = [];
        Global.selectPokers = [];
    },

    //监听出牌
    onPlayCard(msg) {
        let msgBean = msg;
        let command = msgBean.command;
        let playType = msgBean.playType;
        let pokerList = msgBean.pokerList;
        this.displayNode.removeAllChildren();

        if ('lead' == command) {//出牌
            this.playButton.node.active = true;
            this.passButton.node.active = false;
        } else {//跟牌
            this.playButton.node.active = true;
            this.passButton.node.active = true;
        }
    },

    //监听玩家状态
    onRoomPlayer() {
        let msgBean = msg;
        let myIndex = Global.roomIndex;
        let leftIndex = (myIndex + 2) % 3;
        let rightIndex = (myIndex + 1) % 3;

        let leftNum = msgBean[leftIndex];
        let rightNum = msgBean[rightIndex];

        this.updateLeftAndRightPokerNum(leftNum, rightNum);
        this.updateOutPokers(msgBean.currPlay, this.pokerPrefab, this.pokerSpriteFrameMap);
    },

    // 显示牌
    displayPokers(pokerList, pnode, pokerPrefab, pokerSpriteFrameMap) {
        pnode.removeAllChildren();

        let startx = pokerList.length / 2;//开始x坐标
        for (let i = 0; i < pokerList.length; i++) {
            let poker = pokerList[i]
            let pokerName = poker.name;
            // console.log(pokerName);

            let pokerSprite = cc.instantiate(pokerPrefab);
            pokerSprite.getComponent(cc.Sprite).spriteFrame = pokerSpriteFrameMap[pokerName];

            let gap = 18;//牌间隙
            pokerSprite.scale = 0.8;

            pnode.addChild(pokerSprite);
            let x = (-startx) * gap + i * gap;
            // console.log(x);
            pokerSprite.setPosition(x, 0);
        }
    },

    removePokers(a, b) { // 差集 a - b
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
    },

    //刷新其他玩家牌
    updateLeftAndRightPokerNum(leftNum, rightNum) {
        this.displayBackPokers(this.leftHandPokerNode, leftNum);
        this.displayBackPokers(this.rightHandPokerNode, rightNum);
    },

    //显示牌的背面
    displayBackPokers(handPokerNode, num) {
        let backPrefabs = handPokerNode.getComponents(cc.Prefab);
        if (backPrefabs) {
            for (let i = 0; i < backPrefabs.length; i++)
                this.backPrefabPool.put(backPrefabs[i]);
        }
        //移除
        handPokerNode.removeAllChildren();

        for (let i = 0; i < num; i++) {
            let back = null;
            if (this.backPrefabPool.size() > 0) {
                back = this.backPrefabPool.get();
            }
            else {
                back = cc.instantiate(this.backPrefab);
            }

            handPokerNode.addChild(back);
            back.setPosition(0, i * (-10));

            if (i == num - 1) {
                this.addLabel(handPokerNode, num, (i + 1) * (-11) - back.height / 2);
            }
        }
    },

    //刷新自家牌
    updateOutPokers(roomPlay, pokerPrefab, pokerSpriteFrameMap) {
        if (!roomPlay)
            return;

        let myIndex = Global.roomIndex;
        let leftIndex = (myIndex + 2) % 3;
        let rightIndex = (myIndex + 1) % 3;

        let pokerList = roomPlay.pokerList;
        let playType = roomPlay.playType;
        //更新当前玩家出牌
        let updateNode = null;
        if (roomPlay.index == myIndex) {
            updateNode = this.displayNode;
            console.log('my display');
        }
        else if (leftIndex == roomPlay.index) {
            updateNode = this.leftDisplayNode;
            console.log('left display');
        }
        else {
            updateNode = this.rightDisplayNode;
            console.log('right display');
        }


        if ('pass' == playType) {
            updateNode.removeAllChildren();
            this.addLabel(updateNode);
        }
        else {
            this.displayPokers(pokerList, updateNode, pokerPrefab, pokerSpriteFrameMap);
        }
    },

    addLabel: function (displayNode, string, y) {
        let labelNode = new cc.Node('msg label');
        let label = labelNode.addComponent(cc.Label);
        label.string = '不出!';
        if (string)
            label.string = string;
        if (y)
            labelNode.y = y;

        displayNode.addChild(labelNode)
    },



    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
