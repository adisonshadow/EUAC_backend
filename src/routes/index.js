const Router = require('koa-router');
const roleRoutes = require('./roleRoutes');
const userRoutes = require('./userRoutes');
const authRoutes = require('./authRoutes');
const permissionRoutes = require('./permissionRoutes');
const devRoutes = require('./devRoutes');
const uploadRoutes = require('./uploadRoutes');
const departmentRoutes = require('./departmentRoutes');
const captchaRoutes = require('./captchaRoutes');

const router = new Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         user_id:
 *           type: string
 *           format: uuid
 *         username:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         phone:
 *           type: string
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     Role:
 *       type: object
 *       properties:
 *         role_id:
 *           type: string
 *           format: uuid
 *         role_name:
 *           type: string
 *         code:
 *           type: string
 *         description:
 *           type: string
 *         status:
 *           type: string
 *           enum: [ACTIVE, ARCHIVED]
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     Permission:
 *       type: object
 *       properties:
 *         permission_id:
 *           type: string
 *           format: uuid
 *           description: 权限ID
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         name:
 *           type: string
 *           description: 权限名称
 *           example: "用户管理"
 *         code:
 *           type: string
 *           description: 权限编码
 *           example: "user:manage"
 *         description:
 *           type: string
 *           description: 权限描述
 *           example: "允许对用户进行增删改查操作"
 *         resource_type:
 *           type: string
 *           description: 资源类型
 *           enum: [MENU, BUTTON, API]
 *           example: "MENU"
 *         actions:
 *           type: array
 *           description: 操作类型列表
 *           items:
 *             type: string
 *             enum: [create, read, update, delete]
 *           example: ["create", "read", "update", "delete"]
 *         parent_id:
 *           type: string
 *           format: uuid
 *           description: 父权限ID
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *           description: 权限状态
 *           example: "ACTIVE"
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *           example: "2024-03-21T10:00:00.000Z"
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: 更新时间
 *           example: "2024-03-21T10:00:00.000Z"
 *     Department:
 *       type: object
 *       properties:
 *         department_id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         code:
 *           type: string
 *         parent_id:
 *           type: string
 *           format: uuid
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *         description:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     File:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         filename:
 *           type: string
 *         originalname:
 *           type: string
 *         mimetype:
 *           type: string
 *         size:
 *           type: integer
 *         path:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     Captcha:
 *       type: object
 *       properties:
 *         captcha_id:
 *           type: string
 *           format: uuid
 *         target_position:
 *           type: object
 *           properties:
 *             x:
 *               type: number
 *             y:
 *               type: number
 *         image:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         expires_at:
 *           type: string
 *           format: date-time
 *     Error:
 *       type: object
 *       properties:
 *         code:
 *           type: integer
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           nullable: true
 */

// 注册各个模块的路由
router.use(authRoutes.routes());
router.use(userRoutes.routes());
router.use(roleRoutes.routes());
router.use(permissionRoutes.routes());
router.use(departmentRoutes.routes());
router.use(devRoutes.routes());
router.use(uploadRoutes.routes());
router.use(captchaRoutes.routes());

module.exports = router; 