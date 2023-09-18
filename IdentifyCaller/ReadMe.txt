//lambda authorizer for caller identification

This authorizer usecase is suitable when you have multiple clients calling your Application using their indivual APIkeys 
and you want to restrict the clients access to only his own Application data.

for example, you have a client x that uses APIkey ABC to access your apigateway.
the apigateway sends the APIkey that X used to lambda authorizer which connects to the dynamodb table
The dynamodb table contains 2 coloums that are APIkeys and Caller.
The authorizer searches tables for the caller using the APIkey that X used to access.
and then identifies that it is X who is calling the application.
not it appends the caller with the use of mapping templates and sends the variable caller to the backend lambda.
The backend is responsible for restricting the access based on the identification of the caller