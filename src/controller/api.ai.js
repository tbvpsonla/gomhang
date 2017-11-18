'use strict';

exports.apiAiGet = function(req , res){
  return res.status(200).json({
    status: "200",
    body : "Connect Successfully",
    apiToken : process.env.APIAI_ACCESS_TOKEN
  });
}
exports.apiAiPost= function(req , res){
  try {
    var json = JSON.parse(req.body);
    if(json.result && json.result.action == actionApi.ClearDataBase){
      let senderId = json.originalRequest.data.sender.id;
      removeDocument(senderId,function(){
        return res.status(200).json(result);
      });
    }else if (json && json.originalRequest) {
      let senderId = json.originalRequest.data.sender.id;

        json.result.resolvedQuery = json.result.resolvedQuery.replace(/[\\]/g, "");
        logger.debug("TEXT : " + json.result.resolvedQuery);
        logger.debug("ACTION : " + json.result.action);
        logger.debug("INTENT : " + json.result.metadata.intentName);
        let jsonValue = {};
        let action = json.result.action;

        switch (action) {
          case actionApi.DetectImage:

          break;
        }
      });
    }else {
      return res.status(200).json({});
    }
  } catch (err) {
    logger.debug(err);
  }
}
