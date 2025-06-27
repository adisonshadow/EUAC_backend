## UAC Backend

### 关于 UAC 

UAC 由 ( IAM + EMM ) 组成

IAM 系统是 Identity and Access Management（身份识别与访问管理），系统用于管理数字身份、控制用户对资源访问权限的技术框架，核心目标是确保合适的用户在合适的时间，以合适的权限访问合适的资源，同时保障系统和数据的安全性。

EMM 系统是 （企业Media管理），系统用于管理企业的图片、文档、视频等数字化生产资料。

本系统支持SSO服务。

---

通过聚焦业务场景的优化表述，能更直观理解产品如何解决实际管理痛点，同时弱化了技术实现细节，强化商业价值呈现。

### 引用链接
   本项目引用参考的[链接](./Documents/引用链接.md)

## 安装
1. 修改配置文件 ./config.json
   配置内容包括：数据库、API 配置、文件上传配置和日志配置。
   详细的配置说明请参考 [配置文件说明](./Documents/config.json.md)

2. 安装数据库
```bash
npm run init-db
# 在安装结束后，会初始化一个超级管理员 admin，验证
# 请在初始化结束后删除超级管理员

# 开发测试：初始化数据结构及模拟数据，注意这一步会清空已有数据
npm run init-db-with-mock
```

### 启动后调试

```bash
# 检查API服务健康状态
curl -s http://localhost:3000/api/v1/health

```

### API文档
- Web API 文档  
http://localhost:3000/swagger

- Open API 地址  
http://localhost:3000/swagger.json | [swagger.json 代码](./swagger.json)

### 日志使用说明
本项目配置并使用日志系统，[详细说明](./Documents/日志使用说明.md)


### 数据库表维护操作
数据库表维护操作包括 VACUUM、ANALYZE 和 REINDEX，用于清理死元组、更新统计信息以及重建索引，确保数据库性能。  
可通过以下命令执行维护操作：

```bash
# 执行所有维护操作（VACUUM、ANALYZE、REINDEX）
yarn db:maintenance:all

# 单独执行 VACUUM 操作
yarn db:vacuum

# 单独执行 ANALYZE 操作
yarn db:analyze

# 单独执行 REINDEX 操作
yarn db:reindex
```

