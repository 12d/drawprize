(function () {
    var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
        window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

    window.requestAnimationFrame = requestAnimationFrame;
    var Marquee = new Class({
        Implements:[Options, Events],
        options:{
            wrap:null,
            fps:25,
            frameSize:1
        },
        initialize:function (options) {
            var self = this;

            self.setOptions(options);
            self.wrap = self.options.wrap;

//            self.
        },
        _animate:function () {
            var wrap = this.wrap;
//            wrap
        },
        pause:function () {

        },
        play:function () {

        },
        stop:function () {

        }
    });
    window.Marquee = Marquee;
    //or initialize with another way;
})();
/*
 config 属性说明
 name: {String} 设置iframe的id
 className: {String}  设置iframe的class
 display: {Boolean} iframe的默认是否显示
 zIndex: {Number} 设置z-index
 margin: {Number} 设置iframe的margin
 offset: {Object} 设置iframe的x，y偏移量
 browsers: {String} 设置哪些浏览器需要iframeShim
 onInject: {Function}设置inject事件的处理函数
 */
var IframeShim = new Class({
    Implements:[Options, Events],
    options:{
        name:'',
        className:'iframeShim',
        display:false,
        zIndex:null,
        margin:0,
        offset:{
            x:0,
            y:0
        },
        browsers:(Browser.Engine.trident4 || (Browser.Engine.gecko && !Browser.Engine.gecko19 && Browser.Platform.mac)),
        onInject:$empty
    },
    initialize:function (element, options) {
        this.setOptions(options);
        //legacy
        if (this.options.offset && this.options.offset.top) this.options.offset.y = this.options.offset.top;
        if (this.options.offset && this.options.offset.left) this.options.offset.x = this.options.offset.left;
        this.element = $(element);
        this.makeShim();
        return;
    },
    makeShim:function () {
        this.shim = new Element('iframe');
        this.id = this.options.name || new Date().getTime() + "_shim";
        if (this.element.getStyle('z-Index').toInt() < 1 || isNaN(this.element.getStyle('z-Index').toInt()))
            this.element.setStyle('z-Index', 999);
        var z = this.element.getStyle('z-Index') - 1;

        if ($chk(this.options.zIndex) && this.element.getStyle('z-Index').toInt() > this.options.zIndex)
            z = this.options.zIndex;

        this.shim.setStyles({
            'position':'absolute',
            'zIndex':z,
            'border':'none',
            'filter':'progid:DXImageTransform.Microsoft.Alpha(style=0,opacity=0)'
        }).setProperties({
                'src':'javascript:void(0);',
                'frameborder':'0',
                'scrolling':'no',
                'id':this.id
            }).addClass(this.options.className);

        this.element.store('shim', this);

        var inject = function () {
            this.shim.inject(document.body);
            if (this.options.display) this.show();
            else this.hide();
            this.fireEvent('inject');
        };
        if (this.options.browsers) {
            if (Browser.Engine.trident && !IframeShim.ready) {
                window.addEvent('load', inject.bind(this));
            } else {
                inject.run(null, this);
            }
        }
    },
    position:function (obj) {
        if (!this.options.browsers || !IframeShim.ready) return this;
        if (obj) {
            this.shim.setStyles({
                width:obj.width,
                height:obj.height,
                top:obj.top,
                left:obj.left
            });
        }
        else {
            var before = this.element.getStyles('display', 'visibility', 'position');
            this.element.setStyles({
                display:'block',
                position:'absolute',
                visibility:'hidden'
            });
            var size = this.element.getSize();
            var pos = this.element.getPosition();
            this.element.setStyles(before);
            if ($type(this.options.margin)) {
                size.x = size.x - (this.options.margin * 2);
                size.y = size.y - (this.options.margin * 2);
                this.options.offset.x += this.options.margin;
                this.options.offset.y += this.options.margin;
            }

            this.shim.setStyles({
                width:size.x,
                height:size.y,
                top:pos.y,
                left:pos.x
            });
        }

        return this;
    },
    hide:function () {
        if (this.options.browsers) this.shim.setStyle('display', 'none');
        return this;
    },
    show:function (obj) {
        if (!this.options.browsers) return this;
        this.shim.setStyle('display', 'block');
        return this.position(obj);
    },
    dispose:function () {
        if (this.options.browsers) this.shim.dispose();
        return this;
    }
});
window.addEvent('load', function () {
    IframeShim.ready = true;
});

