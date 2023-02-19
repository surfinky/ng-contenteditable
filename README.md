![ngContentEditable](https://raw.githubusercontent.com/cathalsurfs/ng-contenteditable/master/demo/img/logo.png)

## Native contenteditable directive for AngularJS

The original and rather nifty set AngularJS components to enable editing of specific content areas of a web page, inline and on the fly! Complete with dynamic drag and drop and two way wiring for roll-your-own GUI implementation.

[Live Demo](http://inchsurf.com/ng-contenteditable/)

Note the demo itself requires jQuery and Bootstrap 3 (for quick demo purposes).

[Documentation](https://github.com/cathalsurfs/ng-contenteditable/wiki)

The code is the documentation! It is worth reviewing the demo (code) also, as it is commented heavily and demonstrates a good working example of how you can implement and use this directive in a web page or application.

[Reference](https://github.com/cathalsurfs/ng-contenteditable/blob/master/demo/js/app.js) (see code comments)

[Tests](https://github.com/cathalsurfs/ng-contenteditable/tree/master/test) (see notes below)

## Requirements

A browser that supports the contenteditable attribute and also supports HTML5 drag and drop specification is required.

Tested working with latest versions of Chrome.

Mileage with older browsers may vary.

## Installation

Good old fashioned bower install...

__bower install ngcontenteditable__



# Usage

## editable

This directive can be declared on any element within the DOM. However it is intended to constrained in its use to block style elements.

Drag and drop operations...

Directive declaration applied by class attribute. Simply add the "editable" class name to any element to enable editable functionality. Native drag and drop functionality is also provided to "editable" regions (including reads from local file system). Two-way data binding is also provided on "editable" elements.

Example:

	<div class="editable" data-ng-model="your.data.model">Some default static content...</div>

If your model data is not available, ngContentEditable will default to whatever static content already exists within your element. This is handy (e.g. for initial design and layout), when for example you are mocking up a web page, or you want to publish with initial static content which the user can later modify in your implementation. As such, subsequent changes will update to your model dynamically.

#### Scope

Any directives which are placed (nested) within an editable region (either implicitly or by user drag drop interaction) will be compiled dynamically. These directives will have access to the following property (as long as they are not defined with isolate scope):

__$ngContentEditable__ (Object)

You can access this property (e.g. during linking phase of a custom directive) to determine if the directive is actively "contained" within an editable area. Linking of directives is also triggered when an __editable-component__ is dragged or dropped into an editable region. This way, your custom directives can be interactive and operate within the context of your "editable" region and allow you to extend functionality for your own specific purposes.

## editable-component

Directive declaration is by class name, simply by adding the __editable-component__ class name to any directives for which you want to __preserve__ scope.

~~Note - preservation of scope may not be completely reliable (AngularJS). For safety, where the user selects a text range which encompasses any editable-component directives, any subsequent drag events are cancelled (see configService.DISABLE_RANGE_OVER_EDITABLE_COMPONENT).~~

## editable-control

Directive declaration is by class name, by adding the __editable-control__ class name to any elements you wish to respond to click events to trigger/send supported contenteditable commands to active (cursor) "editable" elements.

# Services

## editable.dragHelperService

The following method must be called to handle drop events on any "editable" elements:

### registerDropHandler(options)

Note data transferred by __drag__, __drop__ or __paste__ operations is handled (and optionally transformed) based on one or more registered MIME types. If no handler is registered, any drop event will be cancelled/triggers the default paste event (mileage may vary depending on the vintage of your browser).

The __registerDropHandler__ method provides registration of a drop handler for editable elements. In the case of the demo provided, this method is called from the constructor function of directives which apply to specific HTML tags.

The __registerDropHandler__ method takes the following options object as its only argument:

	{
		types: [], 				// Array of strings, for each mime type you want to accept (e.g. ['image/jpeg', 'image/png', 'image/gif'])
		node: angular.element 	// Wrapped element which is inserted into editable region (DOM) during uploading phase, if any are associated with this type, for positive user feedback.
		format: Function 		// Callback function which passes single argument (data) to allow manipulation of inserted element on uploading phase completion (e.g. uploaded image final display).
	}

## Other

The following services are provided for convenience, but primarily for internal use:

__editable.utilityService__ (required by all)

__editable.configService__ (required by editable directive)

__editable.rangeHelperService__ (required by editable directive)

__editable.commandHelperService__ (required by editable-control directive)

## Tests

Sorry, coverage is a bit sparse at the moment. For now, I've made available some basic sanity testing, validation of two-way data binding on editable regions and some range / selection interaction with editable regions, for good measure.

[Tests](https://github.com/cathalsurfs/ng-contenteditable/tree/master/test)
