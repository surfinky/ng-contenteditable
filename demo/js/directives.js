/* NOTE:
 *
 * Here are a few "custom" directives, defined for the purposes of this demo project.
 *
 */

var EditorDirectives = angular.module('EditorDirectives', ['ngContentEditable']);

EditorDirectives.directive('editable', function () { // Add additional behavior to show / hide custom toolbar for editables.

    /* NOTE:
     *
     * Since ngContentEditable encourages you to define your own user interface,
     * it's up to you how, when and where you provide for user interaction.
     *
     * Editable regions are defined by simply associating a class name with any
     * elements you want to make editable, within your view. For example:
     *
     *
     * <div class="editable" data-ng-model="your.data.model">Some default static content...</div>
     *
     *
     * If your model data is not available, ngContentEditable will default to
     * whatever static content you have contained within your element.
     *
     * As such, you can have editables within ng-repeat blocks etc.
     *
     * Here, we create our own directive to "extend" the behavior of existing
     * editable regions, when the user interacts, to determine when to show or hide
     * our custom toolbar for this demo application.
     *
     */

    var _showFirstTimeHint = false, // TODO: Set to true for production.
        $toolbar = $('#editable-toolbar');

    return {
        restrict: 'C',
        link: function (scope, element, attrs) {

            $(element).hide().fadeIn();

            element.bind('focus mousedown keypress', function (event) {
                _hasFocus = true;
                _mouseLeave = false;
                $toolbar.removeClass("hide").fadeIn();

                if (_showFirstTimeHint) { // Draw attention to toolbar on first interaction with editable region.
                    _showFirstTimeHint = false;
                    $toolbar.popover({
                        animation: true,
                        placement: 'bottom',
                        title: '<i class="fa fa-info"></i> &nbsp; <b>Custom toolbar</b>',
                        content: '<p><b>Hey!</b> Use me to update your text selections.</p><p>This is an example of a custom toolbar interface, making use of editable-command directive for command buttons (above).</p>',
                        html: true,
                        trigger: 'manual',
                        container: 'body' // This is important or else we pollute the editable region content!
                    }).popover('show');
                    setTimeout(function () { $toolbar.popover('hide'); }, 5000);
                }

            });
            element.bind('blur', function (event) {
                _hasFocus = true;
                _mouseLeave = false;
                $toolbar.fadeOut();
            });
        }
    };

});

EditorDirectives.directive('editableControl', function () { // Add additional behavior to existing editable-control directives to show / hide custom toolbar.

    /* NOTE:
     *
     * Out of the box, you get the "editableControl" directive, which can be
     * implemented within your view as per the following example:
     *
     *
     * <a class="editable-control" data-command="bold" data-active="active" href="#">Make selection bold!</a>
     *
     *
     * In this example, we want to show and hide a toolbar containing a bunch of
     * editableControls - so we effectively extend editableControl with this
     * custom directive to create our toolbar and its behavior.
     *
     */

    return {
        restrict: 'C',
        link: function (scope, element, attrs) {

            element.bind('click', function (event) {

                if (element.attr('data-command') === 'fontsize') {

                    $(element).popover({ // Do custom popup behavior...
                        animation: true,
                        placement: 'bottom',
                        title: '<i class="fa fa-font"></i> &nbsp; <b>Change font size</b>',
                        content: 'Add controls...',
                        html: true,
                        container: 'body' // This is important or else we pollute the editable region content!
                    }).popover('show');

                }

                if (element.attr('ng-click') === 'saveAll()') {

                    $(element).popover({ // Do custom popup behavior...
                        animation: true,
                        placement: 'bottom',
                        title: '<i class="fa fa-floppy-o"></i> &nbsp; <b>Saved</b>',
                        content: 'Refresh the page to validate your saved changes...',
                        html: true,
                        container: 'body' // This is important or else we pollute the editable region content!
                    }).popover('show');

                }

            });

        }
    };

});

