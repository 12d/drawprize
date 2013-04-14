/**
 * User: xuwei.chen
 * Date: 11-12-26
 * Time: 上午10:34
 * To change this template use File | Settings | File Templates.
 */
;
;
(function (exports, $, undefined) {
    //@const
    var EMPTY = "",
        NULL = null,
        NOOP = function () {
        },
        UNDEFINED = undefined,

        DRAW_END = 'drawEnd',
        DRAW_START= 'drawStart',

        ERROR = 'error',



        MSG_SERVER_ERROR = "网络错误，请重试",


    //@static members

        mix = Object.append,
        Ajax = Request;


    var Base = new Class({
        Implements:[Options, Events],
        initialize: function(options){
            var self = this,
                trigger,
                opts = null;

            self.setOptions(options);
            opts = self.options;

            trigger = opts.trigger;
            self._drawPrize = self.draw.bind(self);
            trigger && trigger.addEvent('click', self._drawPrize);
            self.onDrawStart = opts.onDrawStart;
            self.onDrawEnd = opts.onDrawEnd;
        },
        options: {
            url: EMPTY,
            noCache: true,
            data: {},
            method: 'get',
            trigger: NULL
        },
        /**
         *
         * @param {Object} requestData
         */
        draw:function (requestData) {
            var self = this;

            opts = self.options;

            //self._resetDraw();
            new Ajax({
                method:opts.method,
                url:opts.url,
                data:opts.noCache ? mix(opts.data, {t: +new Date}) : opts.requestData,
                onSuccess:function (rs) {
                    self.enable();
                    self.fireEvent(DRAW_END, JSON.decode(rs));
                },
                onError:function () {
                    self.fireEvent(ERROR, MSG_SERVER_ERROR);
                }

            }).send(null);
            self.disable();
            self.fireEvent(DRAW_START);
            return self;
        },
        enable: function(callback){
            var btn = this.options.trigger;

            btn.addEvent('click', this._drawPrize);
            btn.removeAttribute('disabled');
            callback && callback(this);
            return this;
        },
        disable: function(callback){
            var btn = this.options.trigger;

            btn.removeEvent('click', this._drawPrize);
            btn.setAttribute('disabled', 'disabled');
            callback && callback(this);
            return this;
        }
    });
    return exports.Base = Base;
//});
})(window.Lucky, document.id);