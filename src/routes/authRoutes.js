const Router = require('koa-router');
const authController = require('../controllers/authController');
const auth = require('../middlewares/auth');

const router = new Router({ prefix: '/api/v1/auth' });

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: 用户登录
 *     description: |
 *       用户登录接口，支持多种登录模式：
 *       
 *       1. **开发者登录模式**：在开发环境下设置 dev=true 可跳过验证码和登录限制检查
 *       2. **普通登录模式**：
 *          - 2.1 首次登录：输入 username、password，返回需要验证码
 *          - 2.2 验证码验证：输入 username、password、captcha_data 完成登录
 *       3. **SSO登录模式**：如果包含 application_id 则进入 SSO 模式，返回包含 SSO 信息
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: 用户名
 *                 example: admin
 *               password:
 *                 type: string
 *                 description: 密码
 *                 example: 123456
 *               dev:
 *                 type: boolean
 *                 description: |
 *                   开发者登录模式标志
 *                   - 仅在开发环境（NODE_ENV=development）下生效
 *                   - 设置为 true 时跳过验证码验证和登录限制检查
 *                   - 适用于开发测试场景
 *                 example: true
 *                 default: false
 *               application_id:
 *                 type: string
 *                 format: uuid
 *                 description: |
 *                   应用ID，用于SSO登录模式
 *                   - 如果提供且应用启用了SSO，将返回该应用的SSO配置信息
 *                   - 系统将使用应用的SSO salt作为JWT签名密钥
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               captcha_data:
 *                 type: object
 *                 description: |
 *                   验证码数据，用于普通登录模式的验证码验证步骤
 *                   - 在首次登录返回需要验证码后，需要提供此参数完成验证
 *                 properties:
 *                   captcha_id:
 *                     type: string
 *                     format: uuid
 *                     description: 验证码ID，从验证码接口获取
 *                     example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: 登录成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: 访问令牌，用于后续API调用认证
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     refresh_token:
 *                       type: string
 *                       description: 刷新令牌，用于获取新的访问令牌
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     expires_in:
 *                       type: string
 *                       description: 访问令牌过期时间
 *                       example: "2h"
 *                     user_id:
 *                       type: string
 *                       format: uuid
 *                       description: 用户ID
 *                       example: "550e8400-e29b-41d4-a716-446655440000"
 *                     sso:
 *                       type: object
 *                       description: |
 *                         SSO配置信息
 *                         - 仅当提供application_id且应用启用了SSO时返回
 *                         - 包含应用的SSO配置和相关信息
 *                       properties:
 *                         application_id:
 *                           type: string
 *                           format: uuid
 *                           description: 应用ID
 *                           example: "550e8400-e29b-41d4-a716-446655440000"
 *                         application_name:
 *                           type: string
 *                           description: 应用名称
 *                           example: "人力资源管理系统"
 *                         application_code:
 *                           type: string
 *                           description: 应用编码
 *                           example: "hrms"
 *                         sso_config:
 *                           type: object
 *                           description: 应用的SSO配置信息
 *                           properties:
 *                             salt:
 *                               type: string
 *                               description: SSO签名密钥
 *                               example: "sso_salt_key"
 *                             redirect_url:
 *                               type: string
 *                               description: SSO回调地址
 *                               example: "https://app.example.com/sso/callback"
 *       202:
 *         description: |
 *           需要验证码（普通登录模式步骤2.1）
 *           - 首次登录时，如果系统启用了验证码功能，会返回此状态
 *           - 客户端需要获取验证码并重新提交登录请求
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 202
 *                 message:
 *                   type: string
 *                   example: 需要验证码
 *                 data:
 *                   type: object
 *                   properties:
 *                     need_captcha:
 *                       type: boolean
 *                       description: 标识需要验证码
 *                       example: true
 *       400:
 *         description: |
 *           参数错误或验证码无效
 *           - 用户名或密码为空
 *           - 验证码无效或未验证
 *           - 用户已被删除
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 400
 *                 message:
 *                   type: string
 *                   example: 验证码无效或未验证
 *                 data:
 *                   type: null
 *                   example: null
 *       401:
 *         description: 用户名或密码错误
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 401
 *                 message:
 *                   type: string
 *                   example: 用户名或密码错误
 *                 data:
 *                   type: null
 *                   example: null
 *       403:
 *         description: 用户已被禁用
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 403
 *                 message:
 *                   type: string
 *                   example: 用户已被禁用
 *                 data:
 *                   type: null
 *                   example: null
 *       429:
 *         description: |
 *           登录失败次数过多（普通登录模式限制）
 *           - 一小时内登录失败超过5次
 *           - 开发者登录模式不受此限制
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 429
 *                 message:
 *                   type: string
 *                   example: 登录失败次数过多，请一小时后重试
 *                 data:
 *                   type: object
 *                   properties:
 *                     next_attempt_time:
 *                       type: string
 *                       format: date-time
 *                       description: 下次可尝试登录的时间
 *                       example: "2024-03-21T11:00:00.000Z"
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 500
 *                 message:
 *                   type: string
 *                   example: 服务器内部错误
 *                 data:
 *                   type: null
 *                   example: null
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     tags:
 *       - Auth
 *     summary: 刷新访问令牌 [需要认证]
 *     description: 使用刷新令牌获取新的访问令牌，支持第三方系统通过app参数刷新token
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refresh_token
 *             properties:
 *               refresh_token:
 *                 type: string
 *                 description: 刷新令牌
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               app:
 *                 type: string
 *                 format: uuid
 *                 description: 应用ID，用于第三方系统刷新token（可选）
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: 刷新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: 新的访问令牌
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     refresh_token:
 *                       type: string
 *                       description: 新的刷新令牌
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     expires_in:
 *                       type: string
 *                       description: 令牌过期时间
 *                       example: "2h"
 *       400:
 *         description: 请求参数错误或无效的应用ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 400
 *                 message:
 *                   type: string
 *                   example: 刷新令牌不能为空
 *                 data:
 *                   type: null
 *                   example: null
 *       401:
 *         description: 刷新令牌无效
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 401
 *                 message:
 *                   type: string
 *                   example: 刷新令牌无效或已过期
 *                 data:
 *                   type: null
 *                   example: null
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 500
 *                 message:
 *                   type: string
 *                   example: 服务器内部错误
 *                 data:
 *                   type: null
 *                   example: null
 */
