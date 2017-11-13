const POSITION_UP = 1;
const POSITION_DOWN = 2;
cc.Class({
    extends: cc.Component,

    properties: {
        pokerPrefab: cc.Prefab,
        backPrefab: cc.Prefab,

        _pokerSpriteList: null,
        _touchStart: null,
        _touchMove: null,
    },

    // use this for initialization
    onLoad() {
        console.log('mynode on load.');
        this.node.on('touchstart', this.startCallback, this);
        this.node.on('touchend', this.endCallback, this);
        this.node.on('touchmove', this.moveCallback, this);
    },

    onDestroy() {
        this.node.off(cc.Node.EventType.TOUCH_START, this.startCallback, this);
        this.node.off(cc.Node.EventType.TOUCH_END, this.endCallback, this);
        this.node.off(cc.Node.EventType.TOUCH_MOVE, this.moveCallback, this);
    },

    /**显示牌 */
    displayPokers(pokerList, pokerSpriteFrameMap) {
        this.node.removeAllChildren();
        this._pokerSpriteList = [];
        // console.log(JSON.stringify(pokerSpriteFrameMap));

        for (let i in pokerList) {
            let poker = pokerList[i]
            let pokerName = poker.name;
            // console.log(pokerName);

            let pokerSprite = cc.instantiate(this.pokerPrefab);
            // let pokerSpriteStript = pokerSprite.getComponent('pokerPrefab');
            // pokerSpriteStript.sprite.spriteFrame = pokerSpriteFrameMap[pokerName];
            pokerSprite.$$(cc.Sprite, pokerSpriteFrameMap[pokerName]);
            pokerSprite.status = POSITION_DOWN;
            pokerSprite.poker = poker;

            let gap = 30;//牌间隙

            this.node.addChild(pokerSprite);
            // let x = 100*gap + i*gap;
            // pokerSprite.setPosition(x, 0);
            pokerSprite.setPosition(150 + i * gap, 100);
            this._pokerSpriteList.push(pokerSprite);
            Global.allPokers = pokerList;
        }
    },

    //倒牌
    pokerAllDown() {
        for (let i in this._pokerSpriteList) {
            let pokerSprite = this._pokerSpriteList[i];
            if (pokerSprite.status === POSITION_UP)
                pokerSprite.y -= 20;

            pokerSprite.status = POSITION_DOWN;
            pokerSprite.isChiose = false;
            pokerSprite.opacity = 255;

            Global.selectPokers = [];
        }
    },

    //点击到牌
    _getCardForTouch(touch) {
        for (let i = this._pokerSpriteList.length - 1; i >= 0; i--) {// 需要倒序
            let pokerSprite = this._pokerSpriteList[i];
            let box = pokerSprite.getBoundingBox();
            if (cc.rectContainsPoint(box, touch)) {
                // console.log('in');
                pokerSprite.isChiose = true;
                pokerSprite.opacity = 185;
                return;//关键， 找到一个就返回
            }
        }
    },

    //检测牌复原
    _checkSelectCardReserve(touchBegan, touchMoved) {
        // console.log('_checkSelectCardReserve');
        let p1 = touchBegan.x < touchMoved.x ? touchBegan : touchMoved;

        if (p1 === touchMoved) {
            // for (let i = this._pokerSpriteList.length - 1; i >= 0; i--) {
            for (let i in this._pokerSpriteList) {
                let sprite = this._pokerSpriteList[i];
                if (p1.x - sprite.x > -25) {  //
                    sprite.opacity = 255;
                    sprite.isChiose = false;
                }
            }
        }
        else {
            let width = Math.abs(touchBegan.x - touchMoved.x);
            let height = Math.abs(touchBegan.y - touchMoved.y) > 5 ? Math.abs(touchBegan.y - touchMoved.y) : 5;
            let rect = cc.rect(p1.x, p1.y, width, height);

            for (let i = 0; i < this._pokerSpriteList.length; i++) {
                if (!cc.rectIntersectsRect(this._pokerSpriteList[i].getBoundingBox(), rect)) {
                    this._pokerSpriteList[i].isChiose = false;
                    this._pokerSpriteList[i].opacity = 255;
                }
            }
        }

    },

    startCallback(event) {
        let touches = event.getTouches();
        let touchLoc = touches[0].getLocation();
        // console.log(touchLoc.x + "," + touchLoc.y)
        this._touchStart = this.node.convertToNodeSpace(touchLoc);//将坐标转换为当前节点坐标
        // console.log(this._touchStart.x + "," + this._touchStart.y)
        this._getCardForTouch(this._touchStart);
    },


    moveCallback(event) {
        let touches = event.getTouches();
        let touchLoc = touches[0].getLocation();
        this._touchMove = this.node.convertToNodeSpace(touchLoc);//将坐标转换为当前节点坐标
        this._getCardForTouch(this._touchMove);
        //当选过头了，往回拖的时候取消选择
        this._checkSelectCardReserve(this._touchStart, this._touchMove);
    },


    endCallback(event) {
        for (let i = 0; i < this._pokerSpriteList.length; i++) {
            let pokerSprite = this._pokerSpriteList[i];

            if (pokerSprite.isChiose) {
                pokerSprite.isChiose = false;
                pokerSprite.opacity = 255;
                if (pokerSprite.status === POSITION_UP) {
                    pokerSprite.status = POSITION_DOWN;
                    pokerSprite.y -= 20;

                    //移除所选牌
                    let index = -1;
                    for (let k in Global.selectPokers) {
                        let selectPoker = Global.selectPokers[k];
                        if (selectPoker.name == pokerSprite.poker.name)
                            index = k;
                    }
                    if (index != -1)
                        Global.selectPokers.splice(index, 1);
                }
                else {
                    pokerSprite.status = POSITION_UP;
                    pokerSprite.y += 20;

                    //添加选择的牌
                    Global.selectPokers.push(pokerSprite.poker);
                }
            }
        }
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
