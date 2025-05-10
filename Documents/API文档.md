# UAC系统API文档

## 目录
1. [通用说明](#通用说明)
2. [用户管理API](#用户管理api)
3. [认证鉴权API](#认证鉴权api)
4. [权限控制API](#权限控制api)
5. [组织架构API](#组织架构api)

## 通用说明

### 基础信息
- 基础URL: `https://api.example.com/uac/v1`
- 所有请求和响应均使用JSON格式
- 字符编码：UTF-8

### 认证方式
- 使用Bearer Token认证
- 在请求头中添加：`Authorization: Bearer <token>`

### 通用响应格式
```json
{
    "code": 200,
    "message": "success",
    "data": {}
}
```

### 错误码说明
| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未认证或认证失败 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 用户管理API

### 1. 创建用户
- **接口**: POST `/users`
- **描述**: 创建新用户
- **请求体**:
```json
{
    "username": "string",
    "password": "string",
    "department_id": "integer"
}
```
- **响应**:
```json
{
    "code": 200,
    "message": "success",
    "data": {
        "user_id": "uuid",
        "username": "string",
        "created_at": "datetime"
    }
}
```

### 2. 更新用户信息
- **接口**: PUT `/users/{user_id}`
- **描述**: 更新指定用户的信息
- **请求体**:
```json
{
    "status": "string"
}
```
- **响应**:
```json
{
    "code": 200,
    "message": "success",
    "data": {
        "user_id": "uuid",
        "username": "string",
        "status": "string",
        "updated_at": "datetime"
    }
}
```

### 3. 获取用户列表
- **接口**: GET `/users`
- **描述**: 分页获取用户列表
- **查询参数**:
  - page: 页码（默认1）
  - size: 每页数量（默认20）
  - status: 用户状态
  - department_id: 部门ID
- **响应**:
```json
{
    "code": 200,
    "message": "success",
    "data": {
        "total": "integer",
        "items": [
            {
                "user_id": "uuid",
                "username": "string",
                "department_id": "integer",
                "status": "string",
                "created_at": "datetime",
                "updated_at": "datetime"
            }
        ],
        "page": "integer",
        "size": "integer"
    }
}
```

## 认证鉴权API

### 1. 用户登录
- **接口**: POST `/auth/login`
- **描述**: 用户登录获取token
- **请求体**:
```json
{
    "username": "string",
    "password": "string"
}
```
- **响应**:
```json
{
    "code": 200,
    "message": "success",
    "data": {
        "token": "string",
        "refresh_token": "string",
        "expires_in": "string"
    }
}
```
- **错误响应**:
```json
{
    "code": 401,
    "message": "登录失败次数过多，请一小时后重试",
    "data": null,
    "details": {
        "next_attempt_time": "2024-03-09T17:49:31.918Z"
    }
}
```
- **说明**:
  - 同一用户连续登录失败5次后，将在一小时内禁止登录
  - 登录失败时，会返回下次可尝试登录的时间

### 2. 刷新Token
- **接口**: POST `/auth/refresh`
- **描述**: 使用refresh_token获取新的access_token
- **请求体**:
```json
{
    "refresh_token": "string"
}
```
- **响应**: 返回新的token信息

### 3. 登出
- **接口**: POST `/auth/logout`
- **描述**: 用户登出，使token失效
- **响应**: 返回成功状态

## 权限控制API

### 1. 获取用户权限
- **接口**: GET `/permissions/user/{user_id}`
- **描述**: 获取指定用户的所有权限
- **响应**:
```json
{
    "code": 200,
    "message": "success",
    "data": {
        "roles": ["string"],
        "permissions": [
            {
                "resource_type": "string",
                "resource_id": "string",
                "action": "string",
                "conditions": {}
            }
        ]
    }
}
```

### 2. 分配角色
- **接口**: POST `/roles/assign`
- **描述**: 为用户分配角色
- **请求体**:
```json
{
    "user_id": "uuid",
    "role_ids": ["integer"]
}
```
- **响应**: 返回分配结果

### 3. 检查权限
- **接口**: POST `/permissions/check`
- **描述**: 检查用户是否有指定权限
- **请求体**:
```json
{
    "user_id": "uuid",
    "resource_type": "string",
    "resource_id": "string",
    "action": "string"
}
```
- **响应**: 返回权限检查结果

## 组织架构API

### 1. 创建部门
- **接口**: POST `/departments`
- **描述**: 创建新部门
- **请求体**:
```json
{
    "name": "string",
    "parent_id": "integer"
}
```
- **响应**: 返回创建的部门信息

### 2. 获取部门树
- **接口**: GET `/departments/tree`
- **描述**: 获取完整的部门树结构
- **响应**: 返回部门树形结构

### 3. 更新部门
- **接口**: PUT `/departments/{department_id}`
- **描述**: 更新部门信息
- **请求体**:
```json
{
    "name": "string",
    "parent_id": "integer"
}
```
- **响应**: 返回更新后的部门信息

### 4. 获取部门成员
- **接口**: GET `/departments/{department_id}/members`
- **描述**: 获取指定部门的所有成员
- **查询参数**:
  - include_children: 是否包含子部门成员（默认false）
- **响应**: 返回部门成员列表

## 数据权限API

### 1. 设置数据权限规则
- **接口**: POST `/data-permissions/rules`
- **描述**: 创建数据权限规则
- **请求体**:
```json
{
    "role_id": "integer",
    "resource_type": "string",
    "conditions": {
        "field": "string",
        "operator": "string",
        "value": "any"
    }
}
```
- **响应**: 返回创建的规则信息

### 2. 获取数据权限规则
- **接口**: GET `/data-permissions/rules`
- **描述**: 获取指定角色的数据权限规则
- **查询参数**:
  - role_id: 角色ID
  - resource_type: 资源类型
- **响应**: 返回权限规则列表

## 审计日志API

### 1. 获取操作日志
- **接口**: GET `/audit-logs`
- **描述**: 获取系统操作日志
- **查询参数**:
  - start_time: 开始时间
  - end_time: 结束时间
  - user_id: 操作用户ID
  - operation_type: 操作类型
- **响应**: 返回日志列表

### 2. 导出审计日志
- **接口**: GET `/audit-logs/export`
- **描述**: 导出审计日志
- **查询参数**: 同获取操作日志
- **响应**: 返回CSV文件下载链接
