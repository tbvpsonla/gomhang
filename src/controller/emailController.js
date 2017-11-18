/**
* main_controller.js:
* - holds functions regarding comple
* - ...
*/
const EMAIL_CONFIG_PATH = global.rootPath + '/config/email/';
const TEMPLATE_CONFIG_PATH = global.rootPath + '/config/template/';
var logger = require(global.rootPath + '/controller/logger.js');
var factory = require(global.rootPath + '/controller/utils/object_factory.js');
var utils = require(global.rootPath + '/controller/utils/utils.js');
var constants = require(global.rootPath + '/config/constants.js');
var moment = require('moment');

exports.sendEmail = function(emailContent) {
  return new Promise((resolve, reject) => {
    var json = {
            "status": false
          };

    if (!emailContent || !emailContent.to) {
      return reject(json);
    }

    console.log("Start send email");

    // Initialize trasporter to send email
    var transporter = factory.createTransporter();
    var filePath = EMAIL_CONFIG_PATH + "common_email_template.json";

    utils.readFile(filePath , function (err1, data) {

      var mailObj = factory.createEmailContent(data.format, emailContent);
      logger.debug("Content from request: " + JSON.stringify(emailContent));

      // Send mail
      transporter.sendMail(mailObj, function(err2, info){
        // Return success result
        if(err2 == null){
          json.status = true;
          logger.debug("Info "+ JSON.stringify(info));
        } else {
          logger.debug("Error "+ err2);
        }

        // Return result
        resolve(json);
      });
    });
  });

};

exports.sendExcelToEmail = function(emailContent, excelFile, callback) {
  var json = {
          "status": false
        };

  if (!emailContent || !emailContent.to) {
    return callback(json);
  }

  console.log("Start send excel to email");

  // Initialize trasporter to send email
  var transporter = factory.createTransporter();
  var filePath = EMAIL_CONFIG_PATH + "common_email_template.json";

  utils.readFile(filePath , function (err1, data) {
    // Read file ics then send email
    var mailObj = factory.createEmailContent(data.format, emailContent);
    if (excelFile.name != "") {
      var attachments = {
        "filename": excelFile.name + '.xlsx',
        "content": new Buffer(excelFile.data,'uft-8')
      };

      mailObj.attachments.push(attachments);
    } else {
      mailObj.html = emailContent.contentEmpty;
    }

    var today = moment().format("DD/MM/YYYY");
    mailObj.subject = mailObj.subject.replace("dd/mm/yyyy", today);
    mailObj.html = mailObj.html.replace("dd/mm/yyyy", today);

    // Send mail
    transporter.sendMail(mailObj, function(err2, info){
      // Return success result
      if(err2 == null){
        json.status = true;
        logger.debug("Info "+ JSON.stringify(info));
      } else {
        logger.debug("Error "+ err2);
      }

      // Return result
      callback(json);
    });
  });
};
