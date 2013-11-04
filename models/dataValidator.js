function dataValidator(){}

var singleton = new dataValidator();

dataValidator.prototype.getMissingProperties = function(obj, requiredProps){
	var missingProperties = [];
	
	if (!obj) {
		missingProperties = requiredProps;
	}

	var p;
	for (var i = 0; i < requiredProps.length; i++) {
		p = requiredProps[i];
		if (typeof obj[p] == 'undefined') {
			missingProperties.push(p);
		}
	}

	return missingProperties;
};

dataValidator.prototype.validate = function(data, propertyValidators){
	var err = {
		missingProperties : [],
		invalidProperties : []
	};
	
	for (var key in propertyValidators) {
		if (propertyValidators.hasOwnProperty(key)) {
			if (typeof data[key] == 'undefined') {
				err.missingProperties.push(key);				
			}
			else if (propertyValidators[key](key) === false){
				err.invalidProperties.push(key);
			}
		}
	};

	return err;
};

/*
 *A valid username contains between 3 and 25 alphanumeric characters
 *including the underscore
 */
dataValidator.prototype.validateUsername = function(username) {
	var reg = /^\w{3,25}$/;
	if (reg.test(username)){
		return true; 
	}
	return false;
};

/*
 *A valid password contains at least 8 non-blank characters
 */
dataValidator.prototype.validatePassword = function(password) {
	var reg = /^\S{8,}$/;
	if (reg.test(password)){
		return true; 
	}
	return false;
};

dataValidator.prototype.validateEmail= function(email) {
	var reg = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
	if (reg.test(email)){
		return true; 
	}
	return false;
};

module.exports = singleton;
