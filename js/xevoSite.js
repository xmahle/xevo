(function() {

    var XevoSite = function () {
        this.initialize();
    };

    var p = XevoSite.prototype = new $b.Site();

    p.Site_initialize = p.initialize;
    p.Site_elementCreated = p.elementCreated;
    p.contentPath = "data/";
    p.settingsFilename = "bind.json";
    p.widgetsPath = "";
    p.widgetPos = 50;
    p.localWidgets = null;

    p.initialize = function() {
        this.Site_initialize();
        $(this).off("objectCreated");

        var _self = window.site = this;

        $(this).on("objectCreated", function(){_self.elementCreated();});
    };

    p.elementCreated = function() {
        var _self = this;

        _self.Site_elementCreated();

        // Setup widget storage
        _self.localWidgets = _self.storage.get('localWidgets');
        if(!_self.localWidgets) {
            _self.storage.set('localWidgets',{
                // Temporary 'Startup' widget
                Empty: {
                    settings: {
                        id: 'Empty',
                        title: 'Empty Widget',
                        description: ''
                    },
                    code: '(function() {\n var WidgetEmpty = function () {\nthis.initialize();\n};\nvar p = WidgetEmpty.prototype = new $b.Widget();\np.template = "New empty Widget contents.";\np.Widget_initialize = p.initialize;\np.initialize = function() {\nthis.Widget_initialize();\n};\np.toString = function() {\n    return "WidgetEmpty["+ this._name +"]";\n};\n$b.WidgetEmpty = WidgetEmpty;\n}());\n'
                }
            });
            _self.localWidgets = _self.storage.get('localWidgets');
        }

        // Global events
        $(window).on('resize', function(){_self.desktopResize();});
    };

    // Override
    p.launchSite = function() {
        var _self = this;

        _self.widgetsPath = window.site.settings.paths.scripts +'widgets/';

        // get local widgets
        for(var i in _self.localWidgets) {
            _self.gJQ('.myWidgets').append('<li class="widget-launch" data-widget="'+i+'">'+i+'</li>');
        }

        // Inits left side menu component
        _self.initMeny();

        // Create layout objects
        $b.OP.partial("body");

        // Just what it says?
        _self.hideLoadingScreen();

        // Modal init (adds events and shows Welcome modal)
        _self.gJQ('.md-trigger').on('click', function(){_self.openModal($(this).data('modal'));});
        _self.gJQ('.md-close').on('click', function(){$(this).closest('.md-modal').removeClass('md-show');});
        _self.gJQ('#modal-welcome').addClass('md-show');

        // Menu init
        _self.gJQ('.widget-launch').on('click', function() {_self.launchWidget($(this).data('widget'));});

    };

    /***
     * Opens modal popup and close Meny (DA?)
     * @param modal Name of modal
     */
    p.openModal = function(modal) {
        var _self = this;
        _self.gJQ('#'+modal).addClass('md-show');

        _self.meny.close();
    };

    /***
     * Loads and creates new Widget
     * - Loads from localStorage if widget exists there
     * - Other vice tries to load from server
     * - TODO: Load error handling
     * @param widget Widget name
     */
    p.launchWidget = function(widget, attributes) {
        var _self = this;

        var widgetStorageObject = _self.getWidgetStorageObject(widget);
        if(widgetStorageObject) {
            // Evaluate the code
            eval(widgetStorageObject.code);
            // Append settings to attributes
            if(!attributes) {
                attributes = {settings:widgetStorageObject.settings};
            } else {
                attributes.settings = widgetStorageObject.settings;
            }

            _self.createWidget(widget, attributes);
        } else {
            var filename = _self.widgetsPath +'widget.' + widget + '.js?'+ new Date().getTime();

            // Make sure the widget is loaded..
            head.load(filename, function () {
                _self.createWidget(widget, attributes);
            });
        }

        _self.meny.close();
    };

    /***
     * Retrieves the storage object of the Widget (code and settings)
     * - TODO: Multiple storage options?
     * @param widget Name of the Widget
     */
    p.getWidgetStorageObject = function(widget) {
        var _self = this;
        if(_self.localWidgets[widget]) {
            return _self.localWidgets[widget];
        } else if($('#widget-'+widget+'-js').length > 0) {
            // It is server side script!
            // TODO: Fetch server side script for editing!
        }
        return false;
    };

    /***
     * Create new widget, widget code must be already load/eval
     * @param widget Name of the Widget
     * @param attributes Widget attributes (if needed)
     * @returns {*|Object} Newly created bind.js object
     */
    p.createWidget = function(widget, attributes) {
        var _self = this;

        // Create the html and append to .desktop
        var widgetName = widget + _self.widgetPos;
        var attributesHtml = (attributes ? ' data-attributes=\''+ JSON.stringify(attributes) +'\'' : '');
        var elem = '<div class="widget widget-'+ widget +'" style="top: 50px;left: '+ _self.widgetPos +'px" data-object="Widget'+ widget +'" data-name="'+ widgetName +'"'+ attributesHtml +'></div>';
        $(elem).appendTo(_self.gJQ('.desktop')).on('mousedown', function(){_self.bringFront($(this).data('name'));});

        // TODO: Set Widget position -> Make this right
        _self.widgetPos += 40;
        if(_self.widgetPos > $(window).width()) {
            _self.widgetPos = 50;
        }

        // Move newly created widget to the front
        _self.bringFront(widgetName);

        // Init bind.js for widget
        var count = $b.OP.partial('.desktop');

        if(count == 0) {
            // Error in bind.js OP (object not found)
            // Remove object html!
            $('.desktop div[data-name="'+ widgetName +'"]').remove();
            return false;
        }
        // Return newly created widget
        return $b.OM.find(widgetName);
    };

    /***
     * Set z-index of all widget objects under .desktop (target+1)
     * @param objectName Name of the target object
     * @param zIndex Default z-index, target will have +1
     */
    p.bringFront = function(objectName, zIndex) {
        var _self = this;
        zIndex = zIndex | 200;

        _self.gJQ('.desktop > .widget').each(function(){
            $(this).css('z-index', zIndex + ($(this).data('name') == objectName ? 1 : 0));
        });
    };

    /***
     * Called on windows resize event
     * TODO: desktopResize event
     */
    p.desktopResize = function() {
        var _self = this;
    };

    p.initMeny = function() {
        var _self = this;
        _self.meny = Meny.create({
            // The element that will be animated in from off screen
            menuElement: document.querySelector( '.meny' ),

            // The contents that gets pushed aside while Meny is active
            contentsElement: document.querySelector( '.desktop' ),

            // The alignment of the menu (top/right/bottom/left)
            position: 'left',

            // The height of the menu (when using top/bottom position)
            height: 200,

            // The width of the menu (when using left/right position)
            width: 260,

            // The angle at which the contents will rotate to.
            angle: 30,

            // The mouse distance from menu position which can trigger menu to open.
            threshold: 40,

            // Width(in px) of the thin line you see on screen when menu is in closed position.
            overlap: 2,

            // The total time taken by menu animation.
            transitionDuration: '0.5s',

            // Transition style for menu animations
            transitionEasing: 'ease',

            // Gradient overlay for the contents
            gradient: 'rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.65) 100%)',

            // Use mouse movement to automatically open/close
            mouse: true,

            // Use touch swipe events to open/close
            touch: true
        });

        /*
         meny.addEventListener( 'open', function() {

         // do something on open

         } );

         meny.addEventListener( 'close', function() {

         // do something on close

         } );

         meny.addEventListener( 'opened', function() {

         // do something right after meny is opened and transitions finished

         } );

         meny.addEventListener( 'closed', function() {

         // do something right after meny is closed and transitions finished

         } );
         */
    };

    p.toString = function() {
        return "XevoSite["+ this._name +"]";
    };

    $b.XevoSite = XevoSite;
}());