angular.module('angular-validator-demo', ['angularValidator']);


angular.module('angular-validator-demo').controller('DemoCtrl', function($scope) {

	$scope.submitMyForm = function() {
		alert("Form submitted");
	};


	$scope.anotherCustomValidator = function(text) {
		if (text === "rainbow") {
			return true;
		} else return "type in 'rainbow'";
	};

})
/*
.factory('customMessage', function () {
    // invalid message service with message function
    return {
        // scopeElementModel is the object in scope version, element is the object in DOM version
        message: function (scopeElementModel, element) {
            var errors = scopeElementModel.$error;
            if (errors.maxlength) {
                // be careful with the quote
                return "'Should be no longer than " + element.attributes['ng-maxlength'].value + " characters!'";
            } else {
                // default message
                return "'This field is invalid!'";
            }
        }
    };
});
*/