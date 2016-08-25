var EditorApp = angular.module('EditorApp', ['EditorDirectives']);

EditorApp.factory('EditorStorage', ['editable.configService', function (config) {

    /* NOTE:
     *
     * For demo purposes, we're just gonna use a basic implementation for
     * LocalStorage to load / save our editable content.
     *
     * Because this demo uses ng-repeat for editable content regions, we
     * provide default data for first-time use and also dynamically added
     * editable regions...
     *
     */

    var STORAGE_ID = 'NG_CONTENTEDITABLE_STORAGE_' + config.VERSION || 0;

    return {
        get: function () {
            return (localStorage) ? JSON.parse(localStorage.getItem(STORAGE_ID)) : {};
        },
        put: function (data) {
            if (localStorage) localStorage.setItem(STORAGE_ID, JSON.stringify(data));
        },
        _default: function (title) {
            return '\
                <h2 class="page-headline">' + (title || 'First play, then work...') + '</h2>\
                <br />\
                <h4>This is an editable region!!!</h4>\
                <p>Do whatever you like in here. Use the toolbar (above) to make changes to text and what not...<p>\
                <p>If you are using a "proper" browser like <a href="http://getfirefox.com">Firefox</a>, you\'ll get resizing for images right out of the box. Otherwise, you\'ll have to implement a directive to provide this behavior for other, lesser browsers, like Chrome.</p>\
                <p>Try dragging stuff around and placing in this region, like other images on the page. Also, there are a number of widgets outside of this region (see below) which are implemented as directives. Interact with these <b>before</b> dropping into this (or any other) editable region. See what happens before and after.\
                <p>Also, you can drag and drop files from your local file system. Only certain file types are allowed for this demo.</p>\
                <p>And now, here\'s a pic of where I like to spend as much of my free time as possible...</p>\
                <img src="img/pitted.png" title="pitted.png" style="width: 200px; height: 200px;" />\
                <br /><br />';
        },
        _new: function (title, content) {
            return '\
                <h2 class="page-headline">' + (title || 'A new editable region...') + '</h2>\
                <br />\
                <h4>' + (content || 'Have fun, etc. :-)') + '</h4>\
                <p>Make changes! Drag and drop! Click save and refresh!</p>';
        }
    };

}]);

EditorApp.controller('EditorCtrl', ['$scope', 'EditorStorage', 'editable.configService', 'editable.utilityService', function ($scope, EditorStorage, config, utils) {

    /* NOTE:
     *
     * And now, the controller, for our demo application.
     *
     * Main thing to node here is defining the callback for $ngContentEditableError
     * on our application scope. We need a way to catch errors and handle / display
     * them, where appropriate.
     *
     * The configService is injected here, simply to access error constant values...
     *
     */

    var data = EditorStorage.get() || {
        content: [
            { content: EditorStorage._default() }
        ],
        index: {}
    };

    var content = $scope.content = data.content,
        index = $scope.index = data.index;

    $scope.$ngContentEditableError = function (error) { // Handle error conditions...
        if (error.error === config.ERRORS.HANDLER_NOT_DEFINED) {
            $('#example-app-modal-title').text('Oops!');
            $('#example-app-modal-body').html('<h3>[' + error.error + '] ' + error.data + '</h3>Handler for this file type is not defined. Try dropping images or something...');
            $('#example-app-modal').modal('show');
        }
    };

    $scope.saveAll = function () { // Save any editable region content...
        EditorStorage.put({
            content: content,
            index: index
        });
        utils.isDirty(false);
    };

    $scope.addEditableItem = function () { // Dynamically add new editable regions...
        $scope.content = $scope.content || [];
        $scope.content.push({
            content: EditorStorage._new()
        });
    };

    $(document).on('scroll', function (event) { // Always hide toolbar on scroll.
        $('#editable-toolbar').fadeOut();
    });

}]);
