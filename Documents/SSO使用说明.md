# SSO 使用说明

## 概述

本系统支持单点登录（SSO）功能，允许第三方应用通过统一的认证系统进行用户身份验证。每个第三方应用可以配置独立的SSO参数，使用独立的JWT签名密钥，确保安全性和隔离性。

## 功能特性

- **多协议支持**：支持 SAML、CAS、OIDC、OAuth 等主流SSO协议
- **独立配置**：每个应用可配置独立的SSO参数和签名密钥
- **动态JWT**：使用应用特定的salt作为JWT签名密钥
- **向后兼容**：支持传统JWT认证和SSO认证并存
- **安全隔离**：不同应用使用不同的签名密钥，确保安全隔离

## 系统架构

```
第三方应用 ←→ UAC认证中心 ←→ 用户数据库
     ↑              ↑
  应用配置      统一认证
  独立salt     动态JWT
```

## 接入流程

### 1. 应用注册

首先需要在UAC系统中注册您的应用：

```bash
POST /api/v1/applications
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "您的应用名称",
  "code": "your-app-code",
  "sso_enabled": true,
  "sso_config": {
    "protocol": "OIDC",
    "redirect_uri": "https://your-app.com/auth/callback",
    "salt": "your-app-specific-salt-123",
    "additional_params": {
      "client_id": "your-client-id",
      "client_secret": "your-client-secret",
      "issuer": "https://sso.example.com"
    }
  },
  "description": "您的应用描述"
}
```

### 2. 获取应用ID

注册成功后，系统会返回应用的唯一标识符：

```json
{
  "code": 201,
  "message": "应用端创建成功",
  "data": {
    "application_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "您的应用名称",
    "code": "your-app-code",
    "sso_enabled": true,
    "sso_config": {
      "protocol": "OIDC",
      "redirect_uri": "https://your-app.com/auth/callback",
      "salt": "your-app-specific-salt-123",
      "additional_params": {
        "client_id": "your-client-id",
        "client_secret": "your-client-secret",
        "issuer": "https://sso.example.com"
      }
    }
  }
}
```

**重要**：请保存好 `application_id` 和 `salt`，这些是后续SSO认证的关键参数。

## API 使用指南

### 1. 用户登录（获取SSO配置）

**接口**：`POST /api/v1/auth/login`

**功能**：用户登录并获取应用的SSO配置信息

**请求示例**：
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "user_password",
  "application_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**响应示例**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": "24h",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "sso": {
      "application_id": "550e8400-e29b-41d4-a716-446655440000",
      "application_name": "您的应用名称",
      "application_code": "your-app-code",
      "sso_config": {
        "protocol": "OIDC",
        "redirect_uri": "https://your-app.com/auth/callback",
        "salt": "your-app-specific-salt-123",
        "additional_params": {
          "client_id": "your-client-id",
          "client_secret": "your-client-secret",
          "issuer": "https://sso.example.com"
        }
      }
    }
  }
}
```

### 登录后回调到业务系统的数据 

POST 跳转到 redirect_uri

```json
idp: IAM // SSO Code
access_token: eyJhbGciOiJIUzI1NiI
refresh_token: eyJhbGciOiJIUzI1NiIsInR5cCI
token_type: Bearer
expires_in: 3600
state: // 从业务系统带进来的参数将如数奉还
verify: `{"timestample":"1750923564236","public_secret":"$2a$10$j6YrQ"}`
user_info: `{"user_id":"10000000-0000-0000-0000-000000000001","username":"admin","name":"admin","email":"admin@test.com","phone":"18622223333","gender":"MALE","status":"ACTIVE","department_id":null}`

