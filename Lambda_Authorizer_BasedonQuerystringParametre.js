const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();

exports.handler = async (event, context) => {
  console.log('Received request:', JSON.stringify(event));

  // Extract the CloudFront-Forwarded-Proto header from the request
  const cloudFrontForwardedProto = event.headers['cloudfront-forwarded-proto'];
  console.log(`CloudFront-Forwarded-Proto header: ${cloudFrontForwardedProto}`);

  // Set default apiKey and usageIdentifierKey values
  let apiKey = process.env.DEFAULT_API_KEY;
  let usageIdentifierKey = '';

  // Deny the request if the CloudFront-Forwarded-Proto header is not http or https
  if (!['http', 'https'].includes(cloudFrontForwardedProto)) {
    console.log('Request not allowed');
    return generatePolicy('user', 'Deny', event.methodArn);
  }

  // Check if the x-api-key header is present in the request
  if (event.headers['x-api-key']) {
    apiKey = event.headers['x-api-key'];
    usageIdentifierKey = apiKey;
    console.log(`Found x-api-key in request: ${apiKey}`);
  } else {
    // Check if the querystringA or querystringB query string parameter is present in the URL
    const querystringB = event.queryStringParameters.querystringA || event.queryStringParameters.querystringB;
    if (!querystringB) {
      console.log('querystringB/querystringA query parameter not provided, using default apiKey');
      usageIdentifierKey = apiKey;
    } else {
      // Retrieve the API key and usageIdentifierKey from AWS Secrets Manager
      const secretName = 'querystringBApiKeys';
      const params = {
        SecretId: secretName
      };
      const data = await secretsManager.getSecretValue(params).promise();
      console.log('Secrets Manager response:', JSON.stringify(data));

      if (data.SecretString) {
        const secrets = JSON.parse(data.SecretString);
        usageIdentifierKey = secrets[querystringB];
        console.log(`API key for querystringB=${querystringB} is ${usageIdentifierKey}`);
        if (!usageIdentifierKey) {
          console.log(`querystringB/querystringA ${querystringB} not found in secret manager`);
          usageIdentifierKey = apiKey;
          console.log("This is usageIdentifierKey",usageIdentifierKey)
        }
      } else {
        console.log('Authorization failed');
        // Authorization failed
        return generatePolicy('user', 'Deny', event.methodArn);
      }
    }
  }

  // Append the apiKey and usageIdentifierKey to the URL query string
  //event.queryStringParameters['apikey'] = apiKey;
  console.log('This is usageIdentifierKey',usageIdentifierKey);
  event.queryStringParameters['usageIdentifierKey'] = usageIdentifierKey;
  const queryString = Object.keys(event.queryStringParameters)
    .map(key => `${key}=${event.queryStringParameters[key]}`)
    .join('&');
  event.rawQueryString = queryString;

  return generatePolicy('user', 'Allow', event.methodArn, {
    stringKey: 'value',
    Key: '1',
    booleanKey: 'true'
  }, usageIdentifierKey);
};

// Generate an IAM policy based on the authorization result
function generatePolicy(principalId, effect, resource, context, usageIdentifierKey) {
  const authResponse = {
    principalId: principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource
        }
      ]
    },
    context: context,
    usageIdentifierKey: usageIdentifierKey
  };
  return authResponse;
}
