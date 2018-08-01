A library to generate a swagger file from joi file. The output will be in json format.

Usage:
Define your joi validator class

Define the header.json file that will be used as the header information in the swagger file
The basePath will be join together with the path in validator class, in the example all url will be /users/*
```
{
    "swagger": "2.0",
    "info": {
        "description": "Identity account",
        "version": "1.0.0",
        "title": "Identity Service",
        "contact": {
            "email": "stephen_adipradhana@astro.com.my"
        }
    },
    "basePath": "/users",
    "schemes": [
        "http",
        "https"
    ]
}
```
There are 2 ways to define the file
First way is to define 1 specific file that will export all the apiList

You can install the package globally or just include them in the scripts in the package.json
```
    "swagger-generator": "joi-swagger-generator -v ./utils/validator.js -h ./swagger/header.json -o ./swagger/swagger.json"
```
```
-h is the path to the header file
-v is the path to your validator class
-o is the location of the swagger file will be generated
```

Example for 1 validator file
```
const Joi = require('joi')
const JoiPhone = Joi.extend(require('joi-phone-number'))

module.exports =  {
    name: 'Account Services',
    apiList: {
        healthCheck: {
            name: 'health check',
            path: '/health',
            type: 'get'
        },
        login: {
            name: 'login',
            path: '/login',
            type: 'post',
            JoiSchema: {
                body: Joi.object().keys({
                    password: Joi.string().required(),
                    email: Joi.string().email(),
                    phoneNumber: JoiPhone.string().phoneNumber({ defaultCountry: 'MY' })
                }).xor('email', 'phoneNumber'),

                response: {
                    200: {
                        description: "successfully login",
                        header: Joi.object().keys({
                                    Authorization: Joi.string().required()
                                }),
                        body: Joi.object().keys({
                            resultMessage: Joi.string().required(),
                            resultDescription: Joi.string().required(),
                            body: Joi.object().keys({
                                accessToken: Joi.string().required(),
                                refreshToken: Joi.string().required()
                            })
                        })
                    },
                    400: {
                        description: "invalid request body",
                        body: Joi.object().keys({
                            resultMessage: Joi.string().required(),
                            resultDescription: Joi.string().required()
                        })
                    },
                    401: {
                        description: "invalid credential",
                        body: Joi.object().keys({
                            resultMessage: Joi.string().required(),
                            resultDescription: Joi.string().required()
                        })
                    }
                }
            }
        }
    }
}
```

Second way is to define the directory, and the library will recursively look for *.validator.js files. Just add -r in the command to enable this option
```
joi-swagger-generator -r -v ./utils/ -h ./swagger/header.json -o ./swagger/swagger.json
```

Example for multiple validator file
```
const Joi = require('joi')
const JoiPhone = Joi.extend(require('joi-phone-number'))

module.exports =  {
    name: 'login',
    path: '/login',
    type: 'post',
    JoiSchema: {
        body: Joi.object().keys({
            password: Joi.string().required(),
            email: Joi.string().email(),
            phoneNumber: JoiPhone.string().phoneNumber({ defaultCountry: 'MY' })
        }).xor('email', 'phoneNumber'),
        response: {
            200: {
                description: "successfully login",
                header: Joi.object().keys({
                            Authorization: Joi.string().required()
                        }),
                body: Joi.object().keys({
                    resultMessage: Joi.string().required(),
                    resultDescription: Joi.string().required(),
                    body: Joi.object().keys({
                        accessToken: Joi.string().required(),
                        refreshToken: Joi.string().required()
                    })
                })
            },
            400: {
                description: "invalid request body",
                body: Joi.object().keys({
                    resultMessage: Joi.string().required(),
                    resultDescription: Joi.string().required()
                })
            },
            401: {
                description: "invalid credential",
                body: Joi.object().keys({
                    resultMessage: Joi.string().required(),
                    resultDescription: Joi.string().required()
                })
            }
        }
    }
}
```

Result example
```
{
    "swagger": "2.0",
    "info": {
        "description": "Identity account",
        "version": "1.0.0",
        "title": "Identity Service",
        "contact": {
            "email": "stephen_adipradhana@astro.com.my"
        }
    },
    "basePath": "/users",
    "schemes": [
        "http",
        "https"
    ],
    "paths": {
        "/users/health": {
            "get": {
                "summary": "health check",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "parameters": [],
                "responses": {
                    "200": {
                        "description": "success operation"
                    }
                },
                "x-amazon-apigateway-integration": {
                    "passthroughBehavior": "when_no_match",
                    "httpMethod": "get",
                    "type": "http_proxy",
                    "uri": "http://${stageVariables.url}/users/health",
                    "responses": {
                        "default": {
                            "statusCode": "200"
                        }
                    }
                }
            }
        },
        "/users/login": {
            "post": {
                "summary": "login",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "parameters": [
                    {
                        "name": "body",
                        "in": "body",
                        "schema": {
                            "$ref": "#/definitions/loginPostBody"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "successfully login",
                        "schema": {
                            "$ref": "#/definitions/loginPost200Response"
                        },
                        "headers": {
                            "Authorization": {
                                "type": "string"
                            }
                        }
                    },
                    "400": {
                        "description": "invalid request body",
                        "schema": {
                            "$ref": "#/definitions/loginPost400Response"
                        }
                    },
                    "401": {
                        "description": "invalid credential",
                        "schema": {
                            "$ref": "#/definitions/loginPost401Response"
                        }
                    }
                },
                "x-amazon-apigateway-integration": {
                    "passthroughBehavior": "when_no_match",
                    "httpMethod": "post",
                    "type": "http_proxy",
                    "uri": "http://${stageVariables.url}/users/login",
                    "responses": {
                        "default": {
                            "statusCode": "200"
                        }
                    }
                }
            }
        }
    },
    "definitions": {
        "loginPostBody": {
            "type": "object",
            "required": [
                "password"
            ],
            "properties": {
                "password": {
                    "type": "string"
                },
                "email": {
                    "type": "string",
                    "format": "email"
                },
                "phoneNumber": {
                    "type": "string"
                }
            }
        },
        "loginPost200Response": {
            "type": "object",
            "required": [
                "resultMessage",
                "resultDescription"
            ],
            "properties": {
                "resultMessage": {
                    "type": "string"
                },
                "resultDescription": {
                    "type": "string"
                },
                "body": {
                    "type": "object",
                    "required": [
                        "accessToken",
                        "refreshToken"
                    ],
                    "properties": {
                        "accessToken": {
                            "type": "string"
                        },
                        "refreshToken": {
                            "type": "string"
                        }
                    }
                }
            }
        },
        "loginPost400Response": {
            "type": "object",
            "required": [
                "resultMessage",
                "resultDescription"
            ],
            "properties": {
                "resultMessage": {
                    "type": "string"
                },
                "resultDescription": {
                    "type": "string"
                }
            }
        },
        "loginPost401Response": {
            "type": "object",
            "required": [
                "resultMessage",
                "resultDescription"
            ],
            "properties": {
                "resultMessage": {
                    "type": "string"
                },
                "resultDescription": {
                    "type": "string"
                }
            }
        }
    }
}
```