```
public_secret：业务系统 通过 预存的 Salt 来验证 是否是合法的 SSO：
业务系统使用预存的同样的salt，对收到的 verify.timestample 进行 bcrypt 加密，复杂度为 10，
然后对比 public_secret ，如果一致说明验证通过，否则说明来源不合法

**说明**：
- 返回的 `token` 和 `refresh_token` 使用应用的 `salt` 签名
- `sso` 对象包含完整的SSO配置信息
- 第三方应用可以使用这些配置进行SSO流程

### 2. 验证用户Token

**接口**：`GET /api/v1/auth/check`

**功能**：检查当前用户的登录状态，支持两种使用方式

**接口描述**：
- **标准模式**：不传任何参数，使用默认JWT密钥验证token
- **SSO模式**：通过query参数app传递应用ID，使用对应应用的salt验证token

**使用场景**：
- 前端应用验证用户登录状态
- 第三方系统验证SSO token有效性
- 获取当前登录用户的详细信息

**认证方式**：Bearer Token

**参数说明**：
- `app` (可选): 应用ID，用于SSO模式下的token验证
  - **使用场景**：第三方系统需要验证特定应用的token
  - **注意事项**：
    - 应用必须已启用SSO功能
    - 应用必须配置有效的salt
    - 不传此参数时使用默认JWT密钥验证

**请求示例**：

**标准模式**：
```bash
GET /api/v1/auth/check
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**SSO模式**：
```bash
GET /api/v1/auth/check?app=550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**响应示例**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "user@example.com",
    "name": "张三",
    "avatar": "https://example.com/avatar.jpg",
    "gender": "MALE",
    "email": "user@example.com",
    "phone": "13800138000",
    "status": "ACTIVE",
    "department_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**响应状态码说明**：
- **200**: 用户已登录，返回用户信息
- **400**: 无效的应用ID或SSO配置（仅SSO模式）
- **401**: 未登录或token无效
- **500**: 服务器内部错误

**说明**：
- 使用查询参数 `app` 传递应用ID
- 系统会使用对应应用的 `salt` 验证token
- 验证成功返回用户详细信息
- 支持标准模式和SSO模式两种验证方式

**接口**：`POST /api/v1/auth/refresh`

**功能**：使用刷新token获取新的访问token（支持第三方应用）

**请求示例**：
```bash
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "app": "550e8400-e29b-41d4-a716-446655440000"
}
```

**响应示例**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": "24h"
  }
}
```

**说明**：
- 使用请求体参数 `app` 传递应用ID
- 系统会使用对应应用的 `salt` 生成新的token
- 返回新的访问token和刷新token

## 错误处理

### 常见错误码

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| 400 | 无效的应用ID或SSO配置 | 检查application_id是否正确，确认应用已启用SSO |
| 401 | 用户名或密码错误 | 检查用户凭据是否正确 |
| 401 | 刷新令牌无效或已过期 | 重新登录获取新的刷新令牌 |
| 401 | 未提供认证令牌 | 在请求头中添加Authorization: Bearer <token> |
| 403 | 用户已被禁用 | 联系管理员激活用户账户 |
| 429 | 登录失败次数过多 | 等待一小时后重试 |

### 错误响应示例

```json
{
  "code": 400,
  "message": "无效的应用ID或SSO配置",
  "data": null
}
```

## 安全建议

### 1. Salt管理
- 为每个应用生成唯一的、足够复杂的salt
- 定期更换salt，更换后需要重新登录所有用户
- 不要在客户端代码中硬编码salt

### 2. Token管理
- 及时刷新过期的token
- 在用户登出时撤销refresh_token
- 不要在localStorage中存储敏感信息

### 3. 传输安全
- 使用HTTPS进行所有API调用
- 验证服务器证书的有效性
- 不要在URL中传递敏感参数

## 集成示例

### JavaScript/Node.js 示例

