const Router = require('koa-router');
const userController = require('../controllers/userController');
const departmentController = require('../controllers/departmentController');
const permissionController = require('../controllers/permissionController');

const router = new Router({ prefix: '/api/v1' });

// 用户相关路由
router.post('/users', userController.create);
router.put('/users/:user_id', userController.update);
router.get('/users', userController.list);
router.post('/auth/login', userController.login);
router.post('/auth/refresh', userController.refreshToken);
router.delete('/users/:user_id', userController.delete);
router.post('/users/:user_id/restore', userController.restore);

// 部门相关路由
router.post('/departments', departmentController.create);
router.get('/departments', departmentController.list);
router.get('/departments/tree', departmentController.getTree);
router.get('/departments/:department_id', departmentController.getById);
router.put('/departments/:department_id', departmentController.update);
router.delete('/departments/:department_id', departmentController.delete);
router.get('/departments/:department_id/members', departmentController.getMembers);

// 权限相关路由
router.post('/roles/assign', permissionController.assignRole);
router.get('/permissions/user/:user_id', permissionController.getUserPermissions);
router.post('/permissions/check', permissionController.checkPermission);
router.post('/data-permissions/rules', permissionController.createRule);
router.get('/data-permissions/rules', permissionController.getRules);

// 健康检查路由
router.get('/health', async (ctx) => {
  ctx.body = { 
    code: 200,
    message: 'success',
    data: { status: 'ok' }
  };
});

module.exports = router; 