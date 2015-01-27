(function() {

    /***
     * Base class for all widgets
     * @constructor
     */
    var Widget = function () {
        this.initialize();
    };

    var p = Widget.prototype = new $b.Element();

    p.Element_initialize = p.initialize;
    p.Element_killObject = p.killObject;

    p.template = '';
    p.css = '';
    p.widget = '';
    p.settings = {
        id: "Unknown",
        title: "Title",
        description: ""
    };
    p.position = {};
    p.editWidgetId = "CodePanel";
    p.dragEnabled = true;
    p.dragOffset = {};
    // TODO: p.resizeEnabled = true;

    p.initialize = function() {
        this.Element_initialize();

        var _self = this;

        head.load(['//maxcdn.bootstrapcdn.com/font-awesome/4.2.0/css/font-awesome.min.css']);

        $(this).on("objectCreated", function () {
            _self.elementCreated();
        });

    };

    p.elementCreated = function() {
        var _self = this;

        // Add Widget html
        var widgetHtml = (_self.css != "" ? '<style>'+ _self.css+'</style>' : '');
        widgetHtml += '<div class="widget-header"><span class="widget-settings-title">'+_self.settings.title +'</span><button class="widget-close pull-right"><i class="fa fa-times"></i></button><button class="widget-settings pull-right"><i class="fa fa-cog"></i></button><button class="widget-edit pull-right"><i class="fa fa-code"></i></button></div><div class="widget-content">'+ _self.template+'</div>';

        _self.gJQ().html(widgetHtml);

        // Create settings popover (bootstrap)
        var options = {
            html: true,
            placement: 'bottom',
            title: 'Widget settings',
            content: function(){
                return _self.getSettingsForm();
            }
        };
        _self.gJQ('.widget-settings').popover(options)
            .on('show.bs.popover', function(){_self.dragEnabled = false;})
            .on('hide.bs.popover', function(){_self.dragEnabled = true;});

        // Widget events
        _self.gJQ('.widget-close').on('click', function() {_self.destroyObject();});
        _self.gJQ('.widget-edit').on('click', function() {_self.openEditWidget();});
        _self.gJQ('.widget-header').on('click', '.settings-form-cancel', function(e){
            _self.gJQ('.widget-settings').popover('hide');
        });
        _self.gJQ('.widget-header').on('submit', '.widget-settings-form', function(e){
            e.preventDefault();
            _self.saveSettings();
            return false;
        });
        if(_self.dragEnabled) {
            _self.gJQ('.widget-header').on('mousedown', function (e) {
                if(_self.dragEnabled) {e.preventDefault();
                _self.dragStart(e.originalEvent);
                return false;}
            });
        }
    };

    /***
     * Returns settings html form for popover
     * @returns {string} Settings form html
     */
    p.getSettingsForm = function(formclass, settings) {
        var _self = this;
        formclass = formclass || "widget-settings-form";
        settings = settings || _self.settings;
        var output = '<form class="'+ formclass +'">';
        for(var i in settings) {
            output += '<div class="form-group">'+
            '<label>'+ i +'</label>'+
            '<input type="text" class="form-control" name="'+ i +'" value="'+ settings[i] +'" />'+
            '</div>';
        }
        output += '<button type="reset" class="btn btn-default btn-sm settings-form-cancel pull-right"><i class="fa fa-times"></i>&nbsp;Close</button><button type="submit" class="btn btn-default btn-sm settings-form-save"><i class="fa fa-floppy-o"></i>&nbsp;Save</button>'+
            '</form>';

        return output;
    };

    /***
     * Launched by settings save button
     * Updates settings array,
     * Updates html class 'widget-settings-{id}' html,
     * Calls 'settingsChanged', if settings has changed
     */
    p.saveSettings = function() {
        var _self = this;
        var newVal = "";
        var settingsChanged = [];
        var idChangedFrom = '';
        for(var i in _self.settings) {
            newVal = _self.gJQ('.widget-settings-form input[name="'+i+'"]').val();
            if(_self.settings[i] != newVal) {
                // We have to save old id
                if(i == 'id') {
                    idChangedFrom = _self.settings[i];
                }
                _self.settings[i] = newVal;
                _self.gJQ('.widget-settings-' + i).html(newVal);
                settingsChanged[i] = newVal;
            }
        }
        _self.gJQ('.widget-settings').popover('hide');

        if(settingsChanged.length > 0) {
            _self.settingsChanged(settingsChanged, idChangedFrom);
        }
    };

    /***
     * Called when settings has changed, override this in your on widgets
     * @param settings Object Changed values
     * @param oldId String Old widget id, if it has changed
     */
    p.settingsChanged = function(settings, oldId) {
        var _self = this;

        // Save widget settings
        var attributes = {settings: settings};
        window.site.updateWidgetDesktopStorage(oldId != '' ? oldId : _self.settings.id, attributes);
    };

    /***
     * Called when Edit button clicked
     * - Create edit widget (CodePanel)
     * - Import current widget settings+code into CodePanel
     */
    p.openEditWidget = function() {
        var _self = this;

        // Create
        var widgetStorageObject = window.site.getWidgetStorageObject(_self.settings.id);
        var code = (widgetStorageObject ? widgetStorageObject.code : false);
        var attributes = {
            widgetSettings: _self.settings,
            defaultContent: (code ? code : "Code could not be loaded..")
        };

        window.site.launchWidget(_self.editWidgetId, attributes);
    };

    /***
     * All drag functions for Widget
     * start, move, stop - Pretty self explanatory
     */
    p.dragStart = function(e) {
        var _self = this;
        var offset = _self.gJQ().offset();

        // Save current mouse offset from widget position
        _self.dragOffset = {top: e.clientY-offset.top, left: e.clientX-offset.left};

        // Add global events
        $(window).on('mousemove', function(e){_self.dragMove(e.originalEvent);});
        $(window).on('mouseup', function(e){_self.dragStop(e.originalEvent);});

        // We have to call bringFront because we prevented default mousedown events (normally site object does this)
        window.site.bringFront(_self._name);

        // Change cursor to move
        _self.gJQ().css('cursor', 'move');
    };

    p.dragMove = function(e) {
        var _self = this;
        // Update widget position
       _self.gJQ().css('top', e.clientY - _self.dragOffset.top). css('left', e.clientX - _self.dragOffset.left);
    };

    p.dragStop = function(e) {
        var _self = this;

        // Remove global events
        $(window).off('mousemove');
        $(window).off('mouseup');

        // Save current position of widget to desktop
        _self.position = _self.gJQ().offset();
        var updateAttributes = {
            position: _self.position
        };
        window.site.updateWidgetDesktopStorage(_self.settings.id, updateAttributes);

        // Restore cursor
        _self.gJQ().css('cursor', 'default');
    };

    /***
     * Override Element.killObject
     */
    p.killObject = function() {
        var _self = this;

        // Remove widget from desktop before killing it...
        window.site.removeWidgetDesktopStorage(_self.settings.id);

        // Call parent.killObject to finish the job!
        _self.Element_killObject();
    };

    p.toString = function() {
        return "Widget["+ this._name +"]";
    };

    $b.Widget = Widget;
}());