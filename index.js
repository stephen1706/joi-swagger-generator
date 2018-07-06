#! /usr/bin/env node
const argv = require('yargs')
            .alias('v', 'validator')
            .alias('o', 'output')
            .alias('h', 'header')
            .argv
const j2s = require('joi-to-swagger');
const path = require('path');
const fs = require('fs-extra');
const glob = require("glob")

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}
const relativeValidatorPath = argv.validator;
const validatorFile = path.resolve(relativeValidatorPath);

if(argv.r){
    glob(path.join(validatorFile, "**/*.validator.js"), function (er, files) {
        console.log(files);
        let requires = []
        files.forEach((value, index, array) => {
            requires.push(require(value))
        })
        const json = require('./header.json');
        const relativeOutputFile = './output.json';
        if(!relativeOutputFile){
            return console.error("Output file location is required");
        }
        const outputFile = path.resolve(relativeOutputFile);
        
        json.paths = {};
        json.definitions = {};
        for(key in requires) {
            const currentValue = requires[key];
        
            let paths;
            let convertedPath = currentValue.path;
            const splitPath = currentValue.path.split('/');
            for(const i in splitPath){
                let eachPath = splitPath[i];
                if(eachPath.startsWith(":")){
                    eachPath = eachPath.substr(1); //remove :
                    eachPath = "{" + eachPath + "}";//make {path}
                    splitPath[i] = eachPath;
                }
            }
            convertedPath = splitPath.join('/');
            
            if(json.paths[convertedPath]){
                paths = json.paths[convertedPath];
            } else {
                paths = {};
                json.paths[convertedPath] = paths;
            }
            
            let parameters = []
            //default response
            let responses = {
                "200": {
                    "description": "success operation"
                }
            };
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
                    }
                }
                if(currentValue.JoiSchema.body){
                    const {swagger} = j2s(currentValue.JoiSchema.body);
            
                    const modelName = `${currentValue.name}${currentValue.type.capitalize()}Body`;
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
                if(currentValue.JoiSchema.query){
                    const {swagger} = j2s(currentValue.JoiSchema.query);
                    
                    for(queryKey in swagger.properties) {
                        parameters.push({
                            name: queryKey,
                            in: "query",
                            required: true,
                            type: swagger.properties[queryKey].type
                        });
                    }
                }
                if(currentValue.JoiSchema.response){
                    responses = {};
                    const {swagger} = j2s(currentValue.JoiSchema.response);
        
                    for(statusCode in swagger.properties) {
                        const modelName = `${currentValue.name}${currentValue.type.capitalize()}${statusCode}Response`;
                        json.definitions[modelName] = swagger.properties[statusCode].properties.body;
        
                        const data = {
                            description: swagger.properties[statusCode].properties.description.enum[0],
                            schema: {
                                $ref: `#/definitions/${modelName}`
                            },
                        };
        
                        if(swagger.properties[statusCode].properties.header){
                            data['headers'] = swagger.properties[statusCode].properties.header.properties;
                        }
                        
                        responses[statusCode] = data;
                    }
                }
            }
           
            const apiGateway = {
                passthroughBehavior: "when_no_match",
                httpMethod: currentValue.type,
                type: "http_proxy",
                uri: "http://${stageVariables.url}" + convertedPath,
                responses: {
                    default: {
                        statusCode: "200"
                    }
                }
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
                "x-amazon-apigateway-integration": apiGateway
            }
        }
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
    
    const json = require(headerFile);
    const relativeOutputFile = argv.output;
    if(!relativeOutputFile){
        return console.error("Output file location is required");
    }
    const outputFile = path.resolve(relativeOutputFile);
    
    json.paths = {};
    json.definitions = {};
    for(key in validator.apiList) {
        const currentValue = validator.apiList[key];
    
        let paths;
        let convertedPath = currentValue.path;
        const splitPath = currentValue.path.split('/');
        for(const i in splitPath){
            let eachPath = splitPath[i];
            if(eachPath.startsWith(":")){
                eachPath = eachPath.substr(1); //remove :
                eachPath = "{" + eachPath + "}";//make {path}
                splitPath[i] = eachPath;
            }
        }
        convertedPath = splitPath.join('/');
        
        if(json.paths[convertedPath]){
            paths = json.paths[convertedPath];
        } else {
            paths = {};
            json.paths[convertedPath] = paths;
        }
        
        let parameters = []
        //default response
        let responses = {
            "200": {
                "description": "success operation"
            }
        };
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
                }
            }
            if(currentValue.JoiSchema.body){
                const {swagger} = j2s(currentValue.JoiSchema.body);
        
                const modelName = `${key}${currentValue.type.capitalize()}Body`;
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
            if(currentValue.JoiSchema.query){
                const {swagger} = j2s(currentValue.JoiSchema.query);
                
                for(queryKey in swagger.properties) {
                    parameters.push({
                        name: queryKey,
                        in: "query",
                        required: true,
                        type: swagger.properties[queryKey].type
                    });
                }
            }
            if(currentValue.JoiSchema.response){
                responses = {};
                const {swagger} = j2s(currentValue.JoiSchema.response);
    
                for(statusCode in swagger.properties) {
                    const modelName = `${key}${currentValue.type.capitalize()}${statusCode}Response`;
                    json.definitions[modelName] = swagger.properties[statusCode].properties.body;
    
                    const data = {
                        description: swagger.properties[statusCode].properties.description.enum[0],
                        schema: {
                            $ref: `#/definitions/${modelName}`
                        },
                    };
    
                    if(swagger.properties[statusCode].properties.header){
                        data['headers'] = swagger.properties[statusCode].properties.header.properties;
                    }
                    
                    responses[statusCode] = data;
                }
            }
        }
       
        const apiGateway = {
            passthroughBehavior: "when_no_match",
            httpMethod: currentValue.type,
            type: "http_proxy",
            uri: "http://${stageVariables.url}" + convertedPath,
            responses: {
                default: {
                    statusCode: "200"
                }
            }
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
            "x-amazon-apigateway-integration": apiGateway
        }
    }
    
    fs.outputFile(outputFile, JSON.stringify(json, null, 4), function(err){
        if(err) {
            console.error(err);
        } else {
            console.log('successfully write swagger file to ' + outputFile);
        }
    });
}