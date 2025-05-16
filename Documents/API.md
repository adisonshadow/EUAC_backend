## 用户登出

### 请求
- **URL**: `/api/v1/auth/logout`
- **Method**: `POST`
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "refresh_token": "string"  // 刷新令牌
  }
  ```

### 响应
- **成功** (200):
  ```json
  {
    "code": 200,
    "message": "success",
    "data": null
  }
  ```
- **错误** (400):
  ```json
  {
    "code": 400,
    "message": "刷新令牌不能为空",
    "data": null
  }
  ```
- **错误** (401):
  ```json
  {
    "code": 401,
    "message": "未授权",
    "data": null
  }
  ```
- **错误** (500):
  ```json
  {
    "code": 500,
    "message": "服务器内部错误",
    "data": null
  }
  ```

### 说明
1. 需要提供有效的访问令牌（Bearer Token）
2. 需要提供当前有效的刷新令牌
3. 登出后会：
   - 将刷新令牌状态更新为 REVOKED
   - 记录登出操作日志
4. 登出后，该刷新令牌将无法用于获取新的访问令牌 