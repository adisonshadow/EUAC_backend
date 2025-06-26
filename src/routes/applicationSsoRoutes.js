const Router = require('koa-router');
const ApplicationController = require('../controllers/applicationController');

const router = new Router({
  prefix: '/api/v1/applications-sso'
});

/**
 * @swagger
 * /api/v1/applications-sso/{id}:
 *   get:
 *     tags:
 *       - Applications SSO
 *     summary: 获取SSO应用信息
 *     description: 获取指定应用的SSO配置信息，用于SSO登录流程
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 应用ID
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
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     application_id:
 *                       type: string
 *                       format: uuid
 *                       description: 应用ID
 *                       example: "7913b18c-e3f2-4d40-8b6b-b0239c98fef6"
 *                     name:
 *                       type: string
 *                       description: 应用名称
 *                       example: "业务数据设计系统"
 *                     code:
 *                       type: string
 *                       description: 应用编码
 *                       example: "bdc"
 *                     status:
 *                       type: string
 *                       enum: [ACTIVE, DISABLED]
 *                       description: 应用状态
 *                       example: "ACTIVE"
 *                     sso_enabled:
 *                       type: boolean
 *                       description: 是否启用SSO
 *                       example: true
 *                     sso_config:
 *                       type: object
 *                       properties:
 *                         currentTimestample:
 *                           type: string
 *                           description: 当前时间戳
 *                           example: "1703123456789"
 *                         secret:
 *                           type: string
 *                           description: 使用bcrypt加密的时间戳
 *                           example: "$2a$10$xxxxxx"
 *                         protocol:
 *                           type: string
 *                           enum: [SAML, CAS, OIDC, OAuth]
 *                           description: SSO协议
 *                           example: "OAuth"
 *                         redirect_uri:
 *                           type: string
 *                           format: uri
 *                           description: SSO回调地址
 *                           example: "http://localhost:3300/sso-callback"
 *                     description:
 *                       type: string
 *                       nullable: true
 *                       description: 应用描述
 *                       example: null
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       description: 创建时间
 *                       example: "2025-06-15T14:24:25.599Z"
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       description: 更新时间
 *                       example: "2025-06-25T16:13:32.447Z"
 *       400:
 *         description: 请求参数错误或SSO未启用
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
 *                   example: "该应用未启用SSO"
 *                 data:
 *                   type: null
 *       404:
 *         description: 应用不存在
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 404
 *                 message:
 *                   type: string
 *                   example: "应用端不存在"
 *                 data:
 *                   type: null
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
 *                   example: "获取SSO应用信息失败"
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
router.get('/:id', ApplicationController.getSsoInfo);

module.exports = router;
