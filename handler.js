'use strict';

const Alexa = require('alexa-sdk');

const HELP_MESSAGE = 'You can say tell me the latest news, or, you can say exit... What can I help you with?';
const HELP_REPROMPT = 'What can I help you with?';
const STOP_MESSAGE = 'Goodbye!';

const handlers = {
  'LaunchRequest': function () {
      this.emit('GetLatestIntent');
  },
  'GetLatestIntent': function () {
      const speechOutput = 'Nazi SS troops dressed as Poles are attacking German radio station in Gleiwitz, to provide false pretext for German attack on Poland.';
      this.emit(':tell', speechOutput);
  },
  'AMAZON.HelpIntent': function () {
      this.response.speak(HELP_MESSAGE).listen(HELP_REPROMPT);
      this.emit(':responseReady');
  },
  'AMAZON.CancelIntent': function () {
      this.emit(':tell', STOP_MESSAGE);
  },
  'AMAZON.StopIntent': function () {
      this.emit(':tell', STOP_MESSAGE);
  },
};

exports.handler = function (event, context, callback) {
  const alexa = Alexa.handler(event, context, callback);
  alexa.appId = 'amzn1.ask.skill.8955b37b-4975-4462-a4d9-4aba0ad647f0'
  alexa.registerHandlers(handlers);
  alexa.execute();
};
