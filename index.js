#! /usr/bin/env node
const argv = require('yargs')
            .alias('v', 'validator')
            .alias('o', 'output')
            .alias('h', 'header')
            .alias('b', 'baseUrl')
            .alias('m', 'mapPath')
            .alias('g', 'apiGatewayPath')
            .describe('v', 'Location of validator file or directory of the folder')
            .describe('o', 'Location of the output file location')
            .describe('h', 'Location of the header file in json format')
            .describe('r', 'For multiple files, will recursively search for .validator.js file in that directory')
            .describe('b', 'Override base url')
            .describe('m', 'Override redirect path')
            .describe('g', 'Api Gateway base path')
            .demandOption(['v','o','h'])
            .help('help')
            .example('joi-swagger-generator -r -v ./validators -h ./header.json -o ./swagger.json')
            .argv
            
const j2s = require('joi-to-swagger');
const path = require('path');
const fs = require('fs-extra');
const glob = require("glob")

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}
const baseUrl = argv.baseUrl ? argv.baseUrl : "http://${stageVariables.url}";
const relativeValidatorPath = argv.validator;
const validatorFile = path.resolve(relativeValidatorPath);

function applyLogic(json, apiList){
    const basePath = json.basePath;
    json.info.title = json.info.title + " " + process.env.NODE_ENV;
    json.info.description = json.info.description + " for " + process.env.NODE_ENV + " environment";

    json.paths = {};
    json.definitions = {};
    for(key in apiList) {
        const mapHeader = {};
        const requestMap = {};
        const currentValue = apiList[key];
    
        let paths;
        let convertedPath = path.join(basePath, currentValue.path);
        // const splitPath = convertedPath.split('/');
        // for(const i in splitPath){
        //     let eachPath = splitPath[i];
        //     if(eachPath.startsWith(":")){
        //         eachPath = eachPath.substr(1); //remove :
        //         eachPath = "{" + eachPath + "}";//make {path}
        //         splitPath[i] = eachPath;
        //     }
        // }
        convertedPath = convertPath(convertedPath);
        
        if(argv.apiGatewayPath){
            convertedPath = path.join(argv.apiGatewayPath, convertedPath);
        }

        if(json.paths[convertedPath]){
            paths = json.paths[convertedPath];
        } else {
            paths = {};
            json.paths[convertedPath] = paths;
        }
        
        let parameters = []
        //default response
        let responses = {
            '200': {
                description: 'Default response for CORS method',
                headers: {
                    'Access-Control-Allow-Headers': {
                        type: 'string'
                    },
                    'Access-Control-Allow-Methods': {
                        type: 'string'
                    },
                    'Access-Control-Allow-Origin': {
                        type: 'string'
                    }
                }
            }
        };
        let deprecated = false
        if(currentValue.JoiSchema){
            if(currentValue.JoiSchema.header){
                const {swagger} = j2s(currentValue.JoiSchema.header);
        
                for(headerKey in swagger.properties) {
                    parameters.push({
                        name: headerKey,
                        in: "header",
                        required: swagger.required.includes(headerKey),
                        type: swagger.properties[headerKey].type
                    });
                    requestMap[`integration.request.header.${headerKey}`] = `method.request.header.${headerKey}`;
                }
            }
            if(currentValue.JoiSchema.body){
                const {swagger} = j2s(currentValue.JoiSchema.body);
        
                const modelName = `${currentValue.name.replace(/\s/g, "")}${currentValue.type.capitalize()}Body`;
                json.definitions[modelName] = swagger;
                parameters.push({
                    name: "body",
                    in: "body",
                    schema: {
                        $ref: `#/definitions/${modelName}`
                    }
                    // schema: swagger
                });
            }
            if(currentValue.JoiSchema.path){
                const {swagger} = j2s(currentValue.JoiSchema.path);
        
                for(pathKey in swagger.properties) {
                    parameters.push({
                        name: pathKey,
                        in: "path",
                        required: true,
                        type: swagger.properties[pathKey].type
                    });
                }
            }
            if(currentValue.JoiSchema.params){
                const {swagger} = j2s(currentValue.JoiSchema.params);
        
                for(pathKey in swagger.properties) {
                    parameters.push({
                        name: pathKey,
                        in: "path",
                        required: true,
                        type: swagger.properties[pathKey].type
                    });
                }
            }
            if(currentValue.JoiSchema.query){
                const {swagger} = j2s(currentValue.JoiSchema.query);
                
                for(queryKey in swagger.properties) {
                    parameters.push({
                        name: queryKey,
                        in: "query",
                        required: swagger.required ? swagger.required.includes(queryKey) : false,
                        type: swagger.properties[queryKey].type
                    });
                }
            }
            if(currentValue.JoiSchema.response){
                responses = {};
                const {swagger} = j2s(currentValue.JoiSchema.response);
    
                for(statusCode in swagger.properties) {
                    const modelName = `${currentValue.name.replace(/\s/g, "")}${currentValue.type.capitalize()}${statusCode}Response`;
                    json.definitions[modelName] = swagger.properties[statusCode].properties.body;
    
                    const data = {
                        description: swagger.properties[statusCode].properties.description.enum[0],
                        schema: {
                            $ref: `#/definitions/${modelName}`
                        },
                    };
    
                    if(swagger.properties[statusCode].properties.header){
                        data['headers'] = swagger.properties[statusCode].properties.header.properties;
                    
                        for(headerName in swagger.properties[statusCode].properties.header.properties) {
                            mapHeader[`integration.response.header.${headerName}`] = `method.response.header.${headerName}`;
                        }
                    }
                    
                    if(statusCode >= 200 && statusCode < 400){
                        if(!data.headers){
                            data.headers = {};
                        }
                        data.headers['Access-Control-Allow-Headers'] = {
                            type: 'string'
                        };
                        data.headers['Access-Control-Allow-Methods'] = {
                            type: 'string'
                        };
                        data.headers['Access-Control-Allow-Origin'] = {
                            type: 'string'
                        };
                    }
                    responses[statusCode] = data;
                }
            }
            // check for deprecation
            if(currentValue.JoiSchema.deprecated && currentValue.JoiSchema.deprecated === true) {
                deprecated = true
            }
        }

        let apiGateway, corsApiGateway;
        if(argv.mapPath){
            let editedPath = path.join(argv.mapPath, currentValue.path);
            editedPath = convertPath(editedPath);

            apiGateway = getApiGatewayIntegration(currentValue, editedPath, mapHeader, requestMap);
            corsApiGateway = getCorsApiGatewayIntegration(editedPath, mapHeader, requestMap);
        } else {
            apiGateway = getApiGatewayIntegration(currentValue, convertedPath, mapHeader, requestMap);
            corsApiGateway = getCorsApiGatewayIntegration(convertedPath, mapHeader, requestMap);
        }
        
        paths[currentValue.type] = {
            summary: currentValue.name,
            consumes: [
                'application/json'
            ],
            produces: [
                'application/json'
            ],
            parameters,
            responses,
            deprecated,
            "x-amazon-apigateway-integration": apiGateway
        }
        
        if(!paths.options){
            paths['options'] = {
                summary: 'CORS Support',
                consumes: [
                    'application/json'
                ],
                produces: [
                    'application/json'
                ],
                parameters,
                "x-amazon-apigateway-integration": corsApiGateway,
                responses: {
                    '200': {
                        description: 'Default response for CORS method',
                        headers: {
                            'Access-Control-Allow-Headers': {
                                type: 'string'
                            },
                            'Access-Control-Allow-Methods': {
                                type: 'string'
                            },
                            'Access-Control-Allow-Origin': {
                                type: 'string'
                            }
                        }
                    }
                }
            }
        }
    }
    return json;
}

