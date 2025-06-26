const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'UAC API Documentation',
      version: '1.0.0',
      description: '用户认证和授权系统 API 文档',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: '开发服务器',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      responses: {
        400: {
          description: '请求参数错误',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  code: {
                    type: 'integer',
                    example: 400,
                  },
                  message: {
                    type: 'string',
                    example: '请求参数错误',
                  },
                  data: {
                    type: 'object',
                    nullable: true,
                  },
                },
              },
            },
          },
        },
        401: {
          description: '未授权',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  code: {
                    type: 'integer',
                    example: 401,
                  },
                  message: {
                    type: 'string',
                    example: '未授权',
                  },
                  data: {
                    type: 'object',
                    nullable: true,
                  },
                },
              },
            },
          },
        },
        403: {
          description: '禁止访问',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  code: {
                    type: 'integer',
                    example: 403,
                  },
                  message: {
                    type: 'string',
                    example: '禁止访问',
                  },
                  data: {
                    type: 'object',
                    nullable: true,
                  },
                },
              },
            },
          },
        },
        404: {
          description: '资源不存在',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  code: {
                    type: 'integer',
                    example: 404,
                  },
                  message: {
                    type: 'string',
                    example: '资源不存在',
                  },
                  data: {
                    type: 'object',
                    nullable: true,
                  },
                },
              },
            },
          },
        },
        500: {
          description: '服务器内部错误',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  code: {
                    type: 'integer',
                    example: 500,
                  },
                  message: {
                    type: 'string',
                    example: '服务器内部错误',
                  },
                  data: {
                    type: 'object',
                    nullable: true,
                  },
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    paths: {
      '/health': {
        get: {
          tags: ['System'],
          summary: '健康检查',
          responses: {
            '200': {
              description: '服务正常',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'integer',
                        example: 200
                      },
                      message: {
                        type: 'string',
                        example: 'success'
                      },
                      data: {
                        type: 'object',
                        properties: {
                          status: {
                            type: 'string',
                            example: 'ok'
                          },
                          timestamp: {
                            type: 'string',
                            format: 'date-time',
                            example: '2024-03-21T10:00:00.000Z'
                          },
                          version: {
                            type: 'string',
                            example: '1.0.0'
                          },
                          uptime: {
                            type: 'number',
                            example: 3600
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: '用户登录',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['username', 'password'],
                  properties: {
                    username: {
                      type: 'string',
                      example: 'admin'
                    },
                    password: {
                      type: 'string',
                      example: 'password123'
                    },
                    captcha_id: {
                      type: 'string',
                      format: 'uuid',
                      description: '验证码ID（如果需要验证码）'
                    },
                    captcha_value: {
                      type: 'string',
                      description: '验证码值（如果需要验证码）'
                    }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: '登录成功',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'integer',
                        example: 200
                      },
                      message: {
                        type: 'string',
                        example: 'success'
                      },
                      data: {
                        type: 'object',
                        properties: {
                          access_token: {
                            type: 'string',
                            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                          },
                          refresh_token: {
                            type: 'string',
                            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                          },
                          expires_in: {
                            type: 'integer',
                            example: 3600
                          },
                          user: {
                            type: 'object',
                            properties: {
                              user_id: {
                                type: 'string',
                                format: 'uuid',
                                example: '123e4567-e89b-12d3-a456-426614174000'
                              },
                              username: {
                                type: 'string',
                                example: 'admin'
                              },
                              name: {
                                type: 'string',
                                example: '管理员'
                              },
                              avatar: {
                                type: 'string',
                                example: '/api/v1/uploads/123e4567-e89b-12d3-a456-426614174000'
                              },
                              gender: {
                                type: 'string',
                                enum: ['MALE', 'FEMALE', 'OTHER'],
                                example: 'MALE'
                              },
                              email: {
                                type: 'string',
                                format: 'email',
                                example: 'admin@example.com'
                              },
                              phone: {
                                type: 'string',
                                example: '13800138000'
                              },
                              status: {
                                type: 'string',
                                enum: ['ACTIVE', 'DISABLED', 'ARCHIVED'],
                                example: 'ACTIVE'
                              },
                              department_id: {
                                type: 'string',
                                format: 'uuid',
                                example: '123e4567-e89b-12d3-a456-426614174001'
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            '202': {
              description: '需要验证码',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'integer',
                        example: 202
                      },
                      message: {
                        type: 'string',
                        example: '需要验证码'
                      },
                      data: {
                        type: 'object',
                        properties: {
                          need_captcha: {
                            type: 'boolean',
                            example: true
                          },
                          captcha_id: {
                            type: 'string',
                            format: 'uuid',
                            example: '123e4567-e89b-12d3-a456-426614174000'
                          },
                          bg_url: {
                            type: 'string',
                            example: '/api/v1/captcha/123e4567-e89b-12d3-a456-426614174000/bg'
                          },
                          puzzle_url: {
                            type: 'string',
                            example: '/api/v1/captcha/123e4567-e89b-12d3-a456-426614174000/puzzle'
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            '401': {
              description: '登录失败',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'integer',
                        example: 401
                      },
                      message: {
                        type: 'string',
                        example: '用户名或密码错误'
                      },
                      data: {
                        type: 'object',
                        nullable: true
                      }
                    }
                  }
                }
              }
            },
            '429': {
              description: '登录失败次数过多',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'integer',
                        example: 429
                      },
                      message: {
                        type: 'string',
                        example: '登录失败次数过多，请一小时后重试'
                      },
                      data: {
                        type: 'object',
                        properties: {
                          next_attempt_time: {
                            type: 'string',
                            format: 'date-time',
                            example: '2024-03-21T11:00:00.000Z'
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/auth/refresh': {
        post: {
          tags: ['Auth'],
          summary: '刷新访问令牌',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['refresh_token'],
                  properties: {
                    refresh_token: {
                      type: 'string',
                      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                    }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: '刷新成功',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'integer',
                        example: 200
                      },
                      message: {
                        type: 'string',
                        example: 'success'
                      },
                      data: {
                        type: 'object',
                        properties: {
                          access_token: {
                            type: 'string',
                            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                          },
                          expires_in: {
                            type: 'integer',
                            example: 3600
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            '401': {
              description: '刷新失败',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'integer',
                        example: 401
                      },
                      message: {
                        type: 'string',
                        example: '无效的刷新令牌'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/users': {
        get: {
          tags: ['Users'],
          summary: '获取用户列表',
          parameters: [
            {
              name: 'page',
              in: 'query',
              description: '页码',
              schema: {
                type: 'integer',
                default: 1
              }
            },
            {
              name: 'size',
              in: 'query',
              description: '每页数量',
              schema: {
                type: 'integer',
                default: 10
              }
            },
            {
              name: 'username',
              in: 'query',
              description: '用户名',
              schema: {
                type: 'string'
              }
            },
            {
              name: 'status',
              in: 'query',
              description: '状态',
              schema: {
                type: 'string',
                enum: ['active', 'DISABLED']
              }
            }
          ],
          responses: {
            '200': {
              description: '成功',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'integer',
                        example: 200
                      },
                      message: {
                        type: 'string',
                        example: 'success'
                      },
                      data: {
                        type: 'object',
                        properties: {
                          total: {
                            type: 'integer',
                            example: 100
                          },
                          items: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                user_id: {
                                  type: 'string',
                                  format: 'uuid',
                                  example: '123e4567-e89b-12d3-a456-426614174000'
                                },
                                username: {
                                  type: 'string',
                                  example: 'admin'
                                },
                                email: {
                                  type: 'string',
                                  format: 'email',
                                  example: 'admin@example.com'
                                },
                                status: {
                                  type: 'string',
                                  enum: ['active', 'DISABLED'],
                                  example: 'active'
                                },
                                created_at: {
                                  type: 'string',
                                  format: 'date-time',
                                  example: '2024-03-21T10:00:00.000Z'
                                }
                              }
                            }
                          },
                          current: {
                            type: 'integer',
                            example: 1
                          },
                          size: {
                            type: 'integer',
                            example: 10
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            '401': {
              description: '未授权',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'integer',
                        example: 401
                      },
                      message: {
                        type: 'string',
                        example: '未授权访问'
                      }
                    }
                  }
                }
              }
            }
          }
        },
        post: {
          tags: ['Users'],
          summary: '创建用户',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['username', 'password', 'email'],
                  properties: {
                    username: {
                      type: 'string',
                      example: 'newuser'
                    },
                    password: {
                      type: 'string',
                      example: 'password123'
                    },
                    email: {
                      type: 'string',
                      format: 'email',
                      example: 'newuser@example.com'
                    },
                    status: {
                      type: 'string',
                      enum: ['active', 'DISABLED'],
                      default: 'active',
                      example: 'active'
                    }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: '创建成功',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'integer',
                        example: 200
                      },
                      message: {
                        type: 'string',
                        example: 'success'
                      },
                      data: {
                        type: 'object',
                        properties: {
                          user_id: {
                            type: 'string',
                            format: 'uuid',
                            example: '123e4567-e89b-12d3-a456-426614174000'
                          },
                          username: {
                            type: 'string',
                            example: 'newuser'
                          },
                          email: {
                            type: 'string',
                            format: 'email',
                            example: 'newuser@example.com'
                          },
                          status: {
                            type: 'string',
                            enum: ['active', 'DISABLED'],
                            example: 'active'
                          },
                          created_at: {
                            type: 'string',
                            format: 'date-time',
                            example: '2024-03-21T10:00:00.000Z'
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            '400': {
              description: '请求参数错误',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'integer',
                        example: 400
                      },
                      message: {
                        type: 'string',
                        example: '用户名已存在'
                      }
                    }
                  }
                }
              }
            },
            '401': {
              description: '未授权',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'integer',
                        example: 401
                      },
                      message: {
                        type: 'string',
                        example: '未授权访问'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/users/{id}': {
        get: {
          tags: ['Users'],
          summary: '获取用户详情',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: '用户ID',
              schema: {
                type: 'string',
                format: 'uuid'
              }
            }
          ],
          responses: {
            '200': {
              description: '成功',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'integer',
                        example: 200
                      },
                      message: {
                        type: 'string',
                        example: 'success'
                      },
                      data: {
                        type: 'object',
                        properties: {
                          user_id: {
                            type: 'string',
                            format: 'uuid',
                            example: '123e4567-e89b-12d3-a456-426614174000'
                          },
                          username: {
                            type: 'string',
                            example: 'admin'
                          },
                          email: {
                            type: 'string',
                            format: 'email',
                            example: 'admin@example.com'
                          },
                          status: {
                            type: 'string',
                            enum: ['active', 'DISABLED'],
                            example: 'active'
                          },
                          created_at: {
                            type: 'string',
                            format: 'date-time',
                            example: '2024-03-21T10:00:00.000Z'
                          },
                          updated_at: {
                            type: 'string',
                            format: 'date-time',
                            example: '2024-03-21T10:00:00.000Z'
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            '404': {
              description: '用户不存在',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'integer',
                        example: 404
                      },
                      message: {
                        type: 'string',
                        example: '用户不存在'
                      }
                    }
                  }
                }
              }
            }
          }
        },
        put: {
          tags: ['Users'],
          summary: '更新用户',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: '用户ID',
              schema: {
                type: 'string',
                format: 'uuid'
              }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: {
                      type: 'string',
                      format: 'email',
                      example: 'updated@example.com'
                    },
                    status: {
                      type: 'string',
                      enum: ['active', 'DISABLED'],
                      example: 'active'
                    }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: '更新成功',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'integer',
                        example: 200
                      },
                      message: {
                        type: 'string',
                        example: 'success'
                      },
                      data: {
                        type: 'object',
                        properties: {
                          user_id: {
                            type: 'string',
                            format: 'uuid',
                            example: '123e4567-e89b-12d3-a456-426614174000'
                          },
                          username: {
                            type: 'string',
                            example: 'admin'
                          },
                          email: {
                            type: 'string',
                            format: 'email',
                            example: 'updated@example.com'
                          },
                          status: {
                            type: 'string',
                            enum: ['active', 'DISABLED'],
                            example: 'active'
                          },
                          updated_at: {
                            type: 'string',
                            format: 'date-time',
                            example: '2024-03-21T10:00:00.000Z'
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            '404': {
              description: '用户不存在',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'integer',
                        example: 404
                      },
                      message: {
                        type: 'string',
                        example: '用户不存在'
                      }
                    }
                  }
                }
              }
            }
          }
        },
        delete: {
          tags: ['Users'],
          summary: '删除用户',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: '用户ID',
              schema: {
                type: 'string',
                format: 'uuid'
              }
            }
          ],
          responses: {
            '200': {
              description: '删除成功',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'integer',
                        example: 200
                      },
                      message: {
                        type: 'string',
                        example: 'success'
                      }
                    }
                  }
                }
              }
            },
            '404': {
              description: '用户不存在',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'integer',
                        example: 404
                      },
                      message: {
                        type: 'string',
                        example: '用户不存在'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/departments': {
        get: {
          tags: ['Departments'],
          summary: '获取部门列表',
          description: '获取部门列表，支持分页和筛选。如果不提供分页参数，则返回所有记录。',
          parameters: [
            {
              name: 'page',
              in: 'query',
              description: '页码',
              schema: {
                type: 'integer',
                default: 1
              }
            },
            {
              name: 'size',
              in: 'query',
              description: '每页数量',
              schema: {
                type: 'integer',
                default: 10
              }
            },
            {
              name: 'name',
              in: 'query',
              description: '部门名称',
              schema: {
                type: 'string'
              }
            },
            {
              name: 'code',
              in: 'query',
              description: '部门编码',
              schema: {
                type: 'string'
              }
            },
            {
              name: 'status',
              in: 'query',
              description: '状态',
              schema: {
                type: 'string',
                enum: ['active', 'DISABLED']
              }
            }
          ],
          responses: {
            '200': {
              description: '成功',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'integer',
                        example: 200
                      },
                      message: {
                        type: 'string',
                        example: 'success'
                      },
                      data: {
                        type: 'object',
                        properties: {
                          total: {
                            type: 'integer',
                            example: 100
                          },
                          items: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                department_id: {
                                  type: 'string',
                                  format: 'uuid',
                                  example: '123e4567-e89b-12d3-a456-426614174000'
                                },
                                name: {
                                  type: 'string',
                                  example: '技术部'
                                },
                                code: {
                                  type: 'string',
                                  example: 'TECH'
                                },
                                parent_id: {
                                  type: 'string',
                                  format: 'uuid',
                                  example: '123e4567-e89b-12d3-a456-426614174000'
                                },
                                status: {
                                  type: 'string',
                                  enum: ['active', 'DISABLED'],
                                  example: 'active'
                                },
                                created_at: {
                                  type: 'string',
                                  format: 'date-time',
                                  example: '2024-03-21T10:00:00.000Z'
                                }
                              }
                            }
                          },
                          current: {
                            type: 'integer',
                            example: 1
                          },
                          size: {
                            type: 'integer',
                            example: 10
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            '401': {
              description: '未授权',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'integer',
                        example: 401
                      },
                      message: {
                        type: 'string',
                        example: '未授权访问'
                      }
                    }
                  }
                }
              }
            },
            '500': {
              description: '服务器错误',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'integer',
                        example: 500
                      },
                      message: {
                        type: 'string',
                        example: '服务器内部错误'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/uploads': {
        post: {
          tags: ['Upload'],
          summary: '上传图片',
          description: '上传图片并转换为 WebP 格式。支持 JPG、PNG、GIF 和 WebP 格式，文件大小限制为 5MB。',
          security: [
            {
              bearerAuth: []
            }
          ],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    file: {
                      type: 'string',
                      format: 'binary',
                      description: '图片文件'
                    }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: '上传成功',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'integer',
                        example: 200
                      },
                      message: {
                        type: 'string',
                        example: 'success'
                      },
                      data: {
                        type: 'object',
                        properties: {
                          file_id: {
                            type: 'string',
                            format: 'uuid',
                            example: '123e4567-e89b-12d3-a456-426614174000'
                          },
                          url: {
                            type: 'string',
                            example: '/api/v1/uploads/123e4567-e89b-12d3-a456-426614174000'
                          },
                          size: {
                            type: 'integer',
                            example: 102400
                          },
                          mime_type: {
                            type: 'string',
                            example: 'image/webp'
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            '400': {
              description: '请求错误',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'integer',
                        example: 400
                      },
                      message: {
                        type: 'string',
                        example: '只支持 JPG、PNG、GIF 和 WebP 格式的图片'
                      }
                    }
                  }
                }
              }
            },
            '401': {
              description: '未授权',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'integer',
                        example: 401
                      },
                      message: {
                        type: 'string',
                        example: '未授权访问'
                      }
                    }
                  }
                }
              }
            },
            '500': {
              description: '服务器错误',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'integer',
                        example: 500
                      },
                      message: {
                        type: 'string',
                        example: '图片上传失败'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/uploads/{file_id}': {
        get: {
          tags: ['Upload'],
          summary: '获取图片',
          description: '获取图片，支持生成缩略图。缩略图参数格式为：w-宽度_h-高度_m-模式，例如：w-100_h-100_m-cover。模式可选值：cover（默认，裁剪）或 contain（包含）。',
          security: [
            {
              bearerAuth: []
            }
          ],
          parameters: [
            {
              name: 'file_id',
              in: 'path',
              required: true,
              description: '文件ID',
              schema: {
                type: 'string',
                format: 'uuid'
              }
            },
            {
              name: 'thumb',
              in: 'query',
              description: '缩略图参数',
              schema: {
                type: 'string',
                example: 'w-100_h-100_m-cover'
              }
            }
          ],
          responses: {
            '200': {
              description: '成功',
              content: {
                'image/webp': {
                  schema: {
                    type: 'string',
                    format: 'binary'
                  }
                }
              }
            },
            '404': {
              description: '图片不存在',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'integer',
                        example: 404
                      },
                      message: {
                        type: 'string',
                        example: '图片不存在'
                      }
                    }
                  }
                }
              }
            },
            '500': {
              description: '服务器错误',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'integer',
                        example: 500
                      },
                      message: {
                        type: 'string',
                        example: '图片访问失败'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js'], // API 路由文件的路径
};

const swaggerSpec = swaggerJSDoc(options);

// 添加全局前缀
Object.keys(swaggerSpec.paths).forEach(path => {
  if (!path.startsWith('/api/v1')) {
    const newPath = `/api/v1${path}`;
    swaggerSpec.paths[newPath] = swaggerSpec.paths[path];
    delete swaggerSpec.paths[path];
  }
});

module.exports = swaggerSpec; 