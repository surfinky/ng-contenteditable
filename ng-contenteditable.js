/*
 * ngContentEditable 0.1.9 - 2016
 *
 * Fancy contenteditable features for AngularJS.
 *
 * https://github.com/cathalsurfs/ng-contenteditable
 *
*/

var ngContentEditable = angular.module('ngContentEditable', []);

ngContentEditable.service('editable.configService', function () {
    return {
        VERSION: '0.9.9',
        DRAG_MOVE_CLASS: 'editable-dropped',
        DRAG_COMPONENT_CLASS: 'editable-component', // NOTE: This class name must be assigned to any directives working within editable regions.
        DISABLE_RANGE_OVER_EDITABLE_COMPONENT: false, // TODO: Set true for production.
        SCOPE_UPDATE_TIMEOUT: 10,
        RESTORE_STYLE_TIMEOUT: 100,
        ERRORS: {
            HANDLER_NOT_DEFINED: 1001
        },
        ALLOW_DIRTY_REFRESH: true, // NOTE: Set to false for production.
        ALLOW_DIRTY_REFRESH_STRING: 'Changes have not been saved! Are you sure you want to leave?'
    };
});

ngContentEditable.directive('editable', ['$compile', 'editable.dragHelperService', 'editable.rangeHelperService', 'editable.utilityService', 'editable.commandHelperService', 'editable.configService', function ($compile, drag, range, utils, commands, config) {

    return {
        scope: true, // Create new scope for each instance.
        restrict: 'C', // Only initialize on class names.
        require: '?ngModel',
        controller: function($scope, $element) {
            $scope.$ngContentEditable = $scope.$ngContentEditable || {  // Decorate directives (editable-component) within editable region with custom property.
                isInEditableContainer: function () {
                    // TODO
                    return true;
                },
                allowSelection: function () {
                    $element.attr("contenteditable", true).addClass('editable-allow-select'); // Enables image resizing in Mozilla (note may not always want contenteditable true behavior on this element).
                    return $element;
                }
            }
        },
        link: function (scope, element, attrs, ngModel) {

            if (!ngModel) return; // Do not initialize if data model not provided.

            element.attr('contenteditable', 'true');

            ngModel.$render = function () { // Update editable content in view.
                element.html(ngModel.$viewValue || element.html());
                $compile(element.contents())(scope);
            };

            var _getViewContent = function () { // Write to data model.
                var html = element.html();
                ngModel.$setViewValue(html);
            };

            var _updateScope = function (opts) {
                var opts = opts || {},
                    wait = opts.wait || false,
                    node = opts.compile,
                    updateFn = function () {
                        scope.$apply(_getViewContent);
                    };

                if (wait) {
                    setTimeout(function () {
                        updateFn();
                        if (node) $compile(node)(scope);
                    }, config.SCOPE_UPDATE_TIMEOUT || 100);
                } else {
                    updateFn();
                    if (node) $compile(node)(scope);
                }

                utils.isDirty(true);

            };

            var _insertNode = function (node, event) {
                utils.isDirty(true);
                range.captureRange(event);
                node.addClass(config.DRAG_MOVE_CLASS);
                range.insertNode(node);
                return node;
            };

            var _formatText = function (text) {
                if (text) return '<span>' +  text + '</span>';
                return null;
            };

            var _processData = function (event, callback) {

                var data = event.dataTransfer || event.clipboardData || null;

                if (!data) {
                    if (typeof (callback) === 'function') callback({ error: true, data: null, type: null });
                    return false;
                }

                var htmlData = data.getData('text/html'),
                    uriData = data.getData('text/uri-list'),
                    textData = data.getData('text'),
                    filesData = data.files,
                    types = data.types;

                data = _formatText(htmlData) || textData || uriData;

                if (!htmlData && uriData && textData && uriData === textData) { // NOTE: If, then assume this is a link! See https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Recommended_Drag_Types

                    var handler = drag.getDropHandlerObject('text/uri-list');
                    if (!handler) return callback({ error: config.ERRORS.HANDLER_NOT_DEFINED, data: 'text/uri-list', types: types });
                    var node = _insertNode(handler.node, event); // Insert node prior to data upload.


                    drag.triggerFormatHandler(handler, data); // NOTE: Invoke custom handler (normally defined in your directive).
                    if (typeof (callback) === 'function') callback({ error: false, data: filesData, types: types });

                    _updateScope({ compile: node });

                    return false;
                }

                if (filesData.length) {
                    var file = filesData[0]; // TODO: Implement queue system to handle list of files.

                    var handler = drag.getDropHandlerObject(file.type);
                    if (!handler) return callback({ error: config.ERRORS.HANDLER_NOT_DEFINED, data: file.type, types: types });

                    var node = _insertNode(handler.node, event); // Insert node prior to data upload.
                    _updateScope({ compile: node });

                    if (handler) {
                        drag.processFile(file).then(function (data) {
                            drag.triggerFormatHandler(handler, data); // NOTE: Invoke custom handler (usually defined in your custom directive definition body).
                            if (typeof (callback) === 'function') callback({ error: false, data: filesData, types: types });
                            _updateScope();
                        });
                    }
                    return false; // Prevent default browser behavior for files.
                }

                var sel = window.getSelection(),
                    r = (sel.rangeCount) ? sel.getRangeAt(0) : undefined,
                    contents = (r) ? r.cloneContents() : data;

                var node = _insertNode(angular.element(contents), event);

                if (_dragging) {
                    r.deleteContents();
                    _dragging = false;
                }

                sel.removeAllRanges();

                _updateScope({ compile: node });

                return false;

            };

            var _dragging = false;

            ((element)
                .bind('click', function (event) {
                    _updateScope(); // TODO: Testing...
                })
                .bind('input change', function (event) {
                    _updateScope();
                    commands.updateStatus();
                })
                .bind('mouseup keyup', function (event) {
                    commands.updateStatus();
                })
                .bind('mousedown', function (event) {
                    element.attr('contenteditable', 'true');
                })
                .bind('blur', function (event) {
                    _updateScope();
                    commands.updateStatus();
                    var sel = document.getSelection();
                    sel.removeAllRanges();
                })
                .bind('focus', function (event) {
                    _updateScope();
                    commands.updateStatus();
                })
                .bind('dragstart', function (event) {
                    if (config.DISABLE_RANGE_OVER_EDITABLE_COMPONENT && range.getEditableComponents()) { // Prevent user from dragging range containing editable-component directives!
                        event.preventDefault();
                        return false;
                    }
                    _dragging = true;
                })
                .bind('dragend', function (event) {
                    // TODO
                })
                .bind('drop', function (event) {
                    event.preventDefault();

                    var component = drag.getDragElement();

                    if (component) {
                        event.preventDefault();
                        var el = component[0],
                            r = range.captureRange(event),
                            placeholder = document.createElement('span');
                        el.parentNode.removeChild(el);
                        range.insertNode(placeholder);
                        placeholder.appendChild(el);
                        _updateScope();
                        return false;
                    }

                    return _processData(event, function (data) { // Callback after drag data is processed (e.g. file upload).
                        utils.triggerErrorHandler(data, scope);
                        return false;
                    });
                })
                .bind('paste', function (event) {
                    return _processData(event, function (data) { // Callback after drag data is processed (e.g. file upload).
                        utils.triggerErrorHandler(data, scope);
                        return false;
                    });
                })
            );

			// NOTE: ngContentEditable will initialize contents based on ng-model data or default to existing content within directive element.
		}
    };

}]);