if(argv.r){
    glob(path.join(validatorFile, "**/*.validator.js"), function (er, files) {
        console.log(files);
        let requires = []
        files.forEach((value, index, array) => {
            requires.push(require(value))
        })

        const relativeHeaderPath = argv.header;
        const headerFile = path.resolve(relativeHeaderPath);
        if(!fs.pathExistsSync(headerFile)){
            return console.error(`Header file not found in ${headerFile}, please create header file first`);
        } else {
            try {
                fs.ensureFileSync(headerFile);
            } catch(e){
                return console.error(`Header file not found in ${headerFile}, please create header file first`);
            }
        }
        
        let json = require(headerFile);

        const relativeOutputFile = argv.output;
        if(!relativeOutputFile){
            return console.error("Output file location is required");
        }
        const outputFile = path.resolve(relativeOutputFile);
        
        json = applyLogic(json, requires)
        
        fs.outputFile(outputFile, JSON.stringify(json, null, 4), function(err){
            if(err) {
                console.error(err);
            } else {
                console.log('successfully write swagger file to ' + outputFile);
            }
        });
    })
} else {
    if(!fs.pathExistsSync(validatorFile)){
        return console.error(`Validator file not found in ${validatorFile}, please create validator file first`);
    } else {
        try {
            fs.ensureFileSync(validatorFile);
        } catch(e){
            return console.error(`Validator file not found in ${validatorFile}, please create validator file first`);
        }
    }
    const validator = require(validatorFile);
    
    const relativeHeaderPath = argv.header;
    const headerFile = path.resolve(relativeHeaderPath);
    if(!fs.pathExistsSync(headerFile)){
        return console.error(`Header file not found in ${headerFile}, please create header file first`);
    } else {
        try {
            fs.ensureFileSync(headerFile);
        } catch(e){
            return console.error(`Header file not found in ${headerFile}, please create header file first`);
        }
    }
    
    let json = require(headerFile);

    const relativeOutputFile = argv.output;
    if(!relativeOutputFile){
        return console.error("Output file location is required");
    }
    const outputFile = path.resolve(relativeOutputFile);

    json = applyLogic(json, validator.apiList);
    fs.outputFile(outputFile, JSON.stringify(json, null, 4), function(err){
        if(err) {
            console.error(err);
        } else {
            console.log('successfully write swagger file to ' + outputFile);
        }
    });
}

