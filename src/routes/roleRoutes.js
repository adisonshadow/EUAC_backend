const Router = require('koa-router');
const RoleController = require('../controllers/roleController');
const router = new Router({
  prefix: '/api/v1/roles'
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Role:
 *       type: object
 *       properties:
 *         role_id:
 *           type: string
 *           format: uuid
 *           description: 角色ID
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         role_name:
 *           type: string
 *           description: 角色名称
 *           example: "管理员"
 *         code:
 *           type: string
 *           description: 角色编码
 *           example: "ADMIN"
 *         description:
 *           type: string
 *           description: 角色描述
 *           example: "系统管理员角色"
 *         status:
 *           type: string
 *           enum: [ACTIVE, DISABLED, ARCHIVED]
 *           description: 角色状态
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
 *         deleted_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: 删除时间
 *           example: null
 *         permissions:
 *           type: array
 *           description: 角色拥有的权限列表
 *           items:
 *             $ref: '#/components/schemas/RolePermission'
 *     RolePermission:
 *       type: object
 *       properties:
 *         permission_id:
 *           type: string
 *           format: uuid
 *           description: 权限ID
 *           example: "550e8400-e29b-41d4-a716-446655440001"
 *         name:
 *           type: string
 *           description: 权限名称
 *           example: "用户管理"
 *         code:
 *           type: string
 *           description: 权限编码
 *           example: "user:manage"
 *         resource_type:
 *           type: string
 *           enum: [MENU, BUTTON, API]
 *           description: 资源类型
 *           example: "API"
 *         actions:
 *           type: array
 *           description: 操作类型列表
 *           items:
 *             type: string
 *             enum: [create, read, update, delete]
 *           example: ["create", "read", "update", "delete"]
 *     RoleListResponse:
 *       type: object
 *       properties:
 *         code:
 *           type: integer
 *           example: 200
 *         message:
 *           type: string
 *           example: "获取角色列表成功"
 *         data:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *               description: 总记录数
 *               example: 10
 *             items:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Role'
 *             page:
 *               type: integer
 *               description: 当前页码
 *               example: 1
 *             size:
 *               type: integer
 *               description: 每页数量
 *               example: 10
 *     RoleResponse:
 *       type: object
 *       properties:
 *         code:
 *           type: integer
 *           example: 200
 *         message:
 *           type: string
 *           example: "操作成功"
 *         data:
 *           $ref: '#/components/schemas/Role'
 */

/**
 * @swagger
 * /api/v1/roles:
 *   post:
 *     tags:
 *       - Roles
 *     summary: 创建角色
 *     description: 创建新角色
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role_name
 *               - code
 *             properties:
 *               role_name:
 *                 type: string
 *                 description: 角色名称
 *                 example: "管理员"
 *               code:
 *                 type: string
 *                 description: 角色编码
 *                 example: "ADMIN"
 *               description:
 *                 type: string
 *                 description: 角色描述
 *                 example: "系统管理员角色"
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, DISABLED, ARCHIVED]
 *                 default: ACTIVE
 *                 description: 角色状态
 *                 example: "ACTIVE"
 *     responses:
 *       201:
 *         description: 创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoleResponse'
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
 *                   example: 角色名称和编码不能为空
 *                 data:
 *                   type: null
 *                   example: null
 *       401:
 *         description: 未授权
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
router.post('/', RoleController.create);

/**
 * @swagger
 * /api/v1/roles:
 *   get:
 *     tags:
 *       - Roles
 *     summary: 获取角色列表
 *     description: 获取所有角色列表，支持分页和状态筛选
 *     parameters:
 *       - name: page
 *         in: query
 *         type: integer
 *         description: 页码
 *       - name: size
 *         in: query
 *         type: integer
 *         description: 每页数量
 *       - name: status
 *         in: query
 *         type: string
 *         enum: [ACTIVE, ARCHIVED]
 *         description: 角色状态
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoleListResponse'
 *       500:
 *         description: 服务器错误
 */
router.get('/', RoleController.list);

/**
 * @swagger
 * /api/v1/roles/{role_id}:
 *   get:
 *     tags:
 *       - Roles
 *     summary: 获取角色详情
 *     description: 获取指定角色的详细信息
 *     parameters:
 *       - name: role_id
 *         in: path
 *         required: true
 *         type: string
 *         format: uuid
 *         description: 角色ID
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoleResponse'
 *       404:
 *         description: 角色不存在
 *       500:
 *         description: 服务器错误
 */
router.get('/:role_id', RoleController.getById);

/**
 * @swagger
 * /api/v1/roles/{role_id}:
 *   put:
 *     tags:
 *       - Roles
 *     summary: 更新角色信息
 *     description: 更新指定角色的信息
 *     parameters:
 *       - name: role_id
 *         in: path
 *         required: true
 *         type: string
 *         format: uuid
 *         description: 角色ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role_name:
 *                 type: string
 *                 description: 角色名称
 *               description:
 *                 type: string
 *                 description: 角色描述
 *     responses:
 *       200:
 *         description: 更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoleResponse'
 *       404:
 *         description: 角色不存在
 *       500:
 *         description: 服务器错误
 */
router.put('/:role_id', RoleController.update);

/**
 * @swagger
 * /api/v1/roles/{role_id}:
 *   delete:
 *     tags:
 *       - Roles
 *     summary: 删除角色
 *     description: 软删除指定角色
 *     parameters:
 *       - name: role_id
 *         in: path
 *         required: true
 *         type: string
 *         format: uuid
 *         description: 角色ID
 *     responses:
 *       200:
 *         description: 删除成功
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
 *                   example: 角色删除成功
 *       404:
 *         description: 角色不存在
 *       500:
 *         description: 服务器错误
 */
router.delete('/:role_id', RoleController.delete);

/**
 * @swagger
 * /api/v1/roles/{role_id}/permissions:
 *   post:
 *     tags:
 *       - Roles
 *     summary: 给角色分配权限
 *     description: 完全替换角色的现有权限，设置新的权限列表
 *     parameters:
 *       - name: role_id
 *         in: path
 *         required: true
 *         type: string
 *         format: uuid
 *         description: 角色ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permission_ids
 *             properties:
 *               permission_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: 权限ID列表
 *     responses:
 *       200:
 *         description: 权限分配成功
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
 *                   example: 权限分配成功
 *       400:
 *         description: 参数错误
 *       404:
 *         description: 角色不存在
 *       500:
 *         description: 服务器错误
 */
router.post('/:role_id/permissions', RoleController.assignPermissions);

/**
 * @swagger
 * /api/v1/roles/{role_id}/permissions:
 *   put:
 *     tags:
 *       - Roles
 *     summary: 更新角色权限
 *     description: 更新角色的权限列表，可以添加或删除权限
 *     parameters:
 *       - name: role_id
 *         in: path
 *         required: true
 *         type: string
 *         format: uuid
 *         description: 角色ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - add_permissions
 *               - remove_permissions
 *             properties:
 *               add_permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: 要添加的权限ID列表
 *               remove_permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: 要移除的权限ID列表
 *     responses:
 *       200:
 *         description: 权限更新成功
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
 *                   example: 权限更新成功
 *       400:
 *         description: 参数错误
 *       404:
 *         description: 角色不存在
 *       500:
 *         description: 服务器错误
 */
router.put('/:role_id/permissions', RoleController.updatePermissions);

/**
 * @swagger
 * /api/v1/roles/check-permission:
 *   get:
 *     tags:
 *       - Roles
 *     summary: 检查用户权限
 *     description: 检查当前用户是否拥有指定权限
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: permission_code
 *         in: query
 *         required: true
 *         type: string
 *         description: 权限编码
 *     responses:
 *       200:
 *         description: 检查成功
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
 *                     has_permission:
 *                       type: boolean
 *       401:
 *         description: 未登录
 *       403:
 *         description: 无权限
 *       500:
 *         description: 服务器错误
 */
router.post('/check-permission', RoleController.checkUserPermission);

/**
 * @swagger
 * /api/v1/dev/login:
 *   post:
 *     tags:
 *       - Dev
 *     summary: 开发环境专用登录接口
 *     description: 仅限开发环境使用的登录接口，无需验证码
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
 *               password:
 *                 type: string
 *                 description: 密码
 *     responses:
 *       200:
 *         description: 登录成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: 登录成功
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: JWT token
 *                     user:
 *                       type: object
 *                       properties:
 *                         user_id:
 *                           type: string
 *                         username:
 *                           type: string
 *                         email:
 *                           type: string
 *                         roles:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               role_id:
 *                                 type: string
 *                               role_name:
 *                                 type: string
 *                               code:
 *                                 type: string
 *                               permissions:
 *                                 type: array
 *                                 items:
 *                                   type: object
 *                                   properties:
 *                                     permission_id:
 *                                       type: string
 *                                     permission_name:
 *                                       type: string
 *                                     code:
 *                                       type: string
 *       400:
 *         description: 参数错误
 *       401:
 *         description: 用户名或密码错误
 *       403:
 *         description: 非开发环境
 *       500:
 *         description: 服务器错误
 */
router.post('/dev/login', RoleController.devLogin);

module.exports = router; 