ngContentEditable.directive('editableComponent', ['editable.dragHelperService', 'editable.rangeHelperService', 'editable.configService', function (drag, range, config) {
    return {
        restrict: 'C',
        link: function (scope, element, attrs) {
            ((element)
                .attr('contenteditable', false)
                .bind('dragstart', function (event) {
                    if (scope.$ngContentEditable) {
                        drag.setDragElement(element);
                        return true;
                    }
                    event.dataTransfer.setData('text/html', element[0].outerHTML);
                    // TODO: event.dataTransfer.setData('text/editable-component', element[0].outerHTML);
                    return true;
                })
            );
        }
    };
}]);

ngContentEditable.service('editable.utilityService', ['editable.configService', '$window', '$document', function (config, $window, $document) {

    var _isDirty = false;

    return {
        isDirty: function (flag) {
            if (flag === true || flag === false) _isDirty = flag;
            if (_isDirty && !config.ALLOW_DIRTY_REFRESH) {
                $window.onbeforeunload = $window.onunload = function (event) { return config.ALLOW_DIRTY_REFRESH_STRING; };
            } else {
                $window.onbeforeunload = $window.onunload = null;
            }
            return flag;
        },
        createUniqueId: function () { // GUID as per RFC-4122.
            return 'XXXXXXXX-XXXX-4XXX-YXXX-XXXXXXXXXXXX'.replace(/[XY]/g, function (chr) {
                var rnd = (Math.random()*16|0),
                    out = (chr === 'X') ? rnd : rnd & 0x3|0x8;
                return out.toString(16);
            });
        },
        triggerErrorHandler: function (data, scope) {
            if (data && data.error && console && console.log) console.log(data);
            if (typeof (scope.$ngContentEditable && scope.$ngContentEditable.onError) === 'function') scope.$ngContentEditable.onError(data);
        },
        getConfig: function () {
            return config;
        }
    };
}]);

