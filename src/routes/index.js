const Router = require('koa-router');
const userController = require('../controllers/userController');
const departmentController = require('../controllers/departmentController');
const permissionController = require('../controllers/permissionController');
const roleController = require('../controllers/roleController');
const auth = require('../middlewares/auth');
const captchaController = require('../controllers/captchaController');

const router = new Router({ prefix: '/api/v1' });

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: 用户ID
 *         username:
 *           type: string
 *           description: 用户名
 *         email:
 *           type: string
 *           format: email
 *           description: 电子邮箱
 *         password:
 *           type: string
 *           format: password
 *           description: 密码
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           description: 用户状态
 *     Department:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: 部门ID
 *         name:
 *           type: string
 *           description: 部门名称
 *         parent_id:
 *           type: string
 *           format: uuid
 *           description: 父部门ID
 *     Role:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: 角色ID
 *         name:
 *           type: string
 *           description: 角色名称
 *         description:
 *           type: string
 *           description: 角色描述
 *     Permission:
 *       type: object
 *       required:
 *         - resource_type
 *         - action
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: 权限ID
 *         resource_type:
 *           type: string
 *           description: 资源类型
 *         action:
 *           type: string
 *           description: 操作类型
 *         conditions:
 *           type: object
 *           description: 权限条件
 */

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     summary: 健康检查
 *     tags: [System]
 *     responses:
 *       200:
 *         description: 服务正常运行
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
 *                     status:
 *                       type: string
 *                       example: ok
 */
router.get('/health', async (ctx) => {
  ctx.body = { 
    code: 200,
    message: 'success',
    data: { status: 'ok' }
  };
});

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: 用户登录
 *     tags: [Auth]
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
 *                 format: password
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
 *                     refresh_token:
 *                       type: string
 *                       description: 刷新令牌
 *                     expires_in:
 *                       type: string
 *                       description: 过期时间
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
 *         $ref: '#/components/responses/400'
 *       403:
 *         $ref: '#/components/responses/403'
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
 *                       description: 下次可尝试的时间
 *                       example: "2024-03-20T10:00:00Z"
 */
router.post('/auth/login', userController.login);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: 刷新访问令牌
 *     tags: [Auth]
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
 *                     refresh_token:
 *                       type: string
 *                     expires_in:
 *                       type: string
 *       401:
 *         description: 刷新失败
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
 *                   type: object
 *                   nullable: true
 */
router.post('/auth/refresh', userController.refreshToken);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: 用户登出
 *     tags: [Auth]
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
 *                   example: success
 *                 data:
 *                   type: object
 *                   nullable: true
 *       400:
 *         description: 刷新令牌不能为空
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
 *                   type: object
 *                   nullable: true
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
 *                   type: object
 *                   nullable: true
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
 *                   type: object
 *                   nullable: true
 */
router.post('/auth/logout', auth, userController.logout);

/**
 * @swagger
 * /api/v1/captcha/generate:
 *   post:
 *     summary: 生成滑块验证码
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: 生成成功
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
 *                     captcha_id:
 *                       type: string
 *                     bg_url:
 *                       type: string
 *                     puzzle_url:
 *                       type: string
 */
router.post('/captcha/generate', captchaController.generate);

/**
 * @swagger
 * /api/v1/captcha/verify:
 *   post:
 *     summary: 验证滑块位置
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - captcha_id
 *               - x
 *               - y
 *             properties:
 *               captcha_id:
 *                 type: string
 *                 format: uuid
 *                 description: 验证码ID
 *               x:
 *                 type: number
 *                 format: float
 *                 description: 滑块X坐标
 *               y:
 *                 type: number
 *                 format: float
 *                 description: 滑块Y坐标
 *               duration:
 *                 type: number
 *                 format: float
 *                 description: 滑动耗时（毫秒）
 *               trail:
 *                 type: array
 *                 description: 滑动轨迹
 *                 items:
 *                   type: object
 *                   properties:
 *                     x:
 *                       type: number
 *                       format: float
 *                       description: X坐标
 *                     y:
 *                       type: number
 *                       format: float
 *                       description: Y坐标
 *                     timestamp:
 *                       type: number
 *                       format: int64
 *                       description: 时间戳
 *     responses:
 *       200:
 *         description: 验证成功
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
 *                     verified:
 *                       type: boolean
 *                       description: 验证结果
 */
router.post('/captcha/verify', captchaController.verify);

/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     summary: 创建新用户
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: 用户创建成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.post('/users', auth, userController.create);

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: 获取用户列表
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: 每页数量
 *     responses:
 *       200:
 *         description: 成功获取用户列表
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.get('/users', auth, userController.list);

