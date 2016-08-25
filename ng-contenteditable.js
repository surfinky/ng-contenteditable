/*
 *
 * https://github.com/cathalsurfs/ng-contenteditable
 *
*/

var ngContentEditable = angular.module('ngContentEditable', []);

ngContentEditable.service('editable.configService', function () {
    return {
        VERSION: '0.9.11',
        DEBUG_MODE: false, // NOTE: Set false for production.
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
        controller: function ($scope, $element) {
            $scope.$isNgContentEditable = true; // Provide to child scopes for use in custom directives.
        },
        link: function (scope, element, attrs, ngModel) {

            if (!ngModel) {  // Do not initialize if data model not provided.
                throw "Model data is required.";
                return;
            }

            element.attr('contenteditable', 'true');

            ngModel.$render = function () { // Update editable content in view.
                element.html(ngModel.$viewValue || element.html()); // Get model view value or default to element template.
                $compile(element.contents())(scope);
            };

            var _getViewContent = function () { // Write to data model.
                var html = element.html();
                ngModel.$setViewValue(html);
            };

            var _stripNodes = function (selector) {
                var nodes = element[0].querySelectorAll(selector);
                for (var i=0; i<nodes.length; i++) { // Unfortunate yet robust way to iterate over NodeList non-array.
                    angular.element(nodes[i]).remove();
                }
            };

            var _updateScope = function (opts) { // Magic.
                var opts = opts || {
                    compile: false,
                    wait: false
                };

                _stripNodes('meta');
                _stripNodes('style');
                _stripNodes('script');
                _stripNodes('span:empty');

                var updateFn = function () {
                    if (scope.$root.$$phase === null) scope.$apply(_getViewContent); // Only call $apply when $digest cycle is completed.
                    if (opts.compile) $compile(element.contents())(scope);
                };

                if (opts.wait) {
                    setTimeout(function () {
                        updateFn();
                    }, config.SCOPE_UPDATE_TIMEOUT || 100);
                } else {
                    updateFn();
                }
            };

            var _insertNode = function (node, event) {
                var caret = range.captureRange(event);
                range.setCachedRange(caret);
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

                if (utils.isValidURL(textData)) {
                    var handler = drag.getDropHandlerObject('text/uri-list');
                    if (!handler) return callback({ error: config.ERRORS.HANDLER_NOT_DEFINED, data: 'text/uri-list', types: types });
                    var node = _insertNode(handler.node, event); // Insert node prior to data upload.
                    drag.triggerFormatHandler(handler, data); // NOTE: Invoke custom handler (normally defined in your directive).
                    if (typeof (callback) === 'function') callback({ error: false, data: textData, types: types });
                    _updateScope({ compile: true });
                    return false;
                }

                if (filesData.length) {
                    var file = filesData[0]; // TODO: Implement queue system to handle list of files.

                    var handler = drag.getDropHandlerObject(file.type);
                    if (!handler) return callback({ error: config.ERRORS.HANDLER_NOT_DEFINED, data: file.type, types: types });

                    var node = _insertNode(handler.node, event); // Insert node prior to data upload.
                    _updateScope({ compile: true });

                    if (handler) {
                        drag.processFile(file).then(function (data) {
                            drag.triggerFormatHandler(handler, data); // NOTE: Invoke custom handler (usually defined in your custom directive definition body).
                            if (typeof (callback) === 'function') callback({ error: false, data: filesData, types: types });
                            _updateScope();
                        });
                    }
                    return false;
                }

                try { // When we have a drop event. // TODO: Refactor for 'paste' event handler.
                    var caret = range.captureRange(event);
                    if (_dragEvent) range.deleteContents();
                    range.setCachedRange(caret);
                    range.insertNode( angular.element( data ) );
                    range.clearSelection();
                } catch (error) {
                    console.error(error);
                    return true;
                }

                _updateScope({ compile: true });
                _dragEvent = null;
                return false;

            };

            var _dragEvent = null;

            ((element)
                .bind('click mouseup keyup focus input change', function (event) {
                    _updateScope();
                    commands.updateStatus();
                })
                .bind('mousedown', function (event) {
                    element.attr('contenteditable', 'true'); // Force editable.
                })
                .bind('blur', function (event) {
                    _updateScope({ updateScope: true, updateStatus: true });
                    range.clearSelection();
                })
                .bind('dragstart', function (event) {
                    /*if (config.DISABLE_RANGE_OVER_EDITABLE_COMPONENT && range.getEditableComponents()) { // Prevent user from dragging range containing editable-component directives!
                        event.preventDefault();
                        return false;
                    }*/
                    var _range = range.captureRange(event);
                    range.setCachedRange(_range);
                    _dragEvent = event;
                    //if (event.target.nodeType === 1) drag.setElement(event.target); // TODO: Required?
                    drag.setElement(event.target);
                })
                .bind('dragover', function (event) {
                    return true;
                })
                .bind('drop', function (event) {

                    var component = drag.getElement();

                    if (component && component.nodeType === 3) {
                        _updateScope({ compile: true, wait: 1000 });
                        drag.setElement(null);
                        return true;
                    }

                    event.preventDefault();

                    var data = drag.getData(event, { type: 'text/editable-component' }) || drag.getData(event, { type: 'text/html' });

                    if (component) { // TODO: See https://developer.mozilla.org/en/docs/Web/API/Node/nodeType
                        var placeholder = angular.element('<span />'); // TODO: We need to wrap the component for scope?
                        var caret = range.captureRange(event); // Get the caret range from the drop event.
                        range.setCachedRange(caret); // Save the range.
                        range.insertNode(placeholder[0]); // Insert the node at the saved range position.
                        placeholder.append( angular.element(component) ); // Coerse angular element and append to placeholder.
                        // TODO: drag.removeElement(); // Remove the original element cleanly.
                        drag.setElement(null);
                        _updateScope({ compile: true }); // A sprinkling of fairy dust.
                        return false;
                    }

                    return _processData(event, function onProcessCompleted (result) {
                        utils.triggerErrorHandler(result, scope);
                        return false;
                    });
                })
                .bind('paste', function (event) {
                    /*return _processData(event, function onProcessCompleted (result) { // Callback after drag data is processed (e.g. file upload).
                        utils.triggerErrorHandler(result, scope);
                        return false;
                    });*/
                    _updateScope({ compile: true, wait: 1000 }); // Wait a second...
                    return true;
                })
            );

			// NOTE: ngContentEditable will initialize contents based on ng-model data or default to existing content within directive element.
		}
    };

}]);

