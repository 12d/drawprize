;(function(exports, undefined){

if(exports.Lucky) throw new Error('namespace Lucky is existed');


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
    (function (window, $){
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
        window.IframeShim = IframeShim;
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
                    opacity:0.5,
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
        window.Overlay = Overlay;
    })(window, document.id);

    ;(function (window, $) {
        var NOOP = function(){};

        var Mbox = new Class({
            Implements:[Options, Events],
            options: {
                wrapCls: 'popup',
                style:'',
                closeBtn: '.delete',
                autoClose: false,
                onClose: NOOP,
                onOpen: NOOP
            },
            _timer: null,
            initialize: function (options){
                var self = this;
                self.overlay = new Overlay();
                self.setOptions(options||{});
                self._buildUI();

            },
            _bindEvent: function (){
                var opts = this.options,
                    self = this,
                    close = opts.closeBtn;

                if(typeof close==='string') {close = self.wrap.getElement(close);}
                /*
                 self.__closeHandler = function (){
                 self.close();
                 }
                 */
                close && close.addEvent('click', function (){
                    self.close();
                });
                opts.closeBtn = close;
            },
            _unbindEvent: function (){
                var self = this,
                    close = self.options.closeBtn;

                close&&close.removeEvents();
            },
            _buildUI: function (){
                var opts = this.options,
                    self = this,
                    wrap;

                wrap = new Element('div', {
                    'class': opts.wrapCls,
                    'style': opts.style
                });
                self.wrap = wrap;
                $(document.body).adopt(wrap);
                wrap.setStyles({
                    'display': 'none',
                    'position': 'absolute',
                    'left': '50%',
                    'zIndex': self.overlay.options.zIndex+2,
                    'top': '50%'
                });

            },
            _align: function(){
                var wrap = this.wrap;
                wrap.setStyles({
                    'marginLeft': -wrap.getWidth()/2,
                    'marginTop': -wrap.getHeight()/2 + document.getScrollTop()
                });

            },
            open:function (text) {
                if(this._isShow) return this;
                var wrap = this.wrap,
                    autoClose = this.options.autoClose,
                    self = this;


                wrap.set('html', text);
                self._bindEvent();
                wrap.setStyle('display', '');
                self._align();
                self.overlay.show();
                self._isShow = true;
                self.fireEvent('open');
                autoClose>0 && (self._timer = setTimeout(function (){
                    self.close();
                }, autoClose));
                return self;
            },
            close:function () {
                if(!this._isShow) return this;
                this.wrap.setStyle('display', 'none');
                this._isShow = false;
                this.fireEvent('close');
                clearTimeout(this._timer);
                this._unbindEvent();
                this.overlay.dispose();
                this.wrap.destroy();
            }
        });
        Mbox.openLite = function (text, autoClose, style){
            Mbox._tempMbox = new Mbox({
                autoClose: autoClose,
                style: style
            }).open(text);
        }
        Mbox.close = function (){
            Mbox._tempMbox.close();
            delete Mbox._tempMbox;
        }
        window.Mbox = Mbox;
    })(window, document.id);
    ;

var Lucky = {};

Lucky.transform = function(dom, angle, scale){
    if (dom && dom.nodeType === 1) {
        angle = parseFloat(angle) || 0;
        scale = parseFloat(scale) || 1;
        if (typeof(angle) === "number") {
            //IE
            var rad = angle * (Math.PI / 180);
            var m11 = Math.cos(rad) * scale, m12 = -1 * Math.sin(rad) * scale, m21 = Math.sin(rad) * scale, m22 = m11;
            if (!dom.style.Transform) {
                dom.style.filter = "progid:DXImageTransform.Microsoft.Matrix(M11="+ m11 +",M12="+ m12 +",M21="+ m21 +",M22="+ m22 +",SizingMethod='auto expand')";
            }
            //Modern
            dom.style.MozTransform = "rotate("+ angle +"deg) scale("+ scale +")";
            dom.style.WebkitTransform = "rotate("+ angle +"deg) scale("+ scale +")";
            dom.style.OTransform = "rotate("+ angle +"deg) scale("+ scale +")";
            dom.style.Transform = "rotate("+ angle +"deg) scale("+ scale +")";
        }
    }
}

return exports.Lucky = Lucky;

})(window);