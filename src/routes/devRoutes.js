const Router = require('koa-router');
const RoleController = require('../controllers/roleController');
const router = new Router({
  prefix: '/api/v1/dev'
});

/**
 * @swagger
 * /api/v1/dev/login:
 *   post:
 *     tags:
 *       - Dev
 *     summary: 开发环境登录 [免Captcha等额外验证]
 *     description: 开发环境登录接口，无需验证码
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
 *                 example: "admin"
 *               password:
 *                 type: string
 *                 description: 密码
 *                 example: "123456"
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
 *       400:
 *         description: 参数错误
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
router.post('/login', RoleController.devLogin);

module.exports = router; 