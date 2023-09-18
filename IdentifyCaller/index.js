const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  try {
    // Extract the API key from the request
    const apiKey = event.headers['x-api-key'];

    console.log(`Received request with API key: ${apiKey}`);

    // Fetch the 'Caller' value from DynamoDB based on the API key
    const params = {
      TableName: 'YourDynamoDBTableName',
      Key: { 
        APIKeys: apiKey 
      }
    };

    console.log(`Fetching 'Caller' value from DynamoDB for API key: ${apiKey}`);

    const data = await dynamoDB.get(params).promise();

    if (!data.Item || !data.Item.Caller) {
      console.log(`No 'Caller' value found for API key: ${apiKey}`);
      return generatePolicyDocument('user', 'Deny',event.methodArn);
    }

    const caller = data.Item.Caller;

    console.log(`'Caller' value retrieved for API key ${apiKey}: ${caller}`);

    var context = {
        'Key': caller
    };
    return generatePolicy('user', 'Allow',event.methodArn,context);
  }
  catch (error) {
    console.error('Error : ' + error);
    return generatePolicy('user', 'Deny',event.method , {});
};
};
const generatePolicy=  (princpleId ,effect, resource,context) =>{
  const authresponse = {
    princpleId : princpleId,
    PolicyDocument:{
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'execute-api:Invoke',
        Effect: effect,
        Resource: resource,
      }
    ],
},
context : context
  };
  return policy;
}