//overlay class
/*
 config 属性说明
 useFx: {Boolean} 设置显示overlay时，是否需要效果
 name: {String}  设置overlay的id
 duration: {Number}设置效果的帧频
 zIndex: {Number} 设置z-index
 colour: {String} 设置iframe的背景色
 opacity: {Number} 设置iframe的默认透明度
 hasShim: {Boolean} 是否使用iframeShim来遮蔽select等元素
 container: {Element}设置overlay的父元素
 onClick: {Function}设置click事件的处理函数
 */
var Overlay = new Class({
    Implements:[Options, Events],
    getOptions:function () {
        return {
            useFx:false,
            name:'',
            duration:200,
            colour:'#000',
            opacity:0.2,
            zIndex:1001,
            hasShim:true,
            container:document.body,
            onClick:$empty
        };
    },

    initialize:function (options) {
        this.setOptions(this.getOptions(), options);
        this.element = $(this.options.container);

        this.container = new Element('div').setProperty('id', this.options.name + '_overlay').setStyles({
            position:'absolute',
            left:'0',
            top:'0',
            width:'100%',
            height:'100%',
            backgroundColor:this.options.colour,
            zIndex:this.options.zIndex,
            opacity:this.options.opacity
        }).inject(document.body);


        if (this.options.hasShim) this.shim = new IframeShim(this.container);
        this.options.useFx ? this.fade = new Fx.Tween(this.container, { property:'opacity', duration:this.options.duration }).set(0) : this.fade = null;
        //this.container.setStyle('display', 'none');

        this.container.addEvent('click', function () {
            this.fireEvent('click');
        }.bind(this));

        window.addEvent('resize', this.position.bind(this));
        return this;
    },

    position:function (obj) {
        if (this.element == document.body) {
            var h = window.getScrollHeight() + 'px';
            this.container.setStyles({ top:'0px', height:h });
            return;
        }

        if (obj) {
            this.container.setStyles({
                width:obj.width,
                height:obj.height,
                top:obj.top,
                left:obj.left
            });
        } else {
            var myCoords = this.element.getCoordinates();
            this.container.setStyles({
                top:myCoords.top,
                height:myCoords.height,
                left:myCoords.left,
                width:myCoords.width
            });
        }
    },

    show:function (obj) {
        this.container.setStyle('display', '');
        if (this.fade) this.fade.cancel().start(this.options.opacity);
        if (this.shim) {
            this.shim.element = this.element;
            this.shim.show(obj);
        }
        return this.position(obj);
    },

    hide:function (dispose) {
        if (this.fade) this.fade.cancel().start(0);
        this.container.setStyle('display', 'none');
        if (this.shim) this.shim.hide();
        if (dispose) this.dispose();
        return this;
    },

    dispose:function () {
        this.container.dispose();
        if (this.shim) this.shim.dispose();
    }

});

var Mbox = new Class({
    Implements:[Options, Events],
    open:function () {
        console.log()
    },
    close:function () {

    },
    openLite:function () {

    }
});