ngContentEditable.service('editable.dragHelperService', ['editable.utilityService', 'editable.configService', '$q', '$document', function (utils, config, $q, $document) {

    var _registeredDropTypes = {},
        _dragElement = null;

    $document.on('dragstart', function (event) {
        // TODO
    });

    return {
        getData: function (event, opts) {
            var opts = opts || {
                    type: 'text/html'
                },
                data = null;
            if (event && event.dataTransfer) data = event.dataTransfer.getData(opts.type);
            if (!data.length) return null;
            return data;
        },
        setElement: function (element) {
            _dragElement = element;
            return _dragElement;
        },
        getElement: function (reset) {
            if (reset === true) _dragElement = null;
            return _dragElement;
        },
        removeElement: function (element) {
            var el = element || _dragElement;
            angular.element(el).remove();
            _dragElement = null;
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
        },
        getDropHandlerObject: function (type) {
            try {
                var handler = _registeredDropTypes[type];
                return {
                    node: angular.element(handler.node[0].cloneNode(true)),
                    format: handler.format
                };
            } catch (error) {
                console.error(error);
                return;
            }
        }
    };

}]);

ngContentEditable.service('editable.rangeHelperService', ['editable.configService', '$document', function (config, $document) {

    var _cachedRange = null;

    $document.on('selectionchange', function (event) { // Save current range to mitigate index size error using getRangeAt(0)
        var sel = window.getSelection && window.getSelection();
        if (sel && sel.rangeCount > 0) {
            _cachedRange = sel.getRangeAt(0);
        };
    });

    return {
        _captureRange: function (event) {
            var range = null;
            if (event.clientX && event.clientY && !event.rangeParent && !event.rangeOffset) { // Chrome (etc)
                range = document.caretRangeFromPoint(event.clientX, event.clientY);
            }  else { // Mozilla
                range = document.createRange();
                range.setStart(event.rangeParent, event.rangeOffset); // Set starting point using the rangeParent and rangeOffset properties of the mouse event (Mozilla).
            }
            return range;
        },
        captureRange: function (event) {
            var range;
            if (typeof document.caretPositionFromPoint != "undefined") { // Mozilla
                var position = document.caretPositionFromPoint(event.clientX, event.clientY);
                range = document.createRange();
                range.setStart(position.offsetNode, position.offset);
                // TODO: range.collapse(true);
            } else if (typeof document.caretRangeFromPoint != "undefined") { // Chrome
                range = document.caretRangeFromPoint(event.clientX, event.clientY);
            } else if (typeof document.body.createTextRange != "undefined") { // MSIE
                range = document.body.createTextRange();
                range.moveToPoint(x, y);
            }
            return range;
        },
        addRange: function (range) {
            var selection = this.getSelection();
            selection.addRange(range);
            return range;
        },
        insertNode: function (node) {
            if (!_cachedRange || !node) return null;
            if (typeof (node.attr) === 'function') {
                _cachedRange.insertNode(node[0]);
            } else {
                _cachedRange.insertNode(node);
            }
            _cachedRange.collapse(true);
            return _cachedRange;
        },
        clearSelection: function () {
            var sel = this.getSelection();
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
        cloneContents: function () {
            if (_cachedRange && _cachedRange.cloneContents) {
                var contents = _cachedRange.cloneContents();
                if (contents.length) return contents;
            }
            return null;
        },
        deleteContents: function () {
            if (_cachedRange) _cachedRange.deleteContents();
        },
        getCachedRange: function () {
            return _cachedRange; // NOTE: See "selectionchange" event.
        },
        setCachedRange: function (range) {
            if (range) return _cachedRange = range;
        },
        getSelectionNode: function () {
           var node = this.getSelection().anchorNode;
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

ngContentEditable.service('editable.utilityService', ['editable.configService', '$window', '$document', function (config, $window, $document) {

    var _isDirty = false;

    return {
        isValidURL: function (url) {
            try {
                var obj = new window.URL(url);
                if (obj && obj.href) return obj.href;
            } catch (error) {
                console.warn(error);
            }
            return null;
        },
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
            if (typeof (scope.$ngContentEditableError) === 'function') scope.$ngContentEditableError(data);
        },
        getConfig: function () {
            return config;
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

ngContentEditable.directive('editableComponent', ['editable.dragHelperService', 'editable.rangeHelperService', 'editable.configService', function (drag, range, config) {
    return {
        restrict: 'C',
        link: function (scope, element, attrs) {
            ((element)
                .attr('contenteditable', false)
                .bind('dragstart', function (event) {
                    if (scope.$isNgContentEditable) {
                        drag.setElement(element);
                        return true;
                    }
                    event.dataTransfer.setData('text/editable-component', element[0].outerHTML);
                    return true;
                })
            );
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
