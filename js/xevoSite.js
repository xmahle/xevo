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

    // Default widget settings
    p.widgetSettings = {
        widget: '',
        settings: {
            id: '',
            title: 'Unnamed',
            description: ''
        },
        position: {x:50,y:50}
    };
    // Desktop settings of new user
    p.initialDesktop = {
        YourClock: {
            widget: 'Clock',
            settings: {
                id: 'YourClock',
                title: 'Your Clock',
                description: 'Initial Clock Widget'
            },
            position: {left:100,top:100}
        }
    };
    p.initialWidgets = {
        Empty: {
            widget: 'Empty',
            settings: {
                id: 'Empty',
                title: 'Empty Widget',
                description: ''
            },
            code: '(function() {\n var WidgetEmpty = function () {\nthis.initialize();\n};\nvar p = WidgetEmpty.prototype = new $b.Widget();\np.template = "New empty Widget contents.";\np.Widget_initialize = p.initialize;\np.initialize = function() {\nthis.Widget_initialize();\n};\np.toString = function() {\n    return "WidgetEmpty["+ this._name +"]";\n};\n$b.WidgetEmpty = WidgetEmpty;\n}());\n'
        }
    };
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

        // Get desktop setup from localStorage
        _self.personalDesktop = _self.storage.get('personalDesktop');

        if(!_self.personalDesktop) {
            _self.personalDesktop = _self.initialDesktop;
            _self.storage.set('personalDesktop', _self.personalDesktop);
        }

        // Setup widget storage
        _self.localWidgets = _self.storage.get('localWidgets');

        if(!_self.localWidgets) {

            _self.localWidgets = _self.initialWidgets;
            _self.storage.set('localWidgets', _self.localWidgets);
        }

        // Global events
        $(window).on('resize', function(){_self.desktopResize();});
        // Attach on unload event for cleanup and desktop save
        $(window).on('unload', function(){_self.unloadSiteEvent();});

    };

    // Override
    p.launchSite = function() {
        var _self = this;

        _self.widgetsPath = window.site.settings.paths.scripts +'widgets/';

        _self.setupMyWidgets();

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

        // Clear storage - Do it click event
        _self.gJQ('.modal-clearstorage-ok').on('click', function() {_self.clearStorage();});

        // Load desktop
        _self.setupPersonalDesktop();
    };

    /**
     * Creates personal desktop from storage object
     */
    p.setupPersonalDesktop = function() {
        var _self = this;
        // Remove all Widgets from desktop
        $('.widget').each(function(){
            var widget = $b.OM.find($(this).attr('data-name'));
            if(widget) {
                widget.killObject();
            }
        });

        // Create from object
        for(var w in _self.personalDesktop) {
            _self.launchWidget(_self.personalDesktop[w].widget, _self.personalDesktop[w]);
        }
    };

    /**
     * Setups the My Widgets menu items from storage object
     * - Clear list
     * - Update from localWidgets
     */
    p.setupMyWidgets = function() {
        var _self = this;

        // get local widgets
        for(var i in _self.localWidgets) {
            _self.gJQ('.myWidgets').html('').append('<li class="widget-launch" data-widget="'+i+'">'+i+'</li>');
        }

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

    /**
     * Updates widget storage object
     * @param widgetId String
     * @param attributes Object
     * @returns {boolean}
     */
    p.updateWidgetStorageObject = function(widgetId, attributes) {
        var _self = this;
        if(_self.localWidgets[widgetId]) {

            var newAttributes = $.extend(true, {},_self.localWidgets[widgetId], attributes);
            _self.localWidgets[widgetId] = newAttributes;

        } else  {
            _self.localWidgets[widgetId] = attributes;
        }

        // Update My widget links
        _self.setupMyWidgets();

        return true;
    };
    /***
     * Retrieves the storage object of the Widget (code and settings)
     * - TODO: Multiple storage options?
     * @param widget - Name of the Widget
     * @param callback - Use this if you want to load the script as text!
     */
    p.getWidgetStorageObject = function(widget, callback) {
        var _self = this;

        if(_self.localWidgets[widget]) {
            return _self.localWidgets[widget];

        } else
        if($('#widget-'+widget+'-js').length > 0 && typeof callback == "function") {

            // It is server side script!
            // Load it and call callback
            $.get(_self.widgetsPath +'widget.' + widget + ".js",
                function(response){ callback(response); }
            );

            // Return just true, to notify that the callback will be used when ready...
            return true;
        }
        return false;
    };

    /***
     * Creates or updates personal desktop widget
     * @param widgetId String id of the widget (old id, if the id has been changed!)
     * @param attributes Object attributes to save
     */
    p.updateWidgetDesktopStorage = function(widgetId, attributes) {
        var _self = this;
        var newAttributes = {};
        if(_self.personalDesktop[widgetId]) {
            // Merge objects deeply
            newAttributes = $.extend(true, {}, _self.personalDesktop[widgetId], attributes);

            // Check if id has changed
            if(widgetId != newAttributes.settings.id) {
                // Remove old id..
                _self.removeWidgetDesktopStorage(widgetId);
            }
            // Create / update
            _self.personalDesktop[newAttributes.settings.id] = newAttributes;

        } else {
            // New widget created -> save it
            _self.personalDesktop[widgetId] = attributes;
        }
    };
    /***
     * Remove widget from personal desktop object
     * @param widgetId String
     * @returns {boolean} Succeeded?
     */
    p.removeWidgetDesktopStorage = function(widgetId) {
        var _self = this;

        if(!_self.personalDesktop[widgetId]) {
            return false;
        }
        return delete _self.personalDesktop[widgetId];
    };

    /**
     * Resets storage objects to default state
     */
    p.clearStorage = function() {
        var _self = this;

        // Reset personal desktop
        _self.personalDesktop = _self.initialDesktop;
        _self.storage.set('personalDesktop', _self.personalDesktop);

        // Reset My widgets
        _self.localWidgets = _self.initialWidgets;
        _self.storage.set('localWidgets', _self.localWidgets);

        // Re-setup
        _self.setupPersonalDesktop();
        _self.setupMyWidgets();
    };


    /***
     * Loads and creates new Widget
     * - Loads from localStorage if widget exists there
     * - Other vice tries to load from server
     * - TODO: Load error handling
     * @param widget Widget name
     */
    p.launchWidget = function(widget, attributes, successCallback) {
        var _self = this;

        // Merge widget settings
        attributes = $.extend(true,{},_self.widgetSettings, attributes);

        // Make sure id is set
        if(attributes.settings.id == '') {
            attributes.settings.id = widget +'-'+ Math.floor(Math.random()*1000);
            attributes.settings.title = widget + 'Widget';
        }

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

            var newWidget = _self.createWidget(widget, attributes);
            if(typeof successCallback == "function") {
                successCallback(newWidget);
            }
        } else {
            var filename = _self.widgetsPath +'widget.' + widget + '.js?'+ new Date().getTime();

            // Make sure the widget is loaded..
            head.load(filename, function () {
                var newWidget = _self.createWidget(widget, attributes);
                if(typeof successCallback == "function") {
                    successCallback(newWidget);
                }
            });
        }

        _self.meny.close();
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
        var widgetName = attributes.settings.id;
        var attributesHtml = (attributes ? ' data-attributes=\''+ JSON.stringify(attributes) +'\'' : '');
        var elem = '<div class="widget widget-'+ widget +'" style="left:'+ attributes.position.left +'px;top:'+attributes.position.top +'px;" data-object="Widget'+ widget +'" data-name="'+ widgetName +'"'+ attributesHtml +'></div>';
        $(elem).appendTo(_self.gJQ('.desktop')).on('mousedown', function(){_self.bringFront($(this).data('name'));});

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

        // Update default widget class name
        attributes.widget = widget;

        // Save widget to desktopStorage
        _self.updateWidgetDesktopStorage(widgetName, attributes);

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

    /***
     * Creates left side meny object
     */
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
    };

    /**
     * Called when browser is closed
     * - Save personal desktop object
     */
    p.unloadSiteEvent = function() {
        var _self = this;

        // Save desktop
        _self.storage.set('personalDesktop', _self.personalDesktop);
        // Save Widgets
        _self.storage.set('localWidgets', _self.localWidgets);

    };

    p.toString = function() {
        return "XevoSite["+ this._name +"]";
    };

    $b.XevoSite = XevoSite;
}());