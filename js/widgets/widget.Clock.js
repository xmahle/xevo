(function() {

    /***
     * Clock Widget for XevoLve Bind.JS
     *
     * Clock functionality done by Jon Combe 2010 (http://joncom.be/code/css-clocks/)
     * Wrapped by Marko Kurjonen 2014
     *
     * @constructor
     */
    var WidgetClock = function () {
        this.initialize();
    };

    var p = WidgetClock.prototype = new $b.Widget();

    p.settings = {
        id: "Clock",
        title: "My Clock"
    };
    p.widget = 'Clock';

    p.css = '.clockanalog { background: #012345 url("http://static.joncom.be/screen/images/code/css-clocks/analog.gif") no-repeat 0 0; float: left; height: 250px; margin: 0; overflow: hidden; position: relative; width: 250px; }.clockanalog img { border: 0; left: 0px; position: absolute; top: 0px; }';

    p.template =
        '<div class="clockanalog"><img src="http://static.joncom.be/screen/images/code/css-clocks/analogseconds.png" class="analogsecond" alt="Clock second-hand"><img src="http://static.joncom.be/screen/images/code/css-clocks/analogminutes.png" class="analogminute" alt="Clock minute-hand"><img src="http://static.joncom.be/screen/images/code/css-clocks/analoghours.png" class="analoghour" alt="Clock hour-hand"></div>';

    p.Widget_initialize = p.initialize;
    p.Widget_elementCreated = p.elementCreated;

    p.initialize = function() {
        this.Widget_initialize();

        var _self = this;
        $(this).off("objectCreated");

        $(this).on("objectCreated", function () {
            _self.elementCreated();
        });

    };
    p.elementCreated = function() {
        var _self = this;

        _self.Widget_elementCreated();

        // Set initial time
        _self.dtDate = new Date();

        _self.iHourRotation = this.fGetHour();
        _self.fRotate("analoghour", this.iHourRotation);

        _self.iMinuteRotation = this.fGetMinute();
        _self.fRotate("analogminute", this.iMinuteRotation);

        _self.iCurrSecond = this.dtDate.getSeconds();
        _self.fRotate("analogsecond", (6 * this.iCurrSecond));

        // Set timers
        _self.iTimerAnimate = setInterval(function(){_self.fAnimate();}, 20);
        _self.iTimerUpdate =  setInterval(function(){_self.fUpdate();}, 1000);


    };

    p.aSecond =         [];
    p.dtDate =          0;
    p.iCurrSecond =     -1;
    p.iHourRotation =   -1;
    p.iMinuteRotation = -1;
    p.iStepSize =      10;
    p.fAnimate =       function() {
            if (this.aSecond.length > 0) {
                this.fRotate("analogsecond", this.aSecond[0]);
                this.aSecond = this.aSecond.slice(1);
            }
        };
    p.fGetHour=     function() {
            var iHours = this.dtDate.getHours();
            if (iHours > 11) {
                iHours -= 12;
            }
            return Math.round((this.dtDate.getHours() * 30) + (this.dtDate.getMinutes() / 2) + (this.dtDate.getSeconds() / 120));
        };
    p.fGetMinute=     function() {
            return Math.round((this.dtDate.getMinutes() * 6) + (this.dtDate.getSeconds() / 10));
        };

    p.fRotate=        function(sID, iDeg) {
        var _self = this;
            var sCSS = ("rotate(" + iDeg + "deg)");

        _self.gJQ("."+sID).css({ '-moz-transform': sCSS, '-o-transform': sCSS, '-webkit-transform': sCSS });
        };
    p.fStepSize=     function(iTo, iFrom) {
            var iAnimDiff = (iFrom - iTo);
            if (iAnimDiff > 0) {
                iAnimDiff -= 360;
            }
            return iAnimDiff / this.iStepSize;
        };
    p.fUpdate=       function() {
            // update time
            this.dtDate = new Date();

            // hours
            var iTemp = this.fGetHour();
            if (this.iHourRotation != iTemp) {
                this.iHourRotation = iTemp;
                this.fRotate("analoghour", iTemp);
            }

            // minutes
            iTemp = this.fGetMinute();
            if (this.iMinuteRotation != iTemp) {
                this.iMinuteRotation = iTemp;
                this.fRotate("analogminute", iTemp);
            }

            // seconds
            if (this.iCurrSecond != this.dtDate.getSeconds()) {
                var iRotateFrom = (6 * this.iCurrSecond);
                this.iCurrSecond = this.dtDate.getSeconds();
                var iRotateTo = (6 * this.iCurrSecond);

                // push steps into array
                var iDiff = this.fStepSize(iRotateTo, iRotateFrom);
                for (var i = 0; i < this.iStepSize; i++) {
                    iRotateFrom -= iDiff;
                    this.aSecond.push(Math.round(iRotateFrom));
                }
            }
        };


    p.toString = function() {
        return "WidgetClock["+ this._name +"]";
    };

    $b.WidgetClock = WidgetClock;
}());