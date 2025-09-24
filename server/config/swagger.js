/**
 * OpenAPI/Swagger Documentation Configuration
 * Free API documentation using swagger-jsdoc and swagger-ui-express
 */

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { getVersionInfo } = require('../middleware/apiVersioning');

// Basic API Information
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Interview Master API',
      version: '1.0.0',
      description: 'A comprehensive API for managing technical interviews, assessments, and user authentication',
      contact: {
        name: 'API Support',
        email: 'support@interviewmaster.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server'
      },
      {
        url: 'https://api.interviewmaster.com/api',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for authentication'
        },
        apiVersion: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Version',
          description: 'API version header'
        }
      },
      schemas: {
        // Standard API Response
        APIResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indicates if the request was successful'
            },
            message: {
              type: 'string',
              description: 'Human-readable message'
            },
            data: {
              type: 'object',
              description: 'Response data (null if error)'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'ISO timestamp of the response'
            },
            errors: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/ValidationError'
              },
              description: 'Array of validation errors (if any)'
            },
            meta: {
              type: 'object',
              description: 'Additional metadata (pagination, etc.)'
            }
          },
          required: ['success', 'message', 'timestamp']
        },
        
        // Validation Error
        ValidationError: {
          type: 'object',
          properties: {
            field: {
              type: 'string',
              description: 'Field name that failed validation'
            },
            message: {
              type: 'string',
              description: 'Error message'
            },
            value: {
              description: 'The invalid value that was provided'
            }
          },
          required: ['field', 'message']
        },
        
        // User Schema
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique user identifier'
            },
            name: {
              type: 'string',
              description: 'User full name'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          },
          required: ['id', 'name', 'email']
        },
        
        // Authentication Request
        LoginRequest: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            password: {
              type: 'string',
              minLength: 6,
              description: 'User password'
            }
          },
          required: ['email', 'password']
        },
        
        // Registration Request
        RegisterRequest: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              minLength: 2,
              maxLength: 50,
              description: 'User full name'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            password: {
              type: 'string',
              minLength: 6,
              description: 'User password'
            }
          },
          required: ['name', 'email', 'password']
        },
        
        // Authentication Response
        AuthResponse: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              description: 'JWT authentication token'
            },
            user: {
              $ref: '#/components/schemas/User'
            }
          },
          required: ['token', 'user']
        },
        
        // Pagination Meta
        PaginationMeta: {
          type: 'object',
          properties: {
            pagination: {
              type: 'object',
              properties: {
                currentPage: {
                  type: 'integer',
                  minimum: 1
                },
                totalPages: {
                  type: 'integer',
                  minimum: 0
                },
                totalItems: {
                  type: 'integer',
                  minimum: 0
                },
                itemsPerPage: {
                  type: 'integer',
                  minimum: 1
                },
                hasNextPage: {
                  type: 'boolean'
                },
                hasPrevPage: {
                  type: 'boolean'
                }
              }
            }
          }
        }
      },
      
      responses: {
        // Common Responses
        Success: {
          description: 'Successful operation',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/APIResponse'
              }
            }
          }
        },
        
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/APIResponse' },
                  {
                    properties: {
                      success: { example: false },
                      message: { example: 'Validation failed' }
                    }
                  }
                ]
              }
            }
          }
        },
        
        Unauthorized: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/APIResponse' },
                  {
                    properties: {
                      success: { example: false },
                      message: { example: 'Unauthorized access' }
                    }
                  }
                ]
              }
            }
          }
        },
        
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/APIResponse' },
                  {
                    properties: {
                      success: { example: false },
                      message: { example: 'Resource not found' }
                    }
                  }
                ]
              }
            }
          }
        },
        
        ServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/APIResponse' },
                  {
                    properties: {
                      success: { example: false },
                      message: { example: 'Internal server error' }
                    }
                  }
                ]
              }
            }
          }
        }
      },
      
      parameters: {
        // Common Parameters
        ApiVersion: {
          name: 'X-API-Version',
          in: 'header',
          description: 'API version',
          schema: {
            type: 'string',
            enum: ['v1', 'v2'],
            default: 'v1'
          }
        },
        
        Page: {
          name: 'page',
          in: 'query',
          description: 'Page number for pagination',
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1
          }
        },
        
        Limit: {
          name: 'limit',
          in: 'query',
          description: 'Number of items per page',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 10
          }
        }
      }
    },
    
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './routes/*.js',
    './controllers/*.js',
    './middleware/*.js',
    './models/*.js'
  ]
};

// Generate OpenAPI specification
const specs = swaggerJsdoc(options);

// Swagger UI options
const swaggerOptions = {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    docExpansion: 'none'
  },
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 20px 0 }
    .swagger-ui .scheme-container { margin: 20px 0 }
  `,
  customSiteTitle: 'Interview Master API Documentation'
};

// Setup function for Express app
const setupSwagger = (app) => {
  // Add version info to specs
  specs.info.versionInfo = getVersionInfo();
  
  // Serve API documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));
  
  // Serve raw OpenAPI JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
  
  console.log('📚 API Documentation available at: http://localhost:5000/api-docs');
  console.log('📄 OpenAPI JSON available at: http://localhost:5000/api-docs.json');
};

module.exports = {
  setupSwagger,
  specs,
  swaggerOptions
};