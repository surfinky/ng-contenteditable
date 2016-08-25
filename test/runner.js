describe('Testing directive with no model data', function () {

	var scope,
		elem,
		directive,
		compiled,
		html;

	var _initStaticContent = 'This is static content.';

	beforeEach(function () {

		module('ngContentEditable');

		html = '<div class="editable">' + _initStaticContent + '</div>'; // Set view html.

		inject(function($compile, $rootScope) {
			scope = $rootScope.$new(); // Create scope.
			elem = angular.element(html); // Get element.
			compiled = $compile(elem); // Compile element.
			compiled(scope); // Run view.
			scope.$digest(); // Digest scope.
		});

	});

	it('Should set the text of the element to whatever was passed. (' + _initStaticContent + ')', function () {
		expect(elem.text()).toBe(_initStaticContent);
	});

	it('Should not have contenteditable attribute set.', function () {
		expect(elem.attr('contenteditable')).toBeFalsy();
	});
	
});

describe('Testing directive with model data', function () {

	var scope,
		elem,
		directive,
		compiled,
		html,
		data;

	var _initModelContent = 'This is model data.',
		_initStaticContent = 'This is static content.';

	beforeEach(function () {

		module('ngContentEditable');

		inject(function($compile, $rootScope) {
			scope = $rootScope.$new(); // Create scope;
			scope._testData = {
				content: _initModelContent
			};

			elem = angular.element(html); // Get element.
			compiled = $compile(elem); // Compile element.
			compiled(scope); // Run view.
			scope.$digest(); // Digest scope.
		});

	});

	html = '<div class="editable" ng-model="_testData.content">' + _initStaticContent + '</div>'; // Set view html.

	it('Should set the text of the model. (' + _initModelContent + ')', function () {
		console.log('it --->')
		expect(elem.text()).toBe(_initModelContent);

	});
	
});

describe('Testing directive with bad reference to model data', function () {

	var scope,
		elem,
		directive,
		compiled,
		html,
		data;

	var _initStaticContent = 'This is static content.',
		_initModelContent = 'This is model data.',
		_initNewContent = 'This is new model data.';

	html = '<div class="editable" ng-model="_wrongData.content">' + _initStaticContent + '</div>'; // Set view html.	

	beforeEach(function () {

		module('ngContentEditable');

		inject(function($compile, $rootScope) {

			scope = $rootScope.$new(); // Create scope;
			scope._wrongData = {};

			elem = angular.element(html); // Get element.
			compiled = $compile(elem); // Compile element.
			compiled(scope); // Run view.
			scope.$digest(); // Digest scope.
		});

	});

	it('Should default to static text in element when model data unavailable (' + _initStaticContent + ')', function () {
		expect(elem.text()).toBe(_initStaticContent);
	});

	it('Should have contenteditable attribute set.', function () {
		expect(elem.attr('contenteditable')).toBeTruthy();
		console.log(elem[0].outerHTML, elem.attr('contenteditable'))
	});

	it('Should attempt create / write model data on change.', function () {
		$(elem).html(_initNewContent);
		elem.triggerHandler('change');
		console.log('change ===>', scope)
		expect(scope._wrongData.content).toBeTruthy();
	});

	it('Should commit new content to model data.', function () {
		$(elem).html(_initNewContent + _initNewContent);
		elem.triggerHandler('change');
		expect($('<span>' + scope._wrongData.content + '</span>').text()).toBe(_initNewContent + _initNewContent);
	});

	it('Should be able to add a range and commit content change to model data.', function () {

		angular.element(document.body).append(elem); // Add the element to DOM as visible to allow test Selection and Range object manipulation.

		$(elem).empty();
		$(elem).focus();

		var sel = window.getSelection(),
			range = document.createRange(),
			range = sel.getRangeAt(0),
			node = document.createTextNode(_initNewContent);

		sel.removeAllRanges();
		sel.addRange(range);
		range.insertNode(node);

		elem.triggerHandler('input');

		expect(elem.text()).toBe(_initNewContent);
		expect(scope._wrongData.content).toBe(_initNewContent);

		elem.remove(); // Clean up DOM (for test output only).

	});
	
});
