(function() {

    /***
     * CodePanel Widget for XevoLve Bind.JS
     *
     * CodePanel uses CodeMirror (http://codemirror.net/)
     * Wrapped by Marko Kurjonen 2014
     *
     */
    var WidgetCodePanel = function () {
        this.initialize();
    };

    var p = WidgetCodePanel.prototype = new $b.Widget();

    p.settings = {
        id: "CodePanel",
        title: "Code your own Widget"
    };
    p.widget = 'CodePanel';
    p.css = '.fileToLoad{display:none!important;cursor: pointer;width:20px;height:20px;opacity: 0; -moz-opacity: 0;filter:progid:DXImageTransform.Microsoft.Alpha(opacity=0)}.CodePanel-toolbar{margin: 3px;}.widget-CodePanel{resize: both;}.CodeMirror {min-height: 200px;height: auto;overflow: hidden;}';
    p.editor = null;
    p.template = '<div class="btn-toolbar CodePanel-toolbar" role="toolbar" ><div class="btn-group btn-group-xs" role="group"><button type="button" class="btn btn-default btn-new" title="New [Ctrl+N]"><i class="fa fa-file-o"></i></button><button type="button" class="btn btn-default btn-open" title="Open [Ctrl+O]"><i class="fa fa-folder-open-o"></i></button><button type="button" class="btn btn-default  btn-save" title="Save [Ctrl+S]"><i class="fa fa-floppy-o"></i></button></div><div class="btn-group btn-group-xs" role="group"><button type="button" class="btn btn-default btn-export" title="Export"><i class="fa fa-upload"></i></button><input type="file" class="btn fileToLoad" /><button type="button" class="btn btn-default btn-import" title="Import"><i class="fa fa-download"></i></button></div><div class="btn-group btn-group-xs" role="group"><button type="button" class="btn btn-default btn-settings" title="Settings"><i class="fa fa-cogs"></i></button></div><div class="btn-group btn-group-xs pull-right" role="group"><button type="button" class="btn btn-default btn-run" title="Run [Ctrl+Enter]"><i class="fa fa-play"></i></button></div></div>';

    p.initialWidget = 'Empty';
    p.defaultContent = '';
    p.widgetSettings = {};

    p.Widget_initialize = p.initialize;
    p.Widget_elementCreated = p.elementCreated;

    p.initialize = function() {
        this.Widget_initialize();

        var _self = this;
        $(this).off("objectCreated");

        $(this).on("objectCreated", function () {
            head.load([
                window.site.settings.paths.scripts +"codemirror.javascript.js"],
                function(){_self.elementCreated();});
        });

    };
    p.elementCreated = function() {
        var _self = this;
        _self.Widget_elementCreated();

        // Get default widget contents if not set
        if(_self.defaultContent == '') {
            var widgetStorageObject = window.site.getWidgetStorageObject(_self.initialWidget);
            if(widgetStorageObject) {
                _self.defaultContent = widgetStorageObject.code;
                _self.widgetSettings = widgetStorageObject.settings;
            }
        }
        var _selfDOM = _self.gJQ()[0];

        _self.editor = CodeMirror(_selfDOM, {
            lineNumbers: true,
            value: _self.defaultContent,
            mode:  "javascript",
            extraKeys: {
                'Ctrl-Enter': function(cm) {
                    _self.runCode();
                },
                'Ctrl-N': function(cm) {
                    _self.buttonNewClicked();
                },
                'Ctrl-O': function(cm) {
                    _self.buttonOpenClicked();
                },
                'Ctrl-S': function(cm) {
                    _self.buttonSaveClicked();
                }
            }
        });

        // Toolbar events
        _self.gJQ('.CodePanel-toolbar .btn-new').on('click', function() {_self.buttonNewClicked();});
        _self.gJQ('.btn-open').on('click', function() {_self.buttonOpenClicked();});
        _self.gJQ('.btn-save').on('click', function() {_self.buttonSaveClicked();});
        _self.gJQ('.btn-export').on('click', function() {_self.buttonExportClicked();});
        //_self.gJQ('.btn-settings').on('click', function() {_self.buttonSettingsClicked();});
        _self.gJQ('.btn-import').on('click', function() {_self.gJQ('.fileToLoad').trigger('click');});
        _self.gJQ('.fileToLoad').on('change', function() {_self.buttonImportClicked();});
        _self.gJQ('.btn-run').on('click', function() {_self.runCode();});

        // Create settings popover
        var options = {
            html: true,
            placement: 'bottom',
            title: 'Settings',
            content: function(){
                return _self.getSettingsForm('code-settings-form', _self.widgetSettings);
            }
        };
        _self.gJQ('.CodePanel-toolbar .btn-settings').popover(options);

        _self.gJQ('.CodePanel-toolbar').on('click', '.settings-form-cancel', function(e){
            _self.gJQ('.CodePanel-toolbar .btn-settings').popover('hide');
        });
        _self.gJQ('.CodePanel-toolbar').on('submit', '.code-settings-form', function(e){
            e.preventDefault();
            _self.saveCodeSettings();
            return false;
        });
    };

    // Toolbar button events
    p.buttonNewClicked = function() {
        var _self = this;
        _self.editor.setValue(_self.defaultContent);
    };
    p.buttonOpenClicked = function() {
        var _self = this;
        console.log("Not implemented!");
    };
    p.buttonSaveClicked = function() {
        var _self = this;

        var code = _self.editor.getValue();
        var attributes = {
            widget: _self.widgetSettings.id,
            settings: _self.widgetSettings,
            code: code
        };

        window.site.updateWidgetStorageObject(_self.widgetSettings.id, attributes);
    };
    p.buttonExportClicked = function() {
        var _self = this;

        var textToWrite = _self.editor.getValue();
        var textFileAsBlob = new Blob([textToWrite], {type:'text/javascript'});
        var fileNameToSaveAs = 'widget.'+ _self.widgetSettings.id +'.js';

        var downloadLink = document.createElement("a");
        downloadLink.download = fileNameToSaveAs;
        downloadLink.innerHTML = "Download File";

        downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
        downloadLink.onclick = function(e) {document.body.removeChild(e.target);};
        downloadLink.style.display = "none";
        document.body.appendChild(downloadLink);

        downloadLink.click();
    };
    p.buttonImportClicked = function() {
        var _self = this;

        var fileToLoad = _self.gJQ(".fileToLoad")[0].files[0];

        var fileReader = new FileReader();
        fileReader.onload = function(fileLoadedEvent)
        {
            var textFromFileLoaded = fileLoadedEvent.target.result;
            _self.editor.setValue(textFromFileLoaded);
        };
        fileReader.readAsText(fileToLoad, "UTF-8");
    };


    p.saveCodeSettings = function() {
        var _self = this;
        var newVal = "";
        var settingsChanged = [];
        for(var i in _self.widgetSettings) {
            _self.widgetSettings[i]  = _self.gJQ('.code-settings-form input[name="'+i+'"]').val();

        }
        _self.gJQ('.CodePanel-toolbar .btn-settings').popover('hide');
    };

    /***
     * Evals the code and creates widget out of it..
     * TODO: You should be able to do multiple versions of same object...
     */
    p.runCode = function() {
        var _self = this;
        var code = _self.editor.getValue();

        var objectExists = $b.OM.find(_self.widgetSettings.id);
        var attributes = {
            widget: _self.widgetSettings.id,
            settings: _self.widgetSettings,
            position: {}
        };

        if(objectExists != null) {
            // If exists, save position
            attributes.position = objectExists.position;

            // Destroy
            objectExists.destroyObject();
        }

        // Evaluate the code
        eval(code);

        // Launch Widget
        window.site.createWidget(_self.widgetSettings.id, attributes);
    };

    p.toString = function() {
        return "WidgetCodePanel["+ this._name +"]";
    };

    $b.WidgetCodePanel = WidgetCodePanel;
}());