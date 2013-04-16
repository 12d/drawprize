(function () {

    var Marquee = new Class({
        Implements:[Options, Events],
        options:{
            wrap:null,
            fps:30,
            direction: 'top',
            frameSize:1
        },
        initialize:function (options) {
            var self = this;

            self.setOptions(options);
            self.wrap = self.options.wrap;
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
        __animate:function (time) {
            var self = this,
                wrap = self.wrap,
                copy = self._env.copy,
                options = self.options,
                frameSize = options.frameSize,
                maxOffset = Math.abs(self._env.maxOffset),
                direction = options.direction,
                currentPos = (self._startPos+(-frameSize*(++self._steps))),
                copyCurrentPos = (self._copyStartPos+(-frameSize*(++self._copySteps)));

            //console.log(time - startTime);
            wrap.setStyle(direction, -(time - startTime) / 4 % 600);
            copy.setStyle(direction, -(time - startTime) / 4 % 600);

            if (currentPos <= -maxOffset) {
                self._steps = 0;
                self._startPos = maxOffset;
            }
            if (copyCurrentPos <= -maxOffset) {
                self._copySteps = 0;
                self._copyStartPos = maxOffset;
            }
            startTime = Date.now();
            self._timer = requestAnimationFrame(function (time){
                self.__animate(time);
            });

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

            self._timer = setInterval(function (){
                self._animate();
            }, self.frequency);
            return self;
        },
        _play: function (){
            var self = this,
                wrap = self.wrap,
                env = self._env,
                copy = env.copy;

            startTime = Date.now();
            self._timer = requestAnimationFrame(function (time){
                self.__animate(time);
            });
            return self;
        },
        setContent: function (content){
            this.wrap.html(content);
        }
    });
    window.Marquee = Marquee;
    //or initialize with another way;

    new Marquee({
        wrap: $('J_marquee')
    }).play();
})();