/**
 * @swagger
 * /api/v1/users/{user_id}:
 *   get:
 *     summary: 获取用户详情
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 用户ID
 *     responses:
 *       200:
 *         description: 成功获取用户详情
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
 *                       format: uuid
 *                       description: 用户ID
 *                     username:
 *                       type: string
 *                       description: 用户名
 *                     name:
 *                       type: string
 *                       description: 用户姓名
 *                     avatar:
 *                       type: string
 *                       description: 用户头像URL
 *                     gender:
 *                       type: string
 *                       enum: [MALE, FEMALE, OTHER]
 *                       description: 用户性别
 *                     email:
 *                       type: string
 *                       format: email
 *                       description: 电子邮箱
 *                     phone:
 *                       type: string
 *                       description: 电话号码
 *                     status:
 *                       type: string
 *                       enum: [ACTIVE, DISABLED, LOCKED, ARCHIVED]
 *                       description: 用户状态
 *                     department_id:
 *                       type: string
 *                       format: uuid
 *                       description: 部门ID
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       description: 创建时间
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       description: 更新时间
 *       401:
 *         description: 未授权
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/401'
 *       404:
 *         description: 用户不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/404'
 */
router.get('/users/:user_id', auth, userController.getById);

/**
 * @swagger
 * /api/v1/users/{user_id}:
 *   put:
 *     summary: 更新用户信息
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 用户ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: 用户信息更新成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       404:
 *         description: 用户不存在
 */
router.put('/users/:user_id', auth, userController.update);

/**
 * @swagger
 * /api/v1/users/{user_id}:
 *   delete:
 *     summary: 删除用户
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 用户ID
 *     responses:
 *       200:
 *         description: 用户删除成功
 *       401:
 *         description: 未授权
 *       404:
 *         description: 用户不存在
 */
router.delete('/users/:user_id', auth, userController.delete);

/**
 * @swagger
 * /api/v1/users/{user_id}/restore:
 *   post:
 *     summary: 恢复已删除的用户
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 用户ID
 *     responses:
 *       200:
 *         description: 用户恢复成功
 *       401:
 *         description: 未授权
 *       404:
 *         description: 用户不存在
 */
router.post('/users/:user_id/restore', auth, userController.restore);

// 部门相关路由
/**
 * @swagger
 * /api/v1/departments:
 *   post:
 *     summary: 创建部门
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Department'
 *     responses:
 *       201:
 *         description: 部门创建成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 */
router.post('/departments', auth, departmentController.create);

/**
 * @swagger
 * /api/v1/departments:
 *   get:
 *     summary: 获取部门列表
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: 每页数量
 *     responses:
 *       200:
 *         description: 成功获取部门列表
 *       401:
 *         description: 未授权
 */
router.get('/departments', auth, departmentController.list);

/**
 * @swagger
 * /api/v1/departments/tree:
 *   get:
 *     summary: 获取部门树结构
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取部门树
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Department'
 */
router.get('/departments/tree', auth, departmentController.getTree);

/**
 * @swagger
 * /api/v1/departments/{department_id}:
 *   get:
 *     summary: 获取部门详情
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: department_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 部门ID
 *     responses:
 *       200:
 *         description: 成功获取部门详情
 *       401:
 *         description: 未授权
 *       404:
 *         description: 部门不存在
 */
router.get('/departments/:department_id', auth, departmentController.getById);

/**
 * @swagger
 * /api/v1/departments/{department_id}:
 *   put:
 *     summary: 更新部门信息
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: department_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 部门ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Department'
 *     responses:
 *       200:
 *         description: 部门信息更新成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       404:
 *         description: 部门不存在
 */
router.put('/departments/:department_id', auth, departmentController.update);

/**
 * @swagger
 * /api/v1/departments/{department_id}:
 *   delete:
 *     summary: 删除部门
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: department_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 部门ID
 *     responses:
 *       200:
 *         description: 部门删除成功
 *       401:
 *         description: 未授权
 *       404:
 *         description: 部门不存在
 */
router.delete('/departments/:department_id', auth, departmentController.delete);

/**
 * @swagger
 * /api/v1/departments/{department_id}/members:
 *   get:
 *     summary: 获取部门成员
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: department_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 部门ID
 *       - in: query
 *         name: include_children
 *         schema:
 *           type: boolean
 *         description: 是否包含子部门成员
 *     responses:
 *       200:
 *         description: 成功获取部门成员
 *       401:
 *         description: 未授权
 *       404:
 *         description: 部门不存在
 */
router.get('/departments/:department_id/members', auth, departmentController.getMembers);

// 角色相关路由
/**
 * @swagger
 * /api/v1/roles:
 *   post:
 *     summary: 创建角色
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Role'
 *     responses:
 *       201:
 *         description: 角色创建成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 */
router.post('/roles', auth, roleController.create);

/**
 * @swagger
 * /api/v1/roles:
 *   get:
 *     summary: 获取角色列表
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: 每页数量
 *     responses:
 *       200:
 *         description: 成功获取角色列表
 *       401:
 *         description: 未授权
 */
router.get('/roles', auth, roleController.list);