function convertPath(editedPath){
    const splitPath = editedPath.split('/');
    for(const i in splitPath){
        let eachPath = splitPath[i];
        if(eachPath.startsWith(":")){
            eachPath = eachPath.substr(1); //remove :
            eachPath = "{" + eachPath + "}";//make {path}
            splitPath[i] = eachPath;
        }
    }
    editedPath = splitPath.join('/');
    return editedPath;
}

function getApiGatewayIntegration(currentValue, convertedPath, mapHeader, requestMap){
    const apiGateway = {
        passthroughBehavior: "when_no_match",
        httpMethod: currentValue.type,
        type: "http_proxy",
        uri: baseUrl + convertedPath,
        responses: {
            default: {
                statusCode: '200',
                responseParameters: {
                    'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key'",
                    'method.response.header.Access-Control-Allow-Methods': "'*'",
                    'method.response.header.Access-Control-Allow-Origin': "'*'"
                }
            }
        }
    }
    let requestPath = {...requestMap};
    const splitPath = convertedPath.split('/');
    for(const i in splitPath){
        let eachPath = splitPath[i];
        if(eachPath.startsWith("{") && eachPath.endsWith("}")){
            const pathName = eachPath.slice(1, -1);
            const keyName = "integration.request.path." + pathName;
            const valueName = "method.request.path." + pathName;
            requestPath[keyName] = valueName;
        }
    }

    apiGateway["requestParameters"] = requestPath;
    apiGateway["responseParameters"] = mapHeader;
    return apiGateway;
}

function getCorsApiGatewayIntegration(convertedPath, mapHeader, requestMap){
    const apiGateway = {
        passthroughBehavior: "when_no_match",
        httpMethod: "options",
        type: "http_proxy",
        uri: baseUrl + convertedPath,
        responses: {
            default: {
                statusCode: '200',
                responseParameters: {
                    'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key'",
                    'method.response.header.Access-Control-Allow-Methods': "'*'",
                    'method.response.header.Access-Control-Allow-Origin': "'*'"
                }
            }
        }
    }
    let requestPath = {...requestMap};
    const splitPath = convertedPath.split('/');
    for(const i in splitPath){
        let eachPath = splitPath[i];
        if(eachPath.startsWith("{") && eachPath.endsWith("}")){
            const pathName = eachPath.slice(1, -1);
            const keyName = "integration.request.path." + pathName;
            const valueName = "method.request.path." + pathName;
            requestPath[keyName] = valueName;
        }
    }

    apiGateway["requestParameters"] = requestPath;
    apiGateway["responseParameters"] = mapHeader;
    return apiGateway;
}