![ngContentEditable](https://raw.githubusercontent.com/cathalsurfs/ng-contenteditable/master/demo/img/logo.png)

###Native contenteditable directive for AngularJS###

A handy set of features, designed primarily to enable arbitrary editing of specific content areas of a web page, on the fly!

[Live Demo](http://inchsurf.com/ng-contenteditable/)

Note this demo requires jQuery and Bootstrap 3 (because I just wanted to put together a quick and dirty demo).

[Documentation](https://github.com/cathalsurfs/ng-contenteditable/wiki) (TODO)

[Reference](https://github.com/cathalsurfs/ng-contenteditable/blob/master/demo/js/app.js) (see code comments)

[Tests](https://github.com/cathalsurfs/ng-contenteditable/tree/master/test) (see notes below)

##Requirements##

A browser that supports the contenteditable attribute and ideally, also supports HTML5 drag and drop specification is required.

Tested working with latest versions of Chrome.

Results with other browsers may vary and remain untested.

##Installation##

Your bog standard bower install...

__bower install ngcontenteditable__



#Usage#

##editable##

This directive can be declared on any element within the DOM. However it is intended to be limited in application to block style elements.

Drag and drop operations...

Directive declaration style is by class, by adding the "editable" class name to any elements you wish to enable with this extension. Provides native drag and drop functionality to editable regions (including reads from local file system). Provides two-way binding on contenteditable elements.

Example:

	<div class="editable" data-ng-model="your.data.model">Some default static content...</div>

If your model data is not available, ngContentEditable will default to whatever static content you have contained within your element. This is handy (designers etc), when for example you are mocking up a web page, or you want to publish with initial static content the user can later modify. Subsequent changes can update to your model.

####Scope####

Any directives which are placed within an editable region (either implicitly or by user drag drop interaction), will be compiled dynamically. These directives will have access to the following property (as long as they are not defined with isolate scope):

__$ngContentEditable__ (Object)

You can access this property (for example during linking phase of a directive) to determine if your directive is contained within an editable area. Linking of directives is also triggered when an __editable-component__ is dragged or dropped into an editable region.

##editable-component##

Directive declaration is by class name. By adding the __editable-component__ class name to any directives for which you want to __preserve__ scope.

~~Note - preservation of scope may not be completely reliable. For safety, where the user selects a range which encompasses any editable-component directives, any subsequent drag event is cancelled (see configService.DISABLE_RANGE_OVER_EDITABLE_COMPONENT).~~

##editable-control##

Directive declaration is by class name, by adding the __editable-control__ class name to any elements you wish to function as a command / button within your web page or application.

#Services#

##editable.dragHelperService##

Main thing here is the following method:

###registerDropHandler(options)###

Data transferred by __drag__, __drop__ or __paste__ operations is handled (and optionally transformed) based on registered MIME types. If no handler is registered, any drop event will be cancelled or any paste event will provide default behavior (testing required).

The __registerDropHandler__ method provides mechanism to register a drop handler for editable elements. In the demo provided, this method is called from the constructor function of directives which apply to specific HTML tags.

It takes the following options object as its only argument:

	{
		types: [], 				// Array of strings, for each mime type you want to accept (e.g. ['image/jpeg', 'image/png', 'image/gif'])
		node: angular.element 	// Wrapped element which is inserted into editable region (DOM) during uploading phase, if any are associated with this type, for positive user feedback.
		format: Function 		// Callback function which passes single argument (data) to allow manipulation of inserted element on uploading phase completion (e.g. uploaded image final display).
	}

##Other##

Other services which are available, but primarily for internal use are:

__editable.utilityService__ (required by all)

__editable.configService__ (required by editable directive)

__editable.rangeHelperService__ (required by editable directive)

__editable.commandHelperService__ (required by editable-control directive)

##Tests##

Sorry, tests are a bit sparse at the moment. For now, I've made available some basic sanity testing and testing around validation of two-way data binding on editable regions. Also, a little bit of range / selection interaction with editable regions, for good measure (for now).

[Tests](https://github.com/cathalsurfs/ng-contenteditable/tree/master/test)
