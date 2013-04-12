;
(function (window, $) {
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
        NO_ORDER = 'noOrder',
        NO_COMMENT = 'noComment',
        GAME_OVER = 'gameover',
        ERROR = 'error',
    /*@status code*/
        STATUS_SUCCESS = 200, //调用成功
        STATUS_LOGOUT = 401, //未登录
        STATUS_NO_ORDER = 402, //没有满足时间段的订单
        STATUS_NOCOMMENT = 403, //没有离店或没有点评
        STATUS_GAME_OVER = 404, //没有抽奖次数
        STATUS_PARAM_ERROR = 406, //参数错误
        STATUS_SERVER_ERROR = 500, //服务器错误


        MSG_SERVER_ERROR = "网络错误，请重试",
        MSG_GAME_FINISH = '活动结束了！',

        FLASH_FUNC = {
            startDraw:"startDraw"
        },
        PREFIX = "LUCKY",

    //@absolutly private
        Swf = Swiff,
        preventSwfCache = Browser.ie && Browser.version<9, //if swf loaded from cache, swf can not call javascript
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

            self.swf = new Swf(opts.swfUrl+(preventSwfCache?'?t='+Date.now():''), {
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
            onPrizeOwnerListReady:NOOP
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
                        switch (parseInt(rs.code)) {
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
                        switch (parseInt(rs.code)) {
                            case STATUS_SUCCESS:
                                self._drawSuccess(rs);
                                self.currentResult = rs.data;
                                self.fireEvent(DRAW_SUCCESS, rs.data);
                                break;
                            case STATUS_NO_ORDER:
                                self._noOrder(rs);
                                self.fireEvent(NO_ORDER, rs.data);
                                break;
                            case STATUS_NOCOMMENT:
                                self._noComment(rs);
                                self.fireEvent(NO_COMMENT, rs.data);
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
        _noOrder: function (rs){

        },
        _noComment: function (rs){

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
})(window, document.id);


(function (window, $) {

    var Marquee = new Class({
        Implements:[Options, Events],
        options:{
            wrap:null,
            fps:30,
            direction: 'top',
            min: 10,
            frameSize:1
        },
        initialize:function (options) {
            var self = this,
                wrap;

            self.setOptions(options);
            wrap = self.options.wrap;
            self._enabled = wrap.getChildren().length>self.options.min;
            if(!self._enabled) return self;

            self.wrap = wrap;
            self._startPos = self._currentPos = parseInt(self.wrap.getStyle(self.options.direction))||0;
            self._steps = 0;

            self.frequency = 1000/self.options.fps;
            self._runtime();

            self._copyStartPos = self._copyCurrentPos = self._env.maxOffset;
            self._copySteps = 0;

            self._bindEvent();
        },
        _bindEvent: function(){
            var self = this;
            $(self.wrap.parentNode).addEvents({
                mouseenter: function (){
                    self.pause();
                },
                mouseleave: function (){
                    self.play();
                }
            });
        },
        _runtime: function (){
            var self = this,
                dir = self.options.direction,
                wrap = self.wrap,
                copy,
                isVertical = (dir== 'top'|| dir == 'bottom'),
                mask = {},
                env = {};

            env.maxOffset = isVertical ? self.wrap.getHeight() : self.wrap.getWidth();

            copy = wrap.clone();
            wrap.parentNode.appendChild(copy);
            copy.setStyle(dir, env.maxOffset);
            //self._copyCurrentPos = self._copyStartPos = -env.maxOffset;

            mask.size = isVertical ? $(wrap.parentNode).getHeight() : mask.width = $(wrap.parentNode).getWidth();
            env.mask = mask;
            env.copy = copy;
            self._env = env;
        },
        _animate:function () {
            var self = this,
                wrap = self.wrap,
                copy = self._env.copy,
                options = self.options,
                frameSize = options.frameSize,
                maxOffset = Math.abs(self._env.maxOffset),
                direction = options.direction,
                currentPos = (self._startPos+(-frameSize*(++self._steps))),
                copyCurrentPos = (self._copyStartPos+(-frameSize*(++self._copySteps)))

            wrap.setStyle(direction, currentPos);
            copy.setStyle(direction, copyCurrentPos);
            if (currentPos <= -maxOffset) {
                self._steps = 0;
                self._startPos = maxOffset;
            }
            if (copyCurrentPos <= -maxOffset) {
                self._copySteps = 0;
                self._copyStartPos = maxOffset;
            }

        },
        pause:function () {
            var self = this;
            clearInterval(self._timer);
        },
        play:function () {

            var self = this,
                wrap = self.wrap,
                env = self._env,
                copy = env.copy;

            if(!self._enabled) return self;
            self._timer = setInterval(function (){
                self._animate();
            }, self.frequency);
            return self;
        },
        setContent: function (content){
            this.wrap.html(content);
        }
    });
    window.Marquee = Marquee;
    //or initialize with another way;
})(window, document.id);


Element.implement({
    mask: function () {
        var wrap = this,
            mask;


        wrap.setStyles({ 'display': 'block' });
        mask = new Overlay();
        mask.position();
        wrap.__mask = mask;
        wrap.setStyles({
            'marginLeft': -wrap.getWidth() / 2,
            'position': 'absolute',
            'left': '50%',
            'top': '50%',
            'marginTop': -wrap.getHeight() / 2 + document.getScrollTop(),
            'zIndex': mask.options.zIndex + 2
        });
    },
    unmask: function () {
        this.style.display = 'none';
        this.__mask.dispose();
    }
});
