const FOLDER_NAME = global.rootPath + '/config/locale/';
const LOCALE = "vi";
const TYPE_EMAIL = "email";
const TYPE_DATE = "date";
const TYPE_DATE_TIME = "date_time";
const TYPE_BIRTHDAY = "birthday";
const TYPE_PHONE = "phone";
const TYPE_CARD_NO = "card_no";
const TYPE_NAME = "name";

var validator = require('validator');
var moment = require('moment');
var utils = require(global.rootPath + '/controller/utils/utils');
var logger = require(global.rootPath + '/controller/logger');

/**
* Output result after call api
* in json format
* @status: true or false
* @input: user's input data
* @expect: expected output
* @reason: reason if false
*/

exports.validate = function(type, data, callback) {
	var result = {
		"status": false,
		"input": "",
		"expect": "",
		"reason": ""
	}
	logger.debug("Data from user: " + data);
  	if (type && data) {
		var finish = function(validateResult) {
		    callback(validateResult);
		}

		// Validate
		switch(type) {
			case TYPE_DATE:
				isValidDate(data, LOCALE, finish);
				break;

			case TYPE_DATE_TIME:
				isValidDateTime(data, finish);
				break;

			case TYPE_EMAIL:
				isValidEmail(data, finish);
				break;

			case TYPE_PHONE:
				isValidPhone(data, finish);
				break;

			case TYPE_BIRTHDAY:
				isValidBirthday(data, LOCALE, finish);
				break;

			case TYPE_CARD_NO:
				isValidCardNo(data, LOCALE, finish);
				break;

			case TYPE_NAME:
				isValidName(data, LOCALE, finish);
				break;
		}
	} else {
		callback(result);
	}
}

var isValidName = function(name, locale, callback) {
	logger.debug("User Name: " + name);

	var cb = function(err, config) {
		var maxLength = config.name.maxLength;
	    var result = {
			"status": false,
			"input": name,
			"reason": ""
		}
    if (name.length >= maxLength) {
    	result.reason = ">30";
    } else {
    	result.status = true;
    }

    callback(result);
	};
	utils.readFile(FOLDER_NAME + locale + '/data_format.json', cb);
};

/**
* Validate date
* input: date & locale
* output: return correct date format
*/
var isValidDate = function(date, locale, callback) {
	var result = {
		"status": false,
		"input": date,
		"expect": "",
		"reason": ""
	}

	if (!date) {
		return callback(result);
	}

	var dateArr = date.match("[0-9]+ *(\s|\/|-) *[0-9]+.*");

	if (!dateArr) {
		return callback(result);
	}

	date = dateArr[0];
	// console.log("Date after extracted: " + date);
	var format = "DD/MM/YYYY";
	var today = moment();
	today = moment(today, format);
	console.log("Today Obj: " + today.toString());
	var inputDate = moment(date, format);
	// console.log("Input Date: " + inputDate);
	if (!inputDate.isValid()) {
    	result.reason = "Invalid format";
    } else if (inputDate.isAfter(today)) {
        result.status = true;
        // logger.debug("Date Config: " + format);
        result.expect = moment(inputDate).format(format);

				var maximum = today.add(15, 'days');
				logger.debug("Maximum Date: " + maximum.toString());
				if (inputDate.isAfter(maximum)) {
					result.reason = ">maximum";
				}

				// Case user input tomorrow after report time
				// Don't use today.add since today has other value after add 15 days above.
				var tomorrowObj = moment().add(1, "days");
				var tomorrow = tomorrowObj.format(format);
				var createTime = tomorrowObj.format("HH:mm");
				var inputDateStr = inputDate.format(format);
				logger.debug("Input Date: " + inputDate.toString());
				logger.debug("Tomorrow: " + tomorrow.toString());
				logger.debug("createTime: " + createTime);
				logger.debug("reportTime: " + reportTime.lead_generation);
				logger.debug("Result: " + (inputDateStr === tomorrow) + " Compare Time: " + (createTime >= reportTime.lead_generation));
				if ((inputDateStr === tomorrow) && (createTime >= reportTime.lead_generation)) {
					result.reason = "=tomorrow_appointment";
				}

        // logger.debug("Data: " + result.expect);
    } else if (inputDate.isSame(today, 'd')){
    	result.status = true;
        // logger.debug("Date Config: " + format);
        result.expect = moment(inputDate).format(format);
        // logger.debug("Data: " + result.expect);
    	result.reason = "=today";
    }
    else {
        result.reason = "<today";
    }

    callback(result);
};

var isValidDateTime = function(inputTime , callback){
  let result = {
      "status" : false
  };

  if(inputTime){
    var datetime = inputTime;
    var dateArr = datetime.match(/[0-9]+ ?\/ ?[0-9]+ ?\/ ?[0-9]+/g);
    var mo = require('moment');
    var date = null;

    if(dateArr){
      if(mo(dateArr[0], "DD/MM/YYYY").fromNow().indexOf("in") != -1){
          date = dateArr[0];
          result.date = dateArr[0].replace(/ /g, '');
          result.status = true;
          result.datetime = result.date;
      }
      if(date){
          var time = datetime.replace(date, '');
          var hourRegex = time.replace(/,\s+/g,"");
          if(hourRegex){
            result.hour = hourRegex;
            result.datetime = result.hour + " " + result.date;
          }
      }
    }

    callback(result);
  }else {
    callback(result);
  }
}

