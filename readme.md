A library to generate a swagger file from joi file. The output will be in json format.

Usage:
Define your joi validator class

Define the header.json file that will be used as the header information in the swagger file
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
