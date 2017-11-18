var logger = require(global.rootPath + '/controller/logger.js');
var nodemailer = require('nodemailer');
var SelfReloadJSON = require('self-reload-json');
var emailAuth = new SelfReloadJSON(global.rootPath + '/config/email/email_auth.json');

exports.createEmailContent = function(mailObject, emailContent) {

  var json = mailObject;
  json.from = emailContent.from;
  json.to = emailContent.to;
  json.cc = emailContent.cc;
  json.subject = emailContent.subject;
  json.html = emailContent.content;

  if (emailContent.attachments) {
      json.attachments = emailContent.attachments;
  }

  logger.debug("Mail Object After Edit: " + JSON.stringify(json));
  return json;
}

exports.createTransporter = function() {

  // For other SMTP
  var transporter = nodemailer.createTransport({
    host: emailAuth.host,
    port: emailAuth.port,
    secure: emailAuth.secure,
    auth: emailAuth.auth
  });

  return transporter;
}