var isValidBirthday = function(date, locale, callback) {
	var result = {
		"status": false,
		"input": date,
		"expect": "",
		"reason": ""
	}

	var minimum = 18; // minimum 18 years
	var maximum = 100;  // maximum 100 years

    var eighteenYearsAgo = moment().subtract(minimum, "years");
    var hundredYearsAgo = moment().subtract(maximum, "years");
    // var format = config.date.format;
    var format = "DD/MM/YYYY";
    // logger.debug("EighteenYearsAgo: ", eighteenYearsAgo;
    var birthday = moment(date, format);
    // eighteenYearsAgo = moment(eighteenYearsAgo, format);

    logger.debug("Input: ", moment(date).format(format));

    if (!birthday.isValid()) {
    	result.reason = "Invalid format";
    } else if (hundredYearsAgo.isAfter(birthday)){
    	result.reason = ">100";
    } else if (eighteenYearsAgo.isAfter(birthday) &&
    	       hundredYearsAgo.isBefore(birthday)) {
        result.status = true;
        // logger.debug("Date Config: " + format);
        result.expect = moment(birthday).format(format);
        // logger.debug("Data: " + result.expect);
    } else {
        result.reason = "<18";
    }

    callback(result);
};

/**
* Validate card id
* input: card id
* output: return result in json
*/
var isValidCardNo = function(cardNo, locale, callback) {
	logger.debug ("Input Data: ", cardNo);
	var result = {
		"status": false,
		"input": cardNo,
		"expect": "",
		"reason": ""
	}

	if (!cardNo) {
		result.reason = "empty data";
		return callback(result);
	}

	// Remove " " or "." or "-" characters
	cardNo = cardNo.replace(/[^0-9a-zA-Z]/g, "");
	logger.debug("Card No after replacing space, . and -" + cardNo);

	if (checkCMND(cardNo) || checkPassport(cardNo) || checkContract(cardNo)) {
		result.status = true;
		result.expect = cardNo;
	}

	return callback(result);
}

var isValidEmail = function (email, callback) {
	// logger.debug("Email " + email);
	var result = {
		"status": false,
		"input": email,
		"expect": "",
		"reason": ""
	}

	if (!email) {
		return callback(result);
	}

	// Trim space at head and tail
	email = email.trim();

	result.status = validator.isEmail(email);
	if (result.status) {
		result.expect = email;
	}

	callback(result);
};

var isValidPhone = function (phone, callback){
	var result = {
		"status": false,
		"input": phone,
		"expect": "",
		"reason": ""
	}
	logger.debug("Phone from user: " + phone);
	if (!phone) {
		callback(result);
	}
  var phone = phone.replace( /[^0-9]/g, '');

	if(phone){
		result.expect = phone;
    checkPhone(phone)
      .then(function(validPhone){
				if (validPhone) {
					result.status = true;
					result.expect = validPhone;
				}
        return callback(result);
      })
      .catch(function(err){
        return callback(result);
      });
  } else {
			return callback(result);
	}
}

var checkPhone = function(phone){
  return new Promise((resolve, reject) => {
    var phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();
    var phoneNumber = phoneUtil.parseAndKeepRawInput(phone, 'VN');

    if(phoneUtil.isValidNumberForRegion(phoneNumber, 'VN')){
      	resolve("0" + phoneNumber.values_['2']);
    } else {
		resolve("");
	}
  });
}

function containAtHead(string, subStringArray) {
	var result = {
		"status": false,
		"value": ""
	};
	for (var i = 0; i < subStringArray.length; i++) {
		var subString = subStringArray[i];

		// Find match prefix
		if (string.indexOf(subString) === 0) {
			result.status = true;
			result.value = subString;

			return result;
		}
	}
	return (result);
}


// var checkCMND = function (cmnd) {
// 	var result = {
// 		"status": false,
// 		"reason": ""
// 	}
//
// 	if (!includeNonDigits(cmnd)) {
// 		result.reason = "Include characters";
// 		return result;
// 	}
//
// 	if (!lengthBetween(cmnd, 9, 12)) {
// 		result.reason = "Length must be between " + 9 + " and " + 12;
// 		return result;
// 	}
//
// 	result.status = true;
// 	return result;
// }

var checkCMND = function (cmnd) {
	var regex = /^[0-9]{9,12}$/
	var isValidCMND = regex.test(cmnd);
	return isValidCMND;
}

var checkPassport = function (passportNo) {

	var regex = /^[a-zA-Z]{1}[0-9]{7}$/
	var isValidPassport = regex.test(passportNo);
	return isValidPassport;
}

var checkContract = function (contractNo) {
	// Start with 7
	var regex1 = /^7[0-9]{7}$/
	var isValidContract1 = regex1.test(contractNo);

	// Start with 00 and left < 300000
	var regex2 = /^00[0-2]{1}[0-9]{5}$/
	var isValidContract2 = regex2.test(contractNo);

	return (isValidContract1 || isValidContract2);
}

// var includeNonDigits = function (string) {
// 	var regex = /^[0-9]+$/;
// 	var isDigitOnly = regex.test(string);
// 	return isDigitOnly;
// }
//
// var lengthBetween = function (string, min, max) {
// 	logger.debug("String length: " + string.length);
//
// 	if (string) {
// 		return ((string.length >= min) && (string.length <= max));
// 	}
//
// 	return false;
// }
module.exports.checkPassport = checkPassport;
