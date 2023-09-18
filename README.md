# AWS_Lambda_Authorizers

  This lambda authorizer appends APikey based on the querystring parameter in the request
  for example if someone sends the request to CloudFront with domain www.abc.com/Function=Dummy_A&querystringA=777777
  The Cloudfront sends the request to apigateway and the apigateway invokes the lamdba authorizer.
  The authorizer fetches querystringA from the request and goes to search for its value in secrets manager.
  in this case we stored the apikeys values in the secret manaer as key = 777777 and value as "adwd-dwdef-er33" which is nothing but apikey
  On the authorizer finds the corresponding APIkey for the querystringA it appends to the request.
  This usecase for the quthorizer is when you do not want your clients to use their own APIkey and want to throttle the number of request on your side only.