EditorDirectives.directive('img', ['editable.dragHelperService', function (drag) {

    /* NOTE:
     *
     * This is an example of a custom directive for the IMG tag.
     *
     * First we inject dragHelperService and register a drop handler for the
     * target MIME types we intend to generically handle with this directive.
     * A good place to do this is within the constructor, as below.
     *
     * Then, in the linking phase for this directive, we check if
     * we're in a content editable region. This can be applied to any existing
     * directives you have created.
     *
     * You can effectively use this pattern to create "plugin" directives for
     * ngContentEditable!
     *
     * TODO: Provide some more feature rich examples of this in future, for
     * example a directive to TABLE tag, to allow user to add rows / columns
     * etc. would be one idea.
     *
     */

    drag.registerDropHandler({ // Register a custom drop handler for this element.
        types: ['image/jpeg', 'image/png', 'image/gif'],
        node: '<img src="./img/loading.gif" />',
        format: function (data) { // Here we can play with the formatting of the drop element.
            var node = this.node; // This is the dropped element.
            node.attr('src', data.result);
            node.attr('title', data.filename);
        }
    });

    return {
        restrict: 'E',
        link: function (scope, element, attrs) {

            /* TODO: Testing resizable custom directive...

            var resizable = false;

            var initResizable = function () {
                $(element).resizable({
                    aspectRatio: true,
                    create: function (event, ui) {
                        resizable = true;
                    }
                });
            };

            if (scope.$isNgContentEditable) initResizable();

            element.bind('dragstart', function (event) {
                try {
                    $(element).resizable('destroy');
                } catch (error) {
                    console.error(error);
                } finally {
                    resizable = false;
                }
            });

            element.append('<span style="display: block; z-index: 1000; position: absolute; background: red; width: 100px; height: 100px;">hello</span>')

            element.bind('dragend', function (event) {
                if (scope.$isNgContentEditable && !resizable) initResizable();
            });*/

            element.bind('mouseover', function (event) {

                if (scope.$isNgContentEditable) { // If this directive is contained within an ng-editable region...

                    $(element).popover({ // Do custom popup behavior...
                        animation: true,
                        placement: 'left',
                        title: '<i class="fa fa-info"></i> &nbsp; <b>IMG</b>',
                        content: 'This is an example of <b>custom behavior</b> when a directive for the &lt;IMG&gt; tag is <b>contained within an editable region</b>. <br /><br />For example, you could expose your own functionality, to provide the user with controls for editing this element specifically.',
                        html: true,
                        trigger: 'hover',
                        delay: { show: 100, hide: 1 },
                        container: 'body' // NOTE: Container must be "body" or else editable region content gets polluted.
                    }).popover('show');

                }
            });

            element.bind('mousedown mouseleave dragstart', function (event) {
                if (scope.$isNgContentEditable) {
                    element.attr("contenteditable", true).addClass('editable-allow-select'); // Enables image resizing in Mozilla (note may not always want contenteditable true behavior on this element).
                    $(element).popover('hide');
                }
            });
        }
    };

}]);

EditorDirectives.directive('myCustomDirective', ['editable.dragHelperService', function (drag) {

    /* NOTE:
     *
     * This is an example of a generic custom directive.
     *
     * In this case, we don't register any drop handlers. We just check within
     * the linking function if in editable mode and behave differently, for
     * the purposes of this demo...
     *
     */

    return {
        restrict: 'A',
        scope: false,
        link: function (scope, element, attrs) {

            var data = JSON.parse(element.attr('data-editable') || null);
            var count = (data && data.count) ? data.count : 0; // Demo click count for this directive instance.

            if (scope.$isNgContentEditable && count === 0) {
                $(element).hide().html('<i class="fa fa-info"></i> Dragged in editable region!').fadeIn();
            }

            var updateCount = function () {
                count+=1;
                element.attr('data-editable', JSON.stringify({ count: count }));
                return count;
            };

            element.bind('click', function (event) {

                event.preventDefault();

                var content;

                if (scope.$isNgContentEditable) { // If this directive is contained within an ng-editable region...
                    element.html('<i class="fa fa-info-circle"></i> You clicked me ' + updateCount() + ' time' + ((count>1) ? 's' : '') + ' in edit mode!');
                } else {
                    element.html('<i class="fa fa-check"></i> Clicked! Now, drag me... :-)');
                }

                if (!scope.$isNgContentEditable) { // Prevent additional popover flicker in case of mouseover within contenteditable.
                    $(element).popover({ // Do custom popup behavior...
                        animation: true,
                        placement: 'left',
                        title: '<i class="fa fa-info"></i> &nbsp; <b>Custom directive!</b>',
                        content: 'This is an example of a <b>custom</b> directive instance. Drag me to an editable region to see how my behavior changes dynamically.',
                        html: true,
                        trigger: 'manual',
                        delay: { show: 100, hide: 1 },
                        container: 'body' // This is VERY important or else we pollute the editable region content!
                    }).popover('show');
                }

                return false;
            });

            element.bind('mouseover', function (event) {
                if (scope.$isNgContentEditable) {
                    $(element).popover({ // Do custom popup behavior...
                        animation: true,
                        placement: 'left',
                        title: '<i class="fa fa-info"></i> &nbsp; <b>Custom directive!</b>',
                        content: 'We show <b>completely different</b> behavior when directive is contained within an editable region!',
                        html: true,
                        trigger: 'manual',
                        delay: { show: 100, hide: 1 },
                        container: 'body' // This is important or else we pollute the editable region content!
                    }).popover('show');
                }
            });

            element.bind('mouseleave dragstart', function (event) {
                $(element).popover('hide');
            });
        }
    };

}]);

