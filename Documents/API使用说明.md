# API 使用说明

## 基础信息

- API 基础路径: `http://localhost:3000/api/v1` （具体端口请参见配置文件）
- 所有请求都需要在 header 中携带 `Authorization: Bearer <token>` 进行身份验证
- 响应格式统一为 JSON，包含 `code`、`message` 和 `data` 字段

## 认证相关

### 登录获取 Token

```bash
POST /auth/login
Content-Type: application/json

{
  "username": "your_username",
  "password": "your_password"
}
```

响应示例：
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "your_username",
      "role": "admin"
    }
  }
}
```

## 文件上传

### 上传文件

```bash
POST /uploads
Content-Type: multipart/form-data
Authorization: Bearer <token>

参数：
- file: 文件
- type: 文件类型（image/video/document）
```

响应示例：
```json
{
  "code": 200,
  "message": "上传成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "image",
    "url": "/api/v1/uploads/images/550e8400-e29b-41d4-a716-446655440000",
    "thumbnailUrl": "/api/v1/uploads/images/550e8400-e29b-41d4-a716-446655440000?thumbnail=true",
    "size": 1024,
    "mimeType": "image/jpeg",
    "extension": ".jpg"
  }
}
```

### 获取文件

- 图片文件：`GET /uploads/images/{file_id}`
  - 支持缩略图：添加 `?thumbnail=true` 参数
  - 支持自定义尺寸：添加 `?width=100&height=100` 参数
  - 支持裁剪模式：添加 `?mode=cover` 或 `?mode=contain` 参数

- 其他文件：`GET /uploads/files/{file_id}`

## 用户管理

### 获取用户信息

```bash
GET /users/me
Authorization: Bearer <token>
```

### 获取用户列表

```bash
GET /users
Authorization: Bearer <token>

查询参数：
- page: 页码（默认1）
- limit: 每页数量（默认10）
- search: 搜索关键词
- role: 角色筛选
- status: 状态筛选
```

## 部门管理

### 获取部门列表

```bash
GET /departments
Authorization: Bearer <token>

查询参数：
- parentId: 父部门ID
- search: 搜索关键词
```

## 权限管理

### 获取权限列表

```bash
GET /permissions
Authorization: Bearer <token>

查询参数：
- type: 权限类型
- module: 模块名称
```

## 错误处理

API 返回的错误码说明：

- 200: 成功
- 400: 请求参数错误
- 401: 未认证或认证失败
- 403: 权限不足
- 404: 资源不存在
- 500: 服务器内部错误

错误响应示例：
```json
{
  "code": 400,
  "message": "参数错误",
  "data": null
}
```

## 注意事项

1. 所有需要认证的接口都必须在请求头中携带 token
2. 文件上传大小限制：
   - 图片：5MB
   - 视频：100MB
   - 文档：10MB
3. 支持的图片格式：jpg、jpeg、png、gif、webp
4. 支持的视频格式：mp4、webm、mov
5. 支持的文档格式：pdf、doc、docx

## 开发建议

1. 建议使用 axios 等 HTTP 客户端库进行请求
2. 实现请求拦截器统一添加 token
3. 实现响应拦截器统一处理错误
4. 文件上传建议使用 FormData
5. 图片处理建议使用 URL 参数控制尺寸和裁剪模式