ngContentEditable.service('editable.dragHelperService', ['$q', 'editable.utilityService', 'editable.configService', function ($q, utils, config) {

    var _registeredDropTypes = {},
        _dragElement = null;

    return {
        setDragElement: function (element) {
            _dragElement = element;
        },
        getDragElement: function (element, reset) {
            var _returnElement = _dragElement;
            if (reset !== false) _dragElement = null;
            return _returnElement;
        },
        processFile: function (file) {
            var deferred = $q.defer(),
                file = file,
                type = file.type,
                filename = file.name,
                reader = new FileReader();
            reader.onload = function (event) { // TODO: Error handling on failure and implement real file uploading.
                var data = {
                    result: event.target.result,
                    filename: filename,
                    type: type
                };
                setTimeout(function () { // Simulate file loading with 2 second delay for demo purposes... :-P
                    deferred.resolve(data);
                }, 2000);
            };
            reader.readAsDataURL(file); // NOTE: Temporary - implement support for file uploads.
            return deferred.promise;
        },
        registerDropHandler: function (o) {
            var types = o.types,
                node = angular.element(o.node),
                format = o.format;
            if (!(types && types.length && node && typeof (format) === 'function')) return;
            for (var x=0; x<types.length; x++) {
                var type = types[x];
                if (!_registeredDropTypes[type]) _registeredDropTypes[type] = {
                    node: node,
                    format: format
                };
            }
        },
        triggerFormatHandler: function (handler, data) {
            if (handler && typeof (handler.format) === 'function') handler.format(data);
            if (!(handler && handler.node && handler.node.addClass)) throw new Error('triggerFormatHandler() A valid format handler node is required.');
            handler.node.addClass(config.DRAG_MOVE_CLASS);
        },
        getDropHandlerObject: function (type) {
            try {
                var handler = _registeredDropTypes[type];
                return {
                    node: angular.element(handler.node[0].cloneNode(true)),
                    format: handler.format
                };
            } catch (error) {
                console.warn(error);
                return;
            }
        }
    };

}]);