EditorDirectives.directive('a', ['editable.configService', 'editable.dragHelperService', 'editable.utilityService', function (config, drag, utils) {

    /* NOTE:
     *
     * This is an example of a custom directive for the A tag.
     *
     * In this case, we register a drop handler, to accept zip MIME types.
     * The "types" property is an array - so you can support as many mime
     * types as you like, per drop handler.
     *
     */

    drag.registerDropHandler({ // Register a custom drop handler for this directive / element.
        types: ['application/zip'],
        node: '<a href="#" alt="application/zip"><img src="./img/loading.gif" /></a>',
        format: function (data) {
            var node = this.node;
            node.attr('href', data.result);
            node.html(data.filename);
            node.addClass('editable-component'); // NOTE: Prevents user creating a selection range within this element.
        }
    });

    drag.registerDropHandler({ // Register another drop handler for this directive / element.
        types: ['text/uri-list'], // NOTE: This is a default text/uri-list MIME type.
        node: '<a href="#" alt="text/uri-list">Link...</a>',
        format: function (data) {
            var node = this.node;

            try {
                if (data.split('https://www.youtube.com/watch?v=').length > 1) { // Youtube detection and embed iframe.
                    debugger;
                    var embedYoutubeId = data.split('https://www.youtube.com/watch?v=')[1].split('&')[0],
                        embedYoutubeNode = angular.element([
                            '<span class="editable-custom-youtube">',
                                '<div class="mask"></div>',
                                '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/' + embedYoutubeId + '?rel=0" frameborder="0"></iframe>',
                            '</span>'].join(''));
                    embedYoutubeNode.addClass('editable-component');
                    embedYoutubeNode.addClass('editable-allow-select');
                    node.replaceWith(embedYoutubeNode);
                    return;
                }
            } catch (error) {
                console.error(error);
            }

            node.attr('href', data);
            node.html(data);
        }
    });

    return {
        restrict: 'E',
        link: function (scope, element, attrs) {

            if (scope.$isNgContentEditable) {
                if (!element.hasClass( config.DRAG_COMPONENT_CLASS )) element.attr('contenteditable', true);
            }

            element.bind('mouseover', function (event) {

                if (scope.$isNgContentEditable) {

                    $(element).popover({ // Do custom popup behavior...
                        animation: true,
                        placement: 'top',
                        title: '<i class="fa fa-link"></i> &nbsp; <b>This is a link!</b>',
                        content: '<h5><b>' + element.attr('href') + '</b></h5>Try dragging a link from another page, or the location bar (Firefox) in your browser window...',
                        html: true,
                        trigger: 'manual',
                        delay: { show: 100, hide: 1 },
                        container: 'body' // This is important or else we pollute the editable region content!
                    }).popover('show');

                }

            });

            element.bind('mouseup mouseleave dragstart', function (event) {
                $(element).popover('hide');
            });

            element.bind('click', function (event) {
                if (scope.$isNgContentEditable) {
                    event.preventDefault();
                }
            });

        }
    };

}]);
