java -jar D:\Tools\OpenAPI\openapi-generator-cli.jar `
generate `
-g java `
-i http://localhost:8001/openapi.json `
-c ..\openapi-config.yaml `
-o ..\generated\java