ngContentEditable.service('editable.rangeHelperService', ['editable.configService', function (config) {

    var _range = null;

    return {
        captureRange: function (event) {
            if (document.caretRangeFromPoint && event.type != 'paste') {
                _range = document.caretRangeFromPoint(event.clientX, event.clientY);
            } else { // Mozilla.
                _range = document.createRange();
                _range.setStart(event.rangeParent, event.rangeOffset); // Set range starting point using the rangeParent and rangeOffset properties of the mouse event (Mozilla).
            }
            _range.collapse(false); // Collapse range to end of boundary point.
            var sel = window.getSelection();
            if (event.type === 'paste') _range = sel.getRangeAt(0);
            sel.removeAllRanges();
            sel.addRange(_range);
            return _range;
        },
        insertNode: function (node) {
            if (!_range || !node) return null;
            if (typeof (node.attr) === 'function') {
                _range.insertNode(node[0]);
            } else {
                _range.insertNode(node);
            }
            _range.collapse(true);
            return _range;
        },
        removeSelection: function () {
            var sel = window.getSelection ? window.getSelection() : document.selection;
            if (sel) {
                if (sel.removeAllRanges) {
                    sel.removeAllRanges();
                } else if (sel.empty) {
                    sel.empty();
                }
            }
        },
        getSelection: function () {
           return window.getSelection ? window.getSelection() : document.selection;
        },
        setSelection: function (range) {
            var sel = this.getSelection();
            sel.addRange(range);
        },
        getSelectionRange: function () {
            var sel;
            if (window.getSelection) {
                sel = window.getSelection();
                if (sel.rangeCount) return sel.getRangeAt(0);
            } else if (document.selection) { // IE
                return document.selection.createRange();
            }
            return null;
        },
        getSelectionNode: function () {
           var node = document.getSelection().anchorNode;
           return ((node && node.nodeType == 3) ? node.parentNode : node);
        },
        getEditableComponents: function () {
            var range = this.getSelectionRange(),
                contents = (range) ? range.cloneContents() : null,
                nodes = (contents) ? contents.querySelectorAll('.editable-component') : null;
            return (nodes && nodes.length) ? nodes : null;
        }
    };

}]);

ngContentEditable.factory('editable.commandHelperService', ['editable.utilityService', function (utils) {

    var commands = {};

    return {
        registerCommand: function (command, scope) {
            if (commands[command] === undefined) commands[command] = function () {
                try {
                    if (document.queryCommandState(command)) {
                        scope.setActive(true);
                    } else {
                        scope.setActive(false);
                    }
                } catch (error) {
                    //if (console && console.log) console.log(error);
                }
            };
        },
        executeCommand: function (command) {
            try {
                document.execCommand(command, false);
                if (commands[command]) commands[command]();
            } catch (error) {
                //if (console && console.log) console.log(error);
            }
        },
        updateStatus: function () {
            for (command in commands) commands[command]();
        },
        applyMarkup: function (markup) {
            document.execCommand('insertHTML', false, markup.split('$selection$').join(utils.getSelectionMarkup()));
        }
    };

}]);

ngContentEditable.directive('editableControl', ['editable.rangeHelperService', 'editable.commandHelperService', function (range, commands) {

    return {
        restrict: 'C',
        scope: {}, // Isolate scope.
        link: function (scope, element, attrs) {

            var activeClass = element.attr('data-active');

            scope.setActive = function (status) {
                if (status === true) element.addClass(activeClass);
                else element.removeClass(activeClass);
            };

            if (attrs.command) commands.registerCommand(attrs.command, scope);

            element.on('mousedown', function (event) {
                event.preventDefault();
                if (attrs.command) commands.executeCommand(attrs.command);
                if (attrs.markup) commands.applyMarkup(attrs.markup);
                var node = angular.element(range.getSelectionNode());
                if (node) node.triggerHandler('change'); // TODO: Better logic for bubbling nested elements to directive.
                return false;
            });

            element.on('click mouseup contextmenu', function (event) {
                event.preventDefault();
                return false;
            })

        }
    };

}]);