;
(function (window) {
    //@const
    var EMPTY = "",
        NULL = null,
        NOOP = function () {
        },
        UNDEFINED = undefined,
        Ajax = Request,
        LOADED = 'loaded',
        LOGOUT = 'logout',
        PRIZE_LIST_READY = 'prizeListReady',
        PRIZE_OWNER_LIST_READY = 'prizeOwnerListReady',
        DRAW_START = 'drawStart',
        DRAW_END = 'drawEnd',
        DRAW_SUCCESS = 'drawSuccess',
        GAME_OVER = 'gameover',
        ERROR = 'error',
    /*@status code*/
        STATUS_SUCCESS = 200,
        STATUS_LOGOUT = 403,
        STATUS_PARAM_ERROR = 406,
        STATUS_GAME_OVER = 401,
        STATUS_SERVER_ERROR = 500,

        MSG_SERVER_ERROR = "网络错误，请重试",
        MSG_GAME_FINISH = '活动结束了！',

        FLASH_FUNC = {
            startDraw:"startDraw"
        },
        PREFIX = "LUCKY",

    //@absolutly private
        Swf = Swiff,
        uid = 0;

    var Lucky = new Class({
        Implements:[Options, Events],
        initialize:function (options) {
            var self = this,
                opts;

            self.setOptions(options);
            opts = self.options;
            self._uid = uid++;
            self.title = opts.title;
            //set events
            self.onLoaded = opts.onLoaded;
            self.onDrawSuccess = opts.onDrawSuccess;
            self.onError = opts.onError;
            self.onDrawEnd = opts.onDrawEnd;
            self.onDrawStart = opts.onDrawStart;
            self.onLogout = opts.onLogout;
            self.onGameover = opts.onGameover;
            self.onPrizeListReady = opts.onPrizeListReady;
            self.onPrizeOwnerListReady = opts.onPrizeOwnerListReady;

            self.swf = new Swf(opts.swfUrl, {
                id:PREFIX + uid,
                container:opts.wrap,
                width:opts.width,
                height:opts.height,
                params:{
                    wMode:'transparent'
                },
                vars:{
                    ratios:opts.ratios.join(opts.ratiosSeparator),
                    stageHeight:opts.height,
                    stageWidth:opts.width,
                    cursorUrl:opts.cursorUrl,
                    panelUrl:opts.panelUrl,
                    buttonUrl:opts.buttonUrl,
                    debugOn:opts.debugOn,
                    ratiosSeparator:opts.ratiosSeparator,
                    isCursorMove:opts.isCursorMove,
                    ajust:opts.ajust
                },
                callBacks:{
                    loaded:function () {
                        self.fireEvent(LOADED);
                    },

                    /**
                     * start draw
                     * @param {String} fn , as3 callback function
                     */
                    drawStart:function (fn) {
                        self.fireEvent(DRAW_START);
                        self.draw(fn);
                    },
                    drawEnd:function () {
                        self.fireEvent(DRAW_END, self.currentResult);
                    }
                }
            });

        },
        options:{
            title:'大转盘抽奖',
            prizeListUrl:UNDEFINED,
            drawUrl:UNDEFINED,
            swfUrl:UNDEFINED,
            cursorUrl:UNDEFINED,
            panelUrl:UNDEFINED,
            debugOn:false,
            wrap:NULL,
            height:0,
            width:0,
            ajust:0,
            ratios:NULL,
            ratiosSeparator:"+",
            isCursorMove:false,
            minRound:2,
            maxRound:10,
            groupId:NULL,
            onLoaded:NOOP,
            onDrawSuccess:NOOP,
            onDrawStart:NOOP,
            onDrawEnd:NOOP,
            onLogout:NOOP,
            onGameover:NOOP,
            onError:NOOP,
            onPrizeListReady:NOOP,
            onPrizeOwnerListReady:NOOP,
        },
        swf:NULL,
        prizeList:NULL,
        prizeGroup:NULL,
        /**
         * get prize list from server
         */
        getPrizeList:function () {
            var self = this;
            opts = self.options;
            new Ajax({
                method:"get",
                url:opts.prizeListUrl,
                data:{groupId:opts.groupId},
                onSuccess:function (rs) {
                    rs && (function () {
                        switch (rs.code) {
                            case STATUS_SUCCESS:
                                var msg = rs.data,
                                    prizeGroup = msg.prizeGroup;

                                self._prizeListReady(rs);
                                self.prizeList = msg.prizeList;
                                self.prizeGroup = prizeGroup;
                                self.fireEvent(PRIZE_LIST_READY, msg);
                                if (prizeGroup.status == 1) {
                                    self.fireEvent(GAME_OVER, MSG_GAME_FINISH);
                                }
                                break;
                            case STATUS_LOGOUT:
                                self._logout(rs);
                                self.fireEvent(LOGOUT, rs.data);
                                break;
                            default:
                                self._error(rs);
                                self.fireEvent(ERROR, rs.data);
                                break;
                        }
                    })();
                },
                onError:function () {
                    self._error();
                    self.fireEvent(ERROR, "网络错误请重试");
                }

            }).send(null);
        },
        /**
         * get prize list from server
         */
        getPrizeOwnerList:function () {
            var self = this;
            opts = self.options;

            new Ajax({
                method:"get",
                url:opts.prizeOwnerListUrl,
                data:{groupId:opts.groupId, max:opts.ownerListLength},
                onSuccess:function (rs) {
                    //console.dir(rs.data.recordList[0]);
                    rs && (function () {
                        switch (rs.code) {
                            case STATUS_SUCCESS:
                                self._prizeOwnerListReady(rs);
                                self.fireEvent(PRIZE_OWNER_LIST_READY, rs.data);
                                break;
                            case STATUS_LOGOUT:
                                self._logout(rs);
                                self.fireEvent(LOGOUT, rs.data);
                                break;
                            default:
                                self._error(rs);
                                self.fireEvent(ERROR, rs.data);
                                break;
                        }
                    })();
                },
                onError:function () {
                    self._error();
                    self.fireEvent(ERROR, MSG_SERVER_ERROR);
                }

            }).send(null);
        },
        /**
         * @type {Json}
         */
        currentResult:NULL,
        /**
         * reset draw result
         * @private
         */
        _resetDraw:function () {
            this.currentResult = NULL;
        },
        /**
         * draw lottery
         * @public
         */
        draw:function () {
            var self = this;
            opts = self.options;

            self._resetDraw();
            new Ajax({
                method:"get",
                url:opts.drawUrl,
                data:{groupId:opts.groupId, preventCache:Math.random()},
                onSuccess:function (rs) {
                    rs = JSON.decode(rs);
                    rs && (function () {
                        switch (rs.code) {
                            case STATUS_SUCCESS:
                                self._drawSuccess(rs);
                                self.currentResult = rs.data;
                                self.fireEvent(DRAW_SUCCESS, rs.data);
                                break;
                            case STATUS_GAME_OVER:
                                self._gameover(rs);
                                self.fireEvent(GAME_OVER, rs.data);
                                break;
                            case STATUS_LOGOUT:
                                self._logout(rs);
                                self.fireEvent(LOGOUT, rs.data);
                                break;
                            default:
                                self._error(rs);
                                self.fireEvent(ERROR, rs.data);
                                break;
                        }
                    })();
                },
                onError:function () {
                    self._error();
                    self.fireEvent(ERROR, MSG_SERVER_ERROR);
                }

            }).send(null);
        },
        //@通知flash
        _gameover:function (rs) {
            //this.swf.remote("gameover", [rs]);
        },
        _logout:function (rs) {

        },
        _drawSuccess:function (rs) {

        },
        _prizeListReady:function (rs) {

        },
        _prizeOwnerListReady:function (rs) {

        },
        _error:function (rs) {

        },
        /**
         * 通知flash显示相应视图
         * @param index
         */
        showResult:function (index) {
            this.swf.remote("drawLottery", [index]);
        },
        /**
         * 激活flash组件
         */
        enable:function () {
            this.swf.remote("enable");
        },
        /**
         * 禁用flash组件
         */
        disable:function () {
            //      alert("disable");
            this.swf.remote("disable");
        }

    });
    //@static members

    window.Lucky = Lucky;
})(window);