```javascript
class SSOClient {
  constructor(baseUrl, applicationId) {
    this.baseUrl = baseUrl;
    this.applicationId = applicationId;
    this.token = null;
    this.refreshToken = null;
  }

  // 用户登录
  async login(username, password) {
    const response = await fetch(`${this.baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
        application_id: this.applicationId
      })
    });

    const data = await response.json();
    if (data.code === 200) {
      this.token = data.data.token;
      this.refreshToken = data.data.refresh_token;
      return data.data;
    } else {
      throw new Error(data.message);
    }
  }

  // 验证token
  async checkAuth() {
    const response = await fetch(
      `${this.baseUrl}/api/v1/auth/check?app=${this.applicationId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      }
    );

    const data = await response.json();
    if (data.code === 200) {
      return data.data;
    } else {
      throw new Error(data.message);
    }
  }

  // 刷新token
  async refreshToken() {
    const response = await fetch(`${this.baseUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: this.refreshToken,
        app: this.applicationId
      })
    });

    const data = await response.json();
    if (data.code === 200) {
      this.token = data.data.token;
      this.refreshToken = data.data.refresh_token;
      return data.data;
    } else {
      throw new Error(data.message);
    }
  }

  // 用户登出
  async logout() {
    const response = await fetch(`${this.baseUrl}/api/v1/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: this.refreshToken
      })
    });

    this.token = null;
    this.refreshToken = null;
    return response.json();
  }
}

// 使用示例
const ssoClient = new SSOClient('https://uac.example.com', '550e8400-e29b-41d4-a716-446655440000');

// 登录
try {
  const userData = await ssoClient.login('user@example.com', 'password');
  console.log('登录成功:', userData);
} catch (error) {
  console.error('登录失败:', error.message);
}

// 验证token
try {
  const userInfo = await ssoClient.checkAuth();
  console.log('用户信息:', userInfo);
} catch (error) {
  console.error('验证失败:', error.message);
}
```

### Python 示例

```python
import requests
import json

class SSOClient:
    def __init__(self, base_url, application_id):
        self.base_url = base_url
        self.application_id = application_id
        self.token = None
        self.refresh_token = None

    def login(self, username, password):
        """用户登录"""
        url = f"{self.base_url}/api/v1/auth/login"
        data = {
            "username": username,
            "password": password,
            "application_id": self.application_id
        }
        
        response = requests.post(url, json=data)
        result = response.json()
        
        if result["code"] == 200:
            self.token = result["data"]["token"]
            self.refresh_token = result["data"]["refresh_token"]
            return result["data"]
        else:
            raise Exception(result["message"])

    def check_auth(self):
        """验证token"""
        url = f"{self.base_url}/api/v1/auth/check?app={self.application_id}"
        headers = {"Authorization": f"Bearer {self.token}"}
        
        response = requests.get(url, headers=headers)
        result = response.json()
        
        if result["code"] == 200:
            return result["data"]
        else:
            raise Exception(result["message"])

    def refresh_token(self):
        """刷新token"""
        url = f"{self.base_url}/api/v1/auth/refresh"
        data = {
            "refresh_token": self.refresh_token,
            "app": self.application_id
        }
        
        response = requests.post(url, json=data)
        result = response.json()
        
        if result["code"] == 200:
            self.token = result["data"]["token"]
            self.refresh_token = result["data"]["refresh_token"]
            return result["data"]
        else:
            raise Exception(result["message"])

    def logout(self):
        """用户登出"""
        url = f"{self.base_url}/api/v1/auth/logout"
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        data = {"refresh_token": self.refresh_token}
        
        response = requests.post(url, headers=headers, json=data)
        self.token = None
        self.refresh_token = None
        return response.json()

# 使用示例
sso_client = SSOClient("https://uac.example.com", "550e8400-e29b-41d4-a716-446655440000")

try:
    # 登录
    user_data = sso_client.login("user@example.com", "password")
    print("登录成功:", user_data)
    
    # 验证token
    user_info = sso_client.check_auth()
    print("用户信息:", user_info)
    
    # 登出
    sso_client.logout()
    print("登出成功")
    
except Exception as e:
    print("操作失败:", str(e))
```

## 最佳实践

### 1. 错误处理
- 实现完善的错误处理机制
- 对网络错误和API错误进行区分处理
- 提供用户友好的错误提示

### 2. Token管理
- 实现token自动刷新机制
- 在token即将过期时主动刷新
- 处理并发请求时的token刷新

### 3. 用户体验
- 实现单点登录体验
- 提供登录状态持久化
- 实现自动登录功能

### 4. 安全性
- 定期更换应用salt
- 监控异常登录行为
- 实现登录日志记录

## 常见问题

### Q: 如何更换应用的salt？
A: 通过更新应用的SSO配置来更换salt，更换后所有用户需要重新登录。

### Q: 支持哪些SSO协议？
A: 目前支持SAML、CAS、OIDC、OAuth等主流协议，具体配置在additional_params中。

### Q: 如何处理token过期？
A: 使用refresh_token调用刷新接口获取新的token，如果refresh_token也过期则需要重新登录。

### Q: 是否支持多应用同时登录？
A: 支持，每个应用使用独立的salt，token不会冲突。

### Q: 如何实现单点登出？
A: 调用logout接口撤销refresh_token，用户需要重新登录才能访问受保护的资源。


---

**版本**：1.0  
**更新时间**：2024年3月  
**维护团队**：UAC开发团队 