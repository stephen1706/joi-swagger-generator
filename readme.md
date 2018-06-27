A library to generate a swagger file from joi file. The output will be in json format.

Example:
Define your joi validator class
```

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
                    email: Joi.string().email().error(new Error(invalidEmailResponse)),
                    phoneNumber: JoiPhone.string().phoneNumber({ defaultCountry: 'MY' })
                    .error(new Error(invalidPhoneResponse))
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
        },
        register: {
            name: 'register',
            path: '/',
            type: 'post',
            JoiSchema: {
                body: Joi.object().keys({
                        password: Joi.string().required(),
                        email: Joi.string().email().error(new Error(invalidEmailResponse)),
                        phoneNumber: JoiPhone.string().phoneNumber({ defaultCountry: 'MY' })
                        .error(new Error(invalidPhoneResponse)),
                        partnerKey: Joi.string().required()                    
                    }).xor('email', 'phoneNumber'),
                response: Joi.object().keys({
                    200: {
                        description: "successfully register",
                        body: Joi.object().keys({
                            resultMessage: Joi.string().required(),
                            resultDescription: Joi.string().required(),
                            body: Joi.object().keys({
                                accountId: Joi.string().regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/).required()
                                .error(new Error(invalidUUIDResponse))
                            })
                        })
                    },
                    400: {
                        description: "invalid request body",
                        body: Joi.object().keys({
                            resultMessage: Joi.string().required(),
                            resultDescription: Joi.string().required()
                        })
                    }
                })
            }
        },
        getUserInfo: {
            name: 'get user info',
            path: '/:accountId',
            type: 'get',
            getPath: (accountId) => {
                return `/${accountId}`;
            },
            JoiSchema: {
                path: Joi.object().keys({
                    accountId: Joi.string().regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/).required()
                            .error(new Error(invalidUUIDResponse))
                }),
                response: {
                    200: {
                        description: "user found",
                        body: Joi.object().keys({
                            resultMessage: Joi.string().required(),
                            resultDescription: Joi.string().required(),
                            body: Joi.object().keys({
                                id: Joi.string().regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/).required(),
                                email: Joi.string().email().required(),
                                phoneNumber: JoiPhone.string().phoneNumber({ defaultCountry: 'MY' }),
                                primaryCredential: Joi.string().valid([EMAIL, PHONE_NUMBER, FACEBOOK, GOOGLE]).required(),
                                isVerified: Joi.boolean().required()
                            })
                        })
                    },
                    400: {
                        description: "user not found",
                        body: Joi.object().keys({
                            resultMessage: Joi.string().required(),
                            resultDescription: Joi.string().required()
                        })
                    }
                }
            }
        },
        isUserVerified: {
            name: 'is user verified',
            path: '/verify/:accountId',
            type: 'get',
            JoiSchema: {
                path: Joi.object().keys({
                    accountId: Joi.string().regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/).required()
                        .error(new Error(invalidUUIDResponse))
                }),
                response: {
                    200: {
                        description: "user found",
                        body: Joi.object().keys({
                            resultMessage: Joi.string().required(),
                            resultDescription: Joi.string().required(),
                            body: Joi.object().keys({
                                isVerified: Joi.boolean().required()
                            })
                        })
                    },
                    400: {
                        description: "user not found",
                        body: Joi.object().keys({
                            resultMessage: Joi.string().required(),
                            resultDescription: Joi.string().required()
                        })
                    }
                }
            }
        },
        verifyUser: {
            name: 'set user as verified',
            path: '/verify/:accountId',
            type: 'post',
            getPath: (accountId) => {
                return `/verify/${accountId}`;
            },
            JoiSchema: {
                path: Joi.object().keys({
                    accountId: Joi.string().required().regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/).required()
                        .error(new Error(invalidUUIDResponse))
                }),
                response: {
                    200: {
                        description: "user successfully verified",
                        body: Joi.object().keys({
                            resultMessage: Joi.string().required(),
                            resultDescription: Joi.string().required()
                        })
                    },
                    400: {
                        description: "user not found",
                        body: Joi.object().keys({
                            resultMessage: Joi.string().required(),
                            resultDescription: Joi.string().required()
                        })
                    },
                    422: {
                        description: "user already verified",
                        body: Joi.object().keys({
                            resultMessage: Joi.string().required(),
                            resultDescription: Joi.string().required()
                        })
                    }
                }
            }
        },
        refreshToken: {
            name: 'refresh access token',
            path: '/token',
            type: 'post',
            JoiSchema: {
                body: Joi.object().keys({
                    refreshToken: Joi.string().required()
                }),
                response: {
                    200: {
                        description: "token refreshed",
                        body: Joi.object().keys({
                            resultMessage: Joi.string().required(),
                            resultDescription: Joi.string().required(),
                            body: Joi.object().keys({
                                accessToken: Joi.string().required()
                            })
                        })
                    },
                    400: {
                        description: "invalid refresh token",
                        body: Joi.object().keys({
                            resultMessage: Joi.string().required(),
                            resultDescription: Joi.string().required()
                        })
                    }
                }
            }
        },
        google: {
            name: 'google login',
            path: '/google',
            type: 'post',
            JoiSchema: {
                body: Joi.object().keys({
                    accessToken: Joi.string().required()
                }),
                response: {
                    200: {
                        description: "successful login",
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
                        description: "invalid request",
                        body: Joi.object().keys({
                            resultMessage: Joi.string().required(),
                            resultDescription: Joi.string().required()
                        })
                    },
                    401: {
                        description: "invalid google token",
                        body: Joi.object().keys({
                            resultMessage: Joi.string().required(),
                            resultDescription: Joi.string().required()
                        })
                    }
                }
            }
        },
        facebook: {
            name: 'facebook login',
            path: '/facebook',
            type: 'post',
            JoiSchema: {
                body: Joi.object().keys({
                    accessToken: Joi.string().required()
                }),
                response: {
                    200: {
                        description: "successful login",
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
                        description: "invalid request",
                        body: Joi.object().keys({
                            resultMessage: Joi.string().required(),
                            resultDescription: Joi.string().required()
                        })
                    },
                    401: {
                        description: "invalid facebook token",
                        body: Joi.object().keys({
                            resultMessage: Joi.string().required(),
                            resultDescription: Joi.string().required()
                        })
                    }
                }
            }
        },
        updatePassword: {
            name: 'update password',
            path: '/password',
            type: 'post',
            JoiSchema: {
                header: Joi.object().keys({
                            Authorization: Joi.string().required()
                        }),
                body: Joi.object().keys({
                    oldPassword: Joi.string().required(),
                    newPassword: Joi.string().required()
                }),
                response: {
                    200: {
                        description: "successful update password",
                        body: Joi.object().keys({
                            resultMessage: Joi.string().required(),
                            resultDescription: Joi.string().required()
                        })
                    },
                    400: {
                        description: "invalid request",
                        body: Joi.object().keys({
                            resultMessage: Joi.string().required(),
                            resultDescription: Joi.string().required()
                        })
                    },
                    401: {
                        description: "invalid jwt token",
                        body: Joi.object().keys({
                            resultMessage: Joi.string().required(),
                            resultDescription: Joi.string().required()
                        })
                    }
                }
            }
        },
        requestResetPassword: {
            name: 'request reset password',
            path: '/reset-password',
            type: 'post',
            JoiSchema: {
                body: Joi.object().keys({
                    email: Joi.string().email().error(new Error(invalidEmailResponse)),
                    phoneNumber: JoiPhone.string().phoneNumber({ defaultCountry: 'MY' })
                    .error(new Error(invalidPhoneResponse)),
                }).xor('email', 'phoneNumber'),
                response: {
                    200: {
                        description: "request reset password success",
                        body: Joi.object().keys({
                            resultMessage: Joi.string().required(),
                            resultDescription: Joi.string().required()
                        })
                    },
                    400: {
                        description: "invalid request",
                        body: Joi.object().keys({
                            resultMessage: Joi.string().required(),
                            resultDescription: Joi.string().required()
                        })
                    }
                }
            }
        },
        validateResetPassword: {
            name: 'validate reset password',
            path: '/:accountId/password',
            type: 'put',
            getPath: (accountId) => {
                return `/${accountId}/password`;
            },
            JoiSchema: {
                path: Joi.object().keys({
                    accountId: Joi.string().required().regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/).required()
                        .error(new Error(invalidUUIDResponse))
                }),
                body:  Joi.object().keys({
                    token: Joi.string().required(),
                    newPassword: Joi.string().required()
                }),
                response: {
                    200: {
                        description: "reset password success",
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
                        description: "invalid request",
                        body: Joi.object().keys({
                            resultMessage: Joi.string().required(),
                            resultDescription: Joi.string().required()
                        })
                    },
                    401: {
                        description: "invalid token",
                        body: Joi.object().keys({
                            resultMessage: Joi.string().required(),
                            resultDescription: Joi.string().required()
                        })
                    }
                }
            }
           
        },
        getAccountId: {
            name: 'get account ID from email or password',
            path: '/',
            type: 'get',
            JoiSchema: {
                body: Joi.object().keys({
                        email: Joi.string().email().error(new Error(invalidEmailResponse)),
                        phoneNumber: JoiPhone.string().phoneNumber({ defaultCountry: 'MY' }).error(new Error(invalidPhoneResponse)),
                    }).xor('email', 'phoneNumber'),
                response: {
                    200: {
                        description: "get account success",
                        body: Joi.object().keys({
                            resultMessage: Joi.string().required(),
                            resultDescription: Joi.string().required(),
                            body: Joi.object().keys({
                                accountId: Joi.string().required().regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/).required()
                                    .error(new Error(invalidUUIDResponse))
                            })
                        })
                    },
                    400: {
                        description: "invalid request",
                        body: Joi.object().keys({
                            resultMessage: Joi.string().required(),
                            resultDescription: Joi.string().required()
                        })
                    }
                }
            }
        }
    }
};
```

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

You can install the package globally or just include them in the scripts in the package.json
```
    "swagger-generator": "joi-swagger-generator -v utils/validator.js -h swagger/header.json -o swagger/swagger.json"
```
```
-h is the path to the header file
-v is the path to your validator class
-o is the location of the swagger file will be generated
```