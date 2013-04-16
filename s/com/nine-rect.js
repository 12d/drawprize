/**
 * User: chen
 * Date: 13-4-13
 * Time: PM12:09
 * To change this template use File | Settings | File Templates.
 */


;
(function (exports, $, undefined) {
    var NULL = null;

    function addPreStepAndTween(pre, total, to, isStop){
        return pre + (total- pre%total) +to + (isStop ? addTweenStep(total) : 0);
    }

    function addTweenStep(total){
        return total * 1;
    }

    var NineRect = new Class({
        Implements:[Options, Events],
        Extends: exports.Base,
        //initialize must be after Implements and Extends, or it will not be called
        initialize: function(options){
            var self = this,
                opts;

            self._playIndex = 0;
            self._currentStep = 0;
            self.setOptions(options);

            opts = self.options;
            trigger = opts.trigger;
            self._drawPrize = self.draw.bind(self);
            trigger && trigger.addEvent('click', self._drawPrize);

            self.__duration=opts.maxDuration;
            self.setDirection(self.options.direction);
            self.__rectsMap = [];
            self._rectPosMap();
            self._addMasks();
        },
        /**
         * default setting for nice-rect
         * @conf
         * <code>
         *
         * </code>
         */
        options: {
            container: NULL,
            trigger: NULL,
            cols: 3,
            rows: 3,
            maskClass: '',
            acceleration: 80,
            maxDuration: 800,
            minDuration: 80,
            direction: 'left'
        },
        setDirection: function(direction){
            this._step = direction===NineRect.LEFT ? 1 : direction === NineRect.RIGHT ? -1 : 0;
            this.direction = direction;
        },
        play: function(from){
            var self = this;

            if(!self.isPlaying){
                self._playIndex=from||self._actived||0;
                self._loop(true); //play immediately
                self.isPlaying = true;
            }
        },
        gotoAndStop: function(index){
            var self = this;
            self._actived = index;
            self._stopHandler = function(){
                self.__isStop = true;
                self._activeIndex = addPreStepAndTween(self._currentStep, self.__rectsMap.length, index, true);
                self._stopHandler = false;

            }
        },
        _isPlaying: false,
        stop: function(){
            //this._activeIndex = this._currentStep = 0;
            var actived = this._actived;
            this.isPlaying = false;
            this.__isStop = false;
            clearTimeout(this._animator);
            this.fireEvent('complete', [actived, this._masks[actived]]);
        },
        _calculateDuration: function(){
            var self = this,
                opts = self.options,
//                acceleration = opts.acceleration,
                duration = self.__duration;
            if(!self.__isStop){
                if(duration>=opts.minDuration){
                    duration*=0.8;
                }else{
                    self._stopHandler && self._stopHandler();
                    duration = opts.minDuration;
                }
            }else{
                if(duration<=opts.maxDuration){
                    duration/=0.8;
                }else{
                    duration = opts.maxDuration;
                }
            }
            self.__duration = duration;

        },
        _addMasks: function(){
            var self = this,
                masks = [],
                container = self.options.container,
                tplEle = new Element('div.'+self.options.maskClass),
                ele = null,
                rectsMap = self.__rectsMap;

            rectsMap.each(function(rect){
                ele = tplEle.cloneNode();
                ele.setStyles({
                    left: rect.x,
                    top: rect.y
                });
                masks.push(ele);
                ele.inject(container);
            });
            self._masks = masks;
        },
        /**
         *
         * @param {Boolean} isImmediate, need to play immediately.
         * @private
         */
        _loop: function(isImmediate){
            var self = this;

            self._animator = setTimeout(function (){
                var activeIndex = self._activeIndex;

                self._calculateDuration();
                self._moveCursor();
                if(self._currentStep===activeIndex){
                    self.stop();
                    return;
                }
                self._loop();
            }, isImmediate?0:self.__duration);
        },
        _moveCursor: function(){
            var cursor = this.options.cursor;

            this._playIndex+=this._step;
            if(this._playIndex >= this.__rectsMap.length){
                this._playIndex=0;
            }else if(this._playIndex<0){
                this._playIndex=this.__rectsMap.length-1;
            }
            pos = this.__rectsMap[this._playIndex];
            this._currentStep++;
            cursor.setStyles({
                left: pos.x+'px',
                top: pos.y+'px'
            });

        },

        _rectPosMap: function(){
            var opts = this.options,
                container = opts.container,
                cols = opts.cols,
                rows = opts.rows,
                rectWidth = parseInt(container.getStyle('width'))/cols,
                rectHeight = parseInt(container.getStyle('height'))/rows,
                rectsMap = [],
                rectsCount = 2*(cols+rows) - 4,
                i = 0,
                rect = NULL;

            for(;i<rectsCount;i++){
                rect = {};
                if(i<cols){ //top side
//                    console.log("top");
                    rect.x = i;
                    rect.y = 0;
                    rect.side = 'top';
                }else if(i<rectsCount/2){ //right side
//                    console.log("right");
                    rect.x = cols-1;
                    rect.y = (i+1-cols);
                    rect.side = 'right';
                }else if(i<rectsCount-rows+1){ //bottom side
//                    console.log("bottom");
                    rect.x = (--cols);
                    rect.y = rows-1;
                    rect.side = 'bottom';
                }else if(i<rectsCount){ //left side
                    //console.log("left");
                    rect.side = 'left';
                    rect.x = 0;
                    rect.y = (--rows);
                }

                rect.x = rect.x * rectWidth;
                rect.y = rect.y * rectHeight;

                rectsMap.push(rect);
            }
            this.__rectsMap = rectsMap;
        }
    });
    NineRect.LEFT = 'left';
    NineRect.RIGHT = 'right';
    return exports.NineRect = NineRect;
})(window.Lucky, document.id);
 
 