/**
 * @swagger
 * /api/v1/roles/{role_id}:
 *   get:
 *     summary: 获取角色详情
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 角色ID
 *     responses:
 *       200:
 *         description: 成功获取角色详情
 *       401:
 *         description: 未授权
 *       404:
 *         description: 角色不存在
 */
router.get('/roles/:role_id', auth, roleController.getById);

/**
 * @swagger
 * /api/v1/roles/{role_id}:
 *   put:
 *     summary: 更新角色信息
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 角色ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Role'
 *     responses:
 *       200:
 *         description: 角色信息更新成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       404:
 *         description: 角色不存在
 */
router.put('/roles/:role_id', auth, roleController.update);

/**
 * @swagger
 * /api/v1/roles/{role_id}:
 *   delete:
 *     summary: 删除角色
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 角色ID
 *     responses:
 *       200:
 *         description: 角色删除成功
 *       401:
 *         description: 未授权
 *       404:
 *         description: 角色不存在
 */
router.delete('/roles/:role_id', auth, roleController.delete);

// 权限相关路由
/**
 * @swagger
 * /api/v1/permissions:
 *   post:
 *     summary: 创建权限
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Permission'
 *     responses:
 *       201:
 *         description: 权限创建成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 */
router.post('/permissions', auth, permissionController.create);

/**
 * @swagger
 * /api/v1/permissions:
 *   get:
 *     summary: 获取权限列表
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: 每页数量
 *     responses:
 *       200:
 *         description: 成功获取权限列表
 *       401:
 *         description: 未授权
 */
router.get('/permissions', auth, permissionController.list);

/**
 * @swagger
 * /api/v1/permissions/{permission_id}:
 *   put:
 *     summary: 更新权限信息
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: permission_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 权限ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Permission'
 *     responses:
 *       200:
 *         description: 权限信息更新成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       404:
 *         description: 权限不存在
 */
router.put('/permissions/:permission_id', auth, permissionController.update);

/**
 * @swagger
 * /api/v1/permissions/{permission_id}:
 *   delete:
 *     summary: 删除权限
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: permission_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 权限ID
 *     responses:
 *       200:
 *         description: 权限删除成功
 *       401:
 *         description: 未授权
 *       404:
 *         description: 权限不存在
 */
router.delete('/permissions/:permission_id', auth, permissionController.delete);

/**
 * @swagger
 * /api/v1/roles/{role_id}/permissions:
 *   post:
 *     summary: 为角色分配权限
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *     responses:
 *       200:
 *         description: 权限分配成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       404:
 *         description: 角色不存在
 */
router.post('/roles/:role_id/permissions', auth, permissionController.assignRole);

/**
 * @swagger
 * /api/v1/roles/{role_id}/permissions/{permission_id}:
 *   delete:
 *     summary: 移除角色的权限
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 角色ID
 *       - in: path
 *         name: permission_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 权限ID
 *     responses:
 *       200:
 *         description: 权限移除成功
 *       401:
 *         description: 未授权
 *       404:
 *         description: 角色或权限不存在
 */
router.delete('/roles/:role_id/permissions/:permission_id', auth, permissionController.removeRolePermission);

/**
 * @swagger
 * /api/v1/permissions/user/{user_id}:
 *   get:
 *     summary: 获取用户权限
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 用户ID
 *     responses:
 *       200:
 *         description: 成功获取用户权限
 *       401:
 *         description: 未授权
 *       404:
 *         description: 用户不存在
 */
router.get('/permissions/user/:user_id', auth, permissionController.getUserPermissions);

/**
 * @swagger
 * /api/v1/permissions/check:
 *   post:
 *     summary: 检查用户权限
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - resource_type
 *               - action
 *             properties:
 *               user_id:
 *                 type: string
 *                 format: uuid
 *               resource_type:
 *                 type: string
 *               action:
 *                 type: string
 *     responses:
 *       200:
 *         description: 权限检查结果
 *       401:
 *         description: 未授权
 */
router.post('/permissions/check', auth, permissionController.checkPermission);

/**
 * @swagger
 * /api/v1/data-permissions/rules:
 *   post:
 *     summary: 创建数据权限规则
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role_id
 *               - resource_type
 *               - conditions
 *             properties:
 *               role_id:
 *                 type: string
 *                 format: uuid
 *               resource_type:
 *                 type: string
 *               conditions:
 *                 type: object
 *                 properties:
 *                   field:
 *                     type: string
 *                   operator:
 *                     type: string
 *                   value:
 *                     type: string
 *     responses:
 *       201:
 *         description: 规则创建成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 */
router.post('/data-permissions/rules', auth, permissionController.createRule);

/**
 * @swagger
 * /api/v1/data-permissions/rules:
 *   get:
 *     summary: 获取数据权限规则
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 角色ID
 *       - in: query
 *         name: resource_type
 *         schema:
 *           type: string
 *         description: 资源类型
 *     responses:
 *       200:
 *         description: 成功获取数据权限规则
 *       401:
 *         description: 未授权
 */
router.get('/data-permissions/rules', auth, permissionController.getRules);

module.exports = router; 