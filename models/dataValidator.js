function dataValidator(){}

var singleton = new dataValidator();

/* NOT TESTED
 *
 *dataValidator.prototype.getMissingProperties = function(obj, requiredProps){
 *        var missingProperties = [];
 *        
 *        if (!obj) {
 *                missingProperties = requiredProps;
 *        }
 *
 *        var p;
 *        for (var i = 0; i < requiredProps.length; i++) {
 *                p = requiredProps[i];
 *                if (typeof obj[p] == 'undefined') {
 *                        missingProperties.push(p);
 *                }
 *        }
 *
 *        return missingProperties;
 *};
 */

/**
 *validate get required properties in an object literal that are missing and make sure that
 *property of required values are valid following the validator provided for the property
 *
 * @param data An object literal to validate
 * @param propertyValidators Contains required properties and possibly their respective
 * validator, which must be a boolean function or null. If the validator function
 * return true, the value is considered valid, invalid otherwise
 * @return an object containing two array called missingProperties and invalidProperties
 */
dataValidator.prototype.validate = function(data, propertyValidators){
	var err = {
		missingProperties : [],
		invalidProperties : []
	};
	
	for (var key in propertyValidators) {
		if (propertyValidators.hasOwnProperty(key)) {
			if (typeof data[key] == 'undefined') {
				// Corresponding validator isn't check in this case
				err.missingProperties.push(key);				
			}
			// Property validators must return a boolean
			// if they are defined
			else if (typeof propertyValidators[key] == 'function'){
				var res = propertyValidators[key](key);
				if (typeof res != 'boolean') {
					throw new Error('Property validators must return a boolean');
				}
				if (res === false) {
					err.invalidProperties.push(key);
				}
			}
			// Property validators are either a function
			// or null
			else if (propertyValidators[key] !== null) {
				throw new Error('Invalid property validator : ' 
						+ propertyValidators[key] +
						' (expected a function or null)');
			}
		}
	};

	return err;
};

/**
 * validateUsername checks that the username contains between 
 * 3 and 25 alphanumeric characters including the underscore
 *
 * @param username The username to test
 * @return true is the username is valid, false otherwise
 */
dataValidator.prototype.validateUsername = function(username) {
	var reg = /^\w{3,25}$/;
	if (reg.test(username)){
		return true; 
	}
	return false;
};

/**
 * validatePassword checks that the password contains at least 8 characters
 * All characters allowed, except newline or line terminator
 *
 * @param password The password to test
 * @return true is the password is valid, false otherwise
 */
dataValidator.prototype.validatePassword = function(password) {
	var reg = /^.{8,}$/;
	if (reg.test(password)){
		return true; 
	}
	return false;
};

/**
 * validateEmail checks that the email is a correct email address
 *
 * @param email The address to verify
 * @return true is the email is valid, false otherwise
 */
dataValidator.prototype.validateEmail= function(email) {
	var reg = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
	if (reg.test(email)){
		return true; 
	}
	return false;
};

module.exports = singleton;
