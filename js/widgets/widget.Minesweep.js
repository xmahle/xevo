(function() {

    /***
     * Minesweep Widget for XevoLve Bind.JS
     *
     * Minesweep graphics from D. Shep Poor (http://www.chezpoor.com/minesweeper/minesweeper.html)
     * Wrapped and recoded by Marko Kurjonen 2014
     *
     * @constructor
     */
    var WidgetMinesweep = function () {
        this.initialize();
    };

    var p = WidgetMinesweep.prototype = new $b.Widget();

    p.settings = {
        id: "Minesweep",
        title: "Minesweep"
    };
    p.widget = 'Minesweep';
    p.css = '.widget-Minesweep td {font-size: 2px;}';//.widget-Minesweep img {border-top-width: 0px;border-right-width: 0px;border-bottom-width: 0px;border-left-width: 0px;border-top-style: solid;border-right-style: solid;border-bottom-style: solid;border-left-style: solid;height: 16px;width: 16px;}';

    p.template = '';

    p.Widget_initialize = p.initialize;
    p.Widget_elementCreated = p.elementCreated;

    p.imageUrl = 'http://www.chezpoor.com/minesweeper/images/';

    p.images = {
        'bordertl.gif': 1,
        'bordertb.gif': 1,
        'bordertr.gif': 1,
        'borderlr.gif': 1,
        'borderjointl.gif': 1,
        'borderjointr.gif': 1,
        'borderbl.gif': 1,
        'borderbr.gif': 1,
        "time-.gif": 10,
        "moves-.gif": 10,
        "open-.gif": 8,
        "bombflagged.gif": 1,
        "bombrevealed.gif": 1,
        "bombmisflagged.gif": 1,
        "bombdeath.gif": 1,
        "bombquestion.gif": 1,
        "blank.gif": 1,
        "facedead.gif": 1,
        "facesmile.gif": 1,
        "facewin.gif": 1,
        "faceclock.gif": 1,
        "faceooh.gif": 1,
        "facepirate.gif": 1,
        "checked.gif": 1,
        "notchecked.gif": 1
    };

    p.board = {
        dead: false,
        width: 7,
        height: 7,
        bombz: 10,
        places: {},
        reveal: 0,
        time: 0
    };

    p.isRightClick = false;
    p.timer = null;

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

        // Preload images
        for (var filename in _self.images) {
            var count = _self.images[filename];
            for(var i = 0; i < count; i++) {
                var nfile = filename.replace("-", i);
                _self.images[nfile] = new Image();
                _self.images[nfile].src = _self.imageUrl + nfile;
            }
        }

        _self.startGame();

        //_self.gJQ('.widget-content').on('mouseover','a.clickbox',function(){ _self.cursorHoldLoc($(this).data("x"), $(this).data("y"));});
        //_self.gJQ('.widget-content').on('mouseout','a.clickbox',function(){ _self.cursorClearLoc($(this).data("x"), $(this).data("y"));});
        _self.gJQ('.widget-content').on('mousedown','a.clickbox',function(event){ _self.mouseDownEvent();});
        _self.gJQ('.widget-content').on('mouseup','a.clickbox',function(event){ _self.mouseUpEvent($(this).data('x'),$(this).data('y'));});
        //_self.gJQ('.widget-content').on('drag','a.clickbox',function(event){event.preventDefault(); return false;});

        _self.gJQ('.widget-content').on('contextmenu','a.clickbox',function(event){_self.isRightClick=true; event.preventDefault();event.stopImmediatePropagation();return false;});
        _self.gJQ('.widget-content').on('click','a.face',function(event){_self.faceClickedEvent();});
    };

    p.yourDead = function() {
        var _self = this;
        _self.gJQ('img.face').attr('src', _self.images['facedead.gif'].src);
        _self.board.dead = true;
        _self.stopTimer();
        _self.showBombs();
    };

    p.yourWinner = function() {
        var _self = this;
        _self.gJQ('img.face').attr('src', _self.images['facewin.gif'].src);
        _self.stopTimer();
        _self.showBombs();
    };


    // Events
    p.mouseRightClickEvent = function(x, y) {
        var _self = this;
        var img = _self.gJQ(".cell-" + x+"-"+ y + " img");
        if(img.attr('src') == _self.images['blank.gif'].src) {
            img.attr('src', _self.images['bombflagged.gif'].src);
        } else if(img.attr('src') == _self.images['bombflagged.gif'].src) {
            img.attr('src', _self.images['blank.gif'].src);
        }
    };
    p.faceClickedEvent = function() {
        var _self = this;
        _self.startGame();
    };

    p.mouseUpEvent = function(x, y) {
        var _self = this;
        var place = x +"-"+ y;

        if(_self.isRightClick) {
            _self.isRightClick = false;
            _self.mouseRightClickEvent(x, y);
            return;
        }
        if(_self.timer == null) {
            _self.startTimer();
        }

        if(_self.board.places[place] >= 99) {
            _self.gJQ(".cell-"+ place +" img").attr('src',_self.images['bombdeath.gif'].src);
            _self.yourDead()
        } else {

            _self.revealCell(x,y);

            // Check win
            if(_self.board.reveal == 0) {
                _self.yourWinner();
            }
            _self.gJQ('img.face').attr('src', _self.images['facesmile.gif'].src);
        }

    };

    p.mouseDownEvent = function() {
        var _self = this;
        _self.gJQ('img.face').attr('src', _self.images['faceooh.gif'].src);
    };


    // Do something
    p.revealCell = function(x,y) {
        var _self = this;
        if(typeof _self.board.places[x+"-"+y] != 'undefined' ) {
            return;
        }
        var count = 0;
        var minX = x>0 ? x-1 : 0,
            minY = y>0 ? y-1 : 0,
            maxX = x < _self.board.width ? x+1 : _self.board.width,
            maxY = y < _self.board.height ? y+1 : _self.board.height;

        for(var q=minX; q<=maxX; q++){
            for(var w=minY; w<=maxY; w++){
                count += _self.board.places[q+"-"+w] >= 99 ? 1 : 0;
            }
        }

        _self.board.places[x+"-"+y] = count;
        _self.board.reveal -= 1;
        _self.gJQ(".cell-"+ x +"-"+ y +" img").attr('src',_self.images['open'+ count +'.gif'].src);

        if(count == 0) {
            for(q=minX; q<=maxX; q++){
                for(w=minY; w<=maxY; w++){
                    if(typeof _self.board.places[q+"-"+w] == 'undefined')
                        _self.revealCell(q,w);
                }
            }
        }
    };

    p.showBombs = function() {
        var _self = this;
        var img;
        for(var x=0; x<=_self.board.width; x++){
            for(var y=0; y<=_self.board.height; y++){
                if(_self.board.places[x+'-'+y] >= 99) {
                    img = _self.gJQ('.cell-' + x + '-' + y + ' img');
                    if (img.attr('src') != _self.images['bombdeath.gif'].src) {
                        img.attr('src', _self.images['bombrevealed.gif'].src);
                    }
                }
            }
        }
    };

    p.startGame = function() {
        var _self = this;

       _self.stopTimer();

        _self.board.places = {};
        _self.board.dead = false;
        _self.board.reveal = (1+_self.board.width)*(1+_self.board.height) -_self.board.bombz;

        _self.createBoard();

        _self.initBoard();

    };

    p.startTimer = function() {
        var _self = this;

        if(_self.timer == null) {
            _self.timer = setInterval(function(){_self.updateTime();}, 1000);
        }
    };
    p.stopTimer = function() {
        var _self = this;

        if(_self.timer != null) {
            clearInterval(_self.timer);
            _self.timer = null;
        }
    };

    p.updateTime = function() {
        var _self = this;

        _self.board.time += 1;

        var digit0 = _self.images['time'+Math.floor(_self.board.time/100 % 10)+'.gif'].src,
            digit1 = _self.images['time'+Math.floor(_self.board.time/10 % 10)+'.gif'].src,
            digit2 = _self.images['time'+_self.board.time % 10+'.gif'].src;

        _self.gJQ('.digit0').attr('src', digit0);
        _self.gJQ('.digit1').attr('src', digit1);
        _self.gJQ('.digit2').attr('src', digit2);
    };

    p.initBoard = function() {
        var _self = this;

        for(var i = 0; i < _self.board.bombz; i++) {
           _self.setBombInPlace();
        }
    };

    p.setBombInPlace = function() {
        var _self = this;
        x = Math.floor(Math.random() * (_self.board.width+1));
        y = Math.floor(Math.random() * (_self.board.height+1));

        var place = x+"-"+y;
        if(_self.board.places[place] != 99) {
            _self.board.places[place] = 99;
            return true;
        }
        return _self.setBombInPlace();
    };

    p.createBoard = function() {

        var _self = this;
        var boardHtml = '';

        var sm = _self.board.width*8 - 44;

        boardHtml += ('<table border="0"><tr><td nowrap="nowrap">');

        // Build the top line
        boardHtml += ('<img src="'+ _self.images['bordertl.gif'].src +'" alt="" />');
        for (j=0; j <= _self.board.width; j++) {
            boardHtml += ('<img src="'+ _self.images['bordertb.gif'].src +'" height="10" width="16" alt="" />');
        }
        boardHtml += ('<img src="'+ _self.images['bordertr.gif'].src +'" alt="" /><br />');

        boardHtml += ('<img src="'+ _self.images['borderlr.gif'].src +'" height="26" width="10" alt="" />');
        boardHtml += ('<a class="bombCount"><img src="'+ _self.images['time0.gif'].src +'" border="0" name="bomb100s" width="13" height="23" alt="" /><IMG SRC="'+ _self.images['time0.gif'].src  +'" border="0" name="bomb10s" width="13" height="23" alt="" /><img src="'+ _self.images['time0.gif'].src +'" border="0" name="bomb1s" width="13" height="23" alt="" /></a>');
        boardHtml += ('<a class="face"><img class="face" style="margin: 0 '+ sm +'px" src="'+ _self.images['faceclock.gif'].src +'" border="0" width="26" height="26" alt="" /></a>');
        boardHtml +=
            '<img class="digit0" src="'+ _self.images['time0.gif'].src +'" border="0" width="13" height="23" alt="" />'+
            '<img class="digit1" src="'+ _self.images['time0.gif'].src +'" border="0" width="13" height="23" alt="" />'+
            '<img class="digit2" src="'+ _self.images['time0.gif'].src +'" border="0" width="13" height="23" alt="" />'+
            '<img src="'+ _self.images['borderlr.gif'].src +'" height="26" width="10" alt="" /><br />';

        // Line between title stuff and the board
        boardHtml += ('<img src="'+ _self.images['borderjointl.gif'].src +'" alt="" />');
        for (j=0; j<=_self.board.width; j++) {
            boardHtml += ('<img src="'+ _self.images['bordertb.gif'].src +'" height="10" width="16" alt="" />');
        }
        boardHtml += ('<img src="'+ _self.images['borderjointr.gif'].src +'" alt="" /><br />');

        for (i=0; i<=_self.board.height; i++) {
            boardHtml += ('<img src="'+ _self.images['borderlr.gif'].src +'" height="16" width="10" alt="" />');
            for (j=0; j<=_self.board.width; j++) {
                // IE requires onDragStart, Netscape requires onDrag. Click is handled via onmouseup.
                boardHtml += ('<a class="clickbox cell-'+j+'-'+i+'" onClick="" data-x="'+j+'" data-y="'+i+'">');
                boardHtml += ('<img src="'+ _self.images['blank.gif'].src +'" border="0" alt="" /></a>');
            }
            boardHtml += ('<img src="'+ _self.images['borderlr.gif'].src +'" border="0" height="16" width="10" alt="" /><br />');
        }

        // Build the bottom line, including corners
        boardHtml += ('<img src="'+ _self.images['borderbl.gif'].src +'" alt="" />');
        for (j=0; j<=_self.board.width; j++) {
            boardHtml += ('<img src="'+ _self.images['bordertb.gif'].src +'" height="10" width="16" alt="" />');
        }
        boardHtml += ('<img src="'+ _self.images['borderbr.gif'].src +'" alt="" /><br />');

        boardHtml += ('</td></tr></table>');

        _self.gJQ('.widget-content').html(boardHtml);

    };

    p.toString = function() {
        return "WidgetMinesweep["+ this._name +"]";
    };

    $b.WidgetMinesweep = WidgetMinesweep;
}());