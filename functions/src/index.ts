import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as dialogflow from 'dialogflow';
import * as uuid from 'uuid';

admin.initializeApp(functions.config().firebase);

const app = express();
app.use(bodyParser.json());

export const detectTextIntent = functions.https.onRequest((request, response) => {
      //Set CORS policy - TODO : allow access only to runway izen website.
      response.set('Access-Control-Allow-Origin', 'http://localhost:4200');
      if (request.method === 'OPTIONS') {
        // Send response to OPTIONS requests
        response.set('Access-Control-Allow-Methods', 'POST');
        response.set('Access-Control-Allow-Headers', 'Content-Type');
        response.set('Access-Control-Max-Age', '3600');
        response.status(204).send('');
      }
      
      // Instantiates a session client
      const sessionClient = new dialogflow.SessionsClient();
      const projectId = admin.app().options.projectId;
      const sessionId = uuid.v4();
  
      // The path to identify the agent that owns the created intent.
      const sessionPath = sessionClient.sessionPath(projectId, sessionId);//TODO: What is the use of session ID here?

      const query = request.body.query;
      let languageCode = request.body.languageCode;

      if (!query || !query.trim()) {
         response.send({"Error":"Missing query text."});
      }
      //If no language code is sent in the request default to en-US
      if(!languageCode){
         languageCode = "en-US";
      }
      
      // The text query request.
      const queryRequest = {
        session: sessionPath,
        queryInput: {
          text: {
            text: query,
            languageCode: languageCode,
          },
         },
      };
      sessionClient.detectIntent(queryRequest).then(responses => {
        //An intent was detected successfully
        const dialogflowResponse = responses[0];
        response.send({"queryText": dialogflowResponse.queryResult.queryText,
                       "fulfillmentText": dialogflowResponse.queryResult.fulfillmentText
                  });
      }).catch(err => {
        //err object example -> "Error: 3 INVALID_ARGUMENT: Input text not set"
        console.log("something went wrong : "+err);
        response.send(err);
      });  
});