router.post('/refresh', auth, authController.refreshToken);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     tags:
 *       - Auth
 *     summary: 用户登出 [需要认证]
 *     description: 用户登出接口，使当前访问令牌失效
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refresh_token:
 *                 type: string
 *                 description: 刷新令牌
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: 登出成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: 登出成功
 *                 data:
 *                   type: null
 *                   example: null
 *       401:
 *         description: 未登录
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 401
 *                 message:
 *                   type: string
 *                   example: 未授权
 *                 data:
 *                   type: null
 *                   example: null
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 500
 *                 message:
 *                   type: string
 *                   example: 服务器内部错误
 *                 data:
 *                   type: null
 *                   example: null
 */
router.post('/logout', auth, authController.logout);

/**
 * @swagger
 * /api/v1/auth/captcha:
 *   get:
 *     tags:
 *       - Auth
 *     summary: 获取验证码
 *     description: 获取登录验证码图片
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: 验证码生成成功
 *                 data:
 *                   type: object
 *                   properties:
 *                     captcha_id:
 *                       type: string
 *                       description: 验证码ID
 *                       example: "550e8400-e29b-41d4-a716-446655440000"
 *                     bg_url:
 *                       type: string
 *                       description: 背景图片URL
 *                       example: "https://example.com/bg.jpg"
 *                     puzzle_url:
 *                       type: string
 *                       description: 拼图图片URL
 *                       example: "https://example.com/puzzle.jpg"
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 500
 *                 message:
 *                   type: string
 *                   example: 服务器内部错误
 *                 data:
 *                   type: null
 *                   example: null
 */
router.get('/captcha', authController.getCaptcha);

/**
 * @swagger
 * /api/v1/auth/check:
 *   get:
 *     tags:
 *       - Auth
 *     summary: 检查用户登录状态 [需要认证]
 *     description: | 
 *       检查当前用户的登录状态，支持两种使用方式：
 *       
 *       1. **标准模式**：不传任何参数，使用默认JWT密钥验证token
 *       2. **SSO模式**：通过query参数app传递应用ID，使用对应应用的salt验证token
 *       
 *       **使用场景**：
 *       - 前端应用验证用户登录状态
 *       - 第三方系统验证SSO token有效性
 *       - 获取当前登录用户的详细信息
 *       
 *       **认证方式**：Bearer Token
 *       
 *       **响应说明**：
 *       - 200: 用户已登录，返回用户信息
 *       - 400: 无效的应用ID或SSO配置（仅SSO模式）
 *       - 401: 未登录或token无效
 *       - 500: 服务器内部错误
 *     parameters:
 *       - in: query
 *         name: app
 *         schema:
 *           type: string
 *           format: uuid
 *         required: false
 *         description: | 
 *           应用ID，用于SSO模式下的token验证
 *           
 *           **使用场景**：
 *           - 第三方系统需要验证特定应用的token
 *           - 使用应用特定的salt进行JWT验证
 *           
 *           **注意事项**：
 *           - 应用必须已启用SSO功能
 *           - 应用必须配置有效的salt
 *           - 不传此参数时使用默认JWT密钥验证
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 用户已登录
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: string
 *                       description: 用户ID
 *                       example: "550e8400-e29b-41d4-a716-446655440000"
 *                     username:
 *                       type: string
 *                       description: 用户名
 *                       example: "admin"
 *                     name:
 *                       type: string
 *                       description: 姓名
 *                       example: "管理员"
 *                     avatar:
 *                       type: string
 *                       description: 头像URL
 *                       example: "https://example.com/avatar.jpg"
 *                     gender:
 *                       type: string
 *                       description: 性别
 *                       example: "MALE"
 *                     email:
 *                       type: string
 *                       description: 邮箱
 *                       example: "admin@example.com"
 *                     phone:
 *                       type: string
 *                       description: 手机号
 *                       example: "13800138000"
 *                     status:
 *                       type: string
 *                       description: 状态
 *                       example: "ACTIVE"
 *                     department_id:
 *                       type: string
 *                       description: 部门ID
 *                       example: "550e8400-e29b-41d4-a716-446655440000"
 *       400:
 *         description: 无效的应用ID或SSO配置
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 400
 *                 message:
 *                   type: string
 *                   example: 无效的应用ID或SSO配置
 *                 data:
 *                   type: null
 *                   example: null
 *       401:
 *         description: 未登录或令牌无效
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 401
 *                 message:
 *                   type: string
 *                   example: 未提供认证令牌
 *                 data:
 *                   type: null
 *                   example: null
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 500
 *                 message:
 *                   type: string
 *                   example: 服务器内部错误
 *                 data:
 *                   type: null
 *                   example: null
 */
router.get('/check', auth, authController.checkAuth);

module.exports = router; 