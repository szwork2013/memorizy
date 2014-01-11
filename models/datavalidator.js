function DataValidator() {}

var singleton = new DataValidator();

/**
 *validate get required properties in an object literal 
 *that are missing and make sure that property of required 
 *values are valid following the validator provided for the property
 *
 * @param data An object literal to validate
 * @param propertyValidators Contains required properties and 
 * possibly their respective validator, which must be a boolean
 * function or null. If the validator function return true, 
 * the value is considered valid, invalid otherwise 
 *
 * @return an object containing two arrays called missingProperties 
 * and invalidProperties
 */
DataValidator.prototype.validate = function (data, propertyValidators)
{
    if (Object.prototype.toString.call(data) !== '[object Object]' ||
        Object.prototype.toString
        .call(propertyValidators) !== '[object Object]') {

            throw new Error('data = ' + data + 
                            ' and propertyValidators = ' +
                            propertyValidators + 
                            ' (expected two objects literal)');	
        }

        var err = {
            missingProperties : [],
            invalidProperties : []
        };

        for (var key in propertyValidators) {
            if (propertyValidators.hasOwnProperty(key)) {
                if (!(key in data)) {
                    // Corresponding validator isn't checked in 
                    // this case
                    err.missingProperties.push(key);				
                }
                // Property validators must return a boolean
                // if they are defined
                else if (typeof propertyValidators[key]==='function')
                {
                    var res = propertyValidators[key](data[key]);
                    if (typeof res !== 'boolean') {
                        throw new Error('Property validators must ' +
                                        'return a boolean');
                    }
                    if (res === false) {
                        err.invalidProperties.push(key);
                    }
                }
                // Each property validator is either a function
                // or null
                else if (propertyValidators[key] !== null) {
                    throw new Error('Invalid property validator : ' + 
                                    propertyValidators[key] +
                                    ' (expected a boolean function' +
                                    ' or null)');
                }
            }
        }

        return err;
};

/**
 * validateUsername checks that the username contains between 
 * 3 and 25 alphanumeric characters including the underscore
 *
 * @param username The username to test
 * @return true is the username is valid, false otherwise
 */
DataValidator.prototype.validateUsername = function (username) {
    var reg = /^\w{3,25}$/;
    if (reg.test(username)) {
        return true; 
    }
    return false;
};

/**
 * validatePassword checks that the password contains at 
 * least 8 characters. All characters allowed, except 
 * newline or line terminator
 *
 * @param password The password to test
 * @return true is the password is valid, false otherwise
 */
DataValidator.prototype.validatePassword = function (password) {
    var reg = /^.{8,}$/;
    if (reg.test(password)) {
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
DataValidator.prototype.validateEmail= function (email) {
    var reg = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
    if (reg.test(email)) {
        return true; 
    }
    return false;
};

DataValidator.prototype.validateFilename = function (filename) {
    var reg = /^\w{1,128}$/;
    if (reg.test(filename)) {
        return true; 
    }
    return false;
};

DataValidator.prototype.isNumber = function (n) {
    return typeof n === 'number';
};

DataValidator.prototype.isString = function (s) {
    return typeof s === 'string';
};

module.exports = singleton;
