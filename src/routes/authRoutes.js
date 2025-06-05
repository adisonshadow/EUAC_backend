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
 *     description: 用户登录接口，支持验证码验证
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
 *               captcha_data:
 *                 type: object
 *                 description: 验证码数据
 *                 properties:
 *                   captcha_id:
 *                     type: string
 *                     description: 验证码ID
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
 *                       description: 访问令牌
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     refresh_token:
 *                       type: string
 *                       description: 刷新令牌
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     expires_in:
 *                       type: string
 *                       description: 令牌过期时间
 *                       example: "2h"
 *                     user_id:
 *                       type: string
 *                       description: 用户ID
 *                       example: "550e8400-e29b-41d4-a716-446655440000"
 *       202:
 *         description: 需要验证码
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
 *                       example: true
 *       400:
 *         description: 参数错误或验证码无效
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
 *         description: 登录失败次数过多
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
 *                       example: "2024-03-21T11:00:00.000Z"
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
router.post('/login', authController.login);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     tags:
 *       - Auth
 *     summary: 刷新访问令牌
 *     description: 使用刷新令牌获取新的访问令牌
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
router.post('/refresh', authController.refreshToken);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     tags:
 *       - Auth
 *     summary: 用户登出
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
router.post('/logout', authController.logout);

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
 *     summary: 检查用户登录状态
 *     description: 检查当前用户的登录状态
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