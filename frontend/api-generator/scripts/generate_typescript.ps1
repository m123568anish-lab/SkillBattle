java -jar D:\Tools\OpenAPI\openapi-generator-cli.jar `
generate `
-g typescript-fetch `
-i http://localhost:8001/openapi.json `
-c ..\openapi-config.yaml `
-o ..\generated\typescript