const DATABASE_CONFIG_FOLDER = global.rootPath + '/config/report/';
const DATE_FORMAT = "DD/MM/YYYY";
const excel = require('node-excel-export');
var SelfReloadJSON = require('self-reload-json');
var mongoose = require('mongoose');
var logger = require(global.rootPath + '/controller/logger.js');
var emailController = require(global.rootPath + '/controller/emailController.js');
var moment = require('moment');
var utils =  require(global.rootPath + '/controller/utils/utils.js');

var User = require(global.rootPath + '/model/user.model');
var Order = require(global.rootPath + '/model/order.model');

exports.reportOrder = function(contentObject){
	return new Promise((resolve, reject) => {
		var today = moment().format(DATE_FORMAT);
		var yesterday = moment().subtract(1, "days").format(DATE_FORMAT);
		logger.debug("Report Order in " + yesterday + " and " + today);

		// Query data from User Update
		Order.find({$or: [{ 'create_date': ''+yesterday }, { 'create_date': ''+today }]}).populate('_user').exec()
		.then(function(userData) {
			var reportTime = contentObject.reportTime;
			if (!reportTime) {
				reportTime = "16:00";
			}

			var data = createOrderRecord(today, yesterday, reportTime, userData);
			logger.debug("Number of records in excel: " + data.length + "\n");

			var excelFile = {
				"name": "",
				"data": ""
			}
			if (data.length > 0) {
		  	// Create excel
		  	var excelFile = createOrderExcel(data, today);
			}

			emailController.sendExcelToEmail(contentObject, excelFile, function(result){
	    		logger.debug("Sending file result: " + JSON.stringify(result));

	    		resolve(result);
	    	});

		}).catch(function(err) {
	  		resolve(err)
	  	});
		});
}

exports.getReportOrder = function(req, callback){
	var reportDate = req.query.date;
	var reportTime = req.query.time;
	if (!reportTime) {
		reportTime = "16:00";
	}
	logger.debug("Report Date: " + reportDate);
	// logger.debug("Report Time: " + reportTime);

	var dateObject = moment(reportDate, DATE_FORMAT);
	var today = moment(dateObject).format(DATE_FORMAT);
	var yesterday = moment(dateObject).subtract(1, "days").format(DATE_FORMAT);
	// logger.debug("Today: " + today);
	// logger.debug("Yesterday: " + yesterday);
	logger.debug("Report Order in " + yesterday + " and " + today);

	// Query data from Mini Game
	Order.find({$or: [{ 'create_date': ''+yesterday }, { 'create_date': ''+today }]}).populate('_user').exec()
	.then(function(userData) {

		var data = createOrderRecord(today, yesterday, reportTime, userData);
		logger.debug("Number of records in excel: " + data.length + "\n");

		var excelFile = {
			"name": "",
			"data": ""
		}
		if (data.length > 0) {
	  	// Create excel
	  	var excelFile = createOrderExcel(data, today);
		}

		return callback(excelFile);

	}).catch(function(err) {
  		return callback(err)
  	});
}


// Create minigame records
var createOrderRecord = function(today, yesterday, reportTime, userList) {
	var data = [];
	var index = 0;
	logger.debug("User list length: " + userList.length);
	for (var i = 0; i < userList.length; i++) {
		var orderRow = userList[i];
		var createTime = orderRow.create_time;
		var createDate = orderRow.create_date;
		logger.debug("Create Date: " + createDate);
		// logger.debug("Create Time: " + createTime);
		// logger.debug("Appointment Date: " + appointmentDate);

		if (((createDate === today) && (createTime < reportTime)) ||
		   ((createDate === yesterday) && (createTime >= reportTime))){

				var user = orderRow._user[0];
				let record = {};

				// Add data related to user
				index = index + 1;

				// logger.debug("Step 1");
				record['number'] = index;

				record['name'] = user['name'];

				if (user['phone']) {
						record['phone'] = user['phone'];
				}

				if (user['address']) {
						record['address'] = user['address'];
				}

				record['create_time'] = orderRow['create_time'];
				record['product'] = orderRow['product'];

				logger.debug("Record " + i + ": " + JSON.stringify(record));
				data.push(record);
			}
	}
	return data;
}

var createOrderExcel = function(data, today){
	logger.debug("Create Excel File");
	var dataJson = new SelfReloadJSON(DATABASE_CONFIG_FOLDER + 'order.json');

	// Create specification, heading, merge
	let specification = createSpecification(dataJson.data);

	const heading = [
	  [{value: dataJson.report_name, style: styles.Title}],[{value: 'Date : ' + today, style: styles.Date}]
	];

	const merges = [
	  { start: { row: 1, column: 1 }, end: { row: 1, column: 10 }},{ start: { row: 2, column: 1 }, end: { row: 2, column: 10 } }
	];

	// Create report
	var report = excel.buildExport(
	  [
	    {
	      name: dataJson.report_name,
	      heading: heading,
	      merges: merges,
	      specification: specification,
	      data: data
	    }
	  ]
	);

	fileName = dataJson.report_name + "_" + today.replace(/\//g, "_")
	logger.debug("File Name: " + fileName);
	var result = {
		"name": fileName,
		"data": report
	}

	return result;
}

// Configuration for excel file
var createSpecification = function(json){
	let specification = {} ;
	var obj = json;
	var keys = Object.keys(obj);

	for (var i = 0; i < keys.length; i++) {
	  var key = keys[i];
		var object = obj[key];
	  let jsonObject = {};
	  jsonObject.displayName = object.name;
		jsonObject.width = object.width;
		jsonObject.headerStyle = styles.TitleDB;
		jsonObject.cellStyle = styles.Cell_Top;
		if (object.align === "center") {
				jsonObject.cellStyle = styles.Cell_Center;
		}

		jsonObject.cellFormat = function(value, row) {
      return (!value) ? '' : value;
    };

	  specification[key] = jsonObject;
	}

	return specification;
}

var createOrderExcel = function(data, today){
	logger.debug("Create Excel File");
	var dataJson = new SelfReloadJSON(DATABASE_CONFIG_FOLDER + 'order.json');

	// Create specification, heading, merge
	let specification = createSpecification(dataJson.data);

	const heading = [
	  [{value: dataJson.report_name, style: styles.Title}],[{value: 'Date : ' + today, style: styles.Date}]
	];

	const merges = [
	  { start: { row: 1, column: 1 }, end: { row: 1, column: Object.keys(dataJson.data).length }},{ start: { row: 2, column: 1 }, end: { row: 2, column: Object.keys(dataJson.data).length } }
	];

	// Create report
	var report = excel.buildExport(
	  [
	    {
	      name: dataJson.report_name,
	      heading: heading,
	      merges: merges,
	      specification: specification,
	      data: data
	    }
	  ]
	);

	fileName = dataJson.report_name + "_" + today.replace(/\//g, "_")
	logger.debug("File Name: " + fileName);
	var result = {
		"name": fileName,
		"data": report
	}

	return result;
}

const styles = {
    Title: {
      alignment:{
        vertical: 'center',
        horizontal:'center'
      },
      font: {
        name:"Calibri",
        sz: 36,
        bold: true,
      }
    },
    Date: {
      alignment:{
        vertical: 'center',
        horizontal:'center'
      },
      font: {
        name:"Calibri",
        sz: 16
      }
    },
		Cell_Center: {
			alignment:{
        vertical: 'center',
        horizontal:'center',
				wrapText: true
      },
      font: {
        name:"Calibri",
        sz: 12
      }
		},
    Cell_Top: {
      alignment:{
        vertical: 'center',
        horizontal:'top',
				wrapText: true
      },
      font: {
        name:"Calibri",
        sz: 12
      }
    },
    TitleDB: {
      fill :{
        fgColor: {
          rgb: 'c65911'
        }
      },
      alignment:{
        vertical: 'center',
        horizontal:'center',
				wrapText: true
      },
      font: {
        name:"Arial",
        sz: 10,
        bold: true,
        color: { rgb: "ffffff" }
      },
      border: {
      	top: { style: 'thin', color: { rgb: "cccccc" } },
      	bottom: { style: 'thin', color: { rgb: "cccccc" } },
      	left: { style: 'thin', color: { rgb: "cccccc" } },
      	right: { style: 'thin', color: { rgb: "cccccc" } }
      }
    }
  };
