-- UAC 系统数据库Schema
-- 版本：1.4
-- PostgreSQL 12+
-- 关键实现细节：
-- 1. 采用邻接表（departments表）和闭包表（department_closure表）混合模式实现部门层级
-- 2. 用户表使用UUID作为主键，符合文档要求
-- 3. 权限系统支持RBAC（角色权限关联表）和ABAC（数据权限规则表）
-- 4. 包含部门历史版本表（SCD Type4）和事务日志表（Saga模式）
-- 5. 为高频查询字段添加索引优化
-- 6. 支持软删除功能

-- 第一部分：创建schema
DROP SCHEMA IF EXISTS uac CASCADE;
CREATE SCHEMA uac;

-- 第二部分：创建基础表（没有外键依赖的表）
-- 部门邻接表（含软删除）
CREATE TABLE uac.departments (
    department_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    parent_id UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'DISABLED', 'ARCHIVED')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- 添加部门自引用外键
ALTER TABLE uac.departments
ADD CONSTRAINT fk_departments_parent
FOREIGN KEY (parent_id) REFERENCES uac.departments(department_id);

-- 角色表（含软删除）
CREATE TABLE uac.roles (
    role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'DISABLED', 'ARCHIVED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- 权限表（含软删除）
CREATE TABLE uac.permissions (
    permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    resource_type VARCHAR(50) NOT NULL,
    actions JSONB NOT NULL DEFAULT '[]'::jsonb,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'DISABLED', 'ARCHIVED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- 添加权限表注释
COMMENT ON COLUMN uac.permissions.actions IS '操作类型列表（JSON数组）';

-- 第三部分：创建用户相关表
-- 用户表（含状态管理和软删除）
CREATE TABLE uac.users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(64) NOT NULL UNIQUE,
    password_hash VARCHAR(128) NOT NULL,
    name VARCHAR(100),
    avatar VARCHAR(255),
    gender VARCHAR(10) CHECK(gender IN ('MALE', 'FEMALE', 'OTHER', NULL)),
    email VARCHAR(255),
    phone VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'DISABLED', 'LOCKED', 'ARCHIVED')),
    department_id UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    last_password_updated TIMESTAMPTZ
);

-- 添加用户表外键
ALTER TABLE uac.users
ADD CONSTRAINT fk_users_department
FOREIGN KEY (department_id) REFERENCES uac.departments(department_id);

-- 添加用户表注释
COMMENT ON COLUMN uac.users.name IS '用户姓名';
COMMENT ON COLUMN uac.users.avatar IS '用户头像URL';
COMMENT ON COLUMN uac.users.gender IS '用户性别：MALE-男, FEMALE-女, OTHER-其他';

-- 第四部分：创建部门相关表
-- 部门闭包表（用于高效的层级查询）
CREATE TABLE uac.department_closure (
    ancestor_id UUID,
    descendant_id UUID,
    depth INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (ancestor_id, descendant_id)
);

-- 添加部门闭包表外键
ALTER TABLE uac.department_closure
ADD CONSTRAINT fk_department_closure_ancestor
FOREIGN KEY (ancestor_id) REFERENCES uac.departments(department_id),
ADD CONSTRAINT fk_department_closure_descendant
FOREIGN KEY (descendant_id) REFERENCES uac.departments(department_id);

-- 部门历史版本表（SCD Type4）
CREATE TABLE uac.department_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    parent_id UUID,
    status VARCHAR(20) NOT NULL CHECK(status IN ('ACTIVE', 'DISABLED', 'ARCHIVED')),
    description TEXT,
    valid_from TIMESTAMPTZ NOT NULL,
    valid_to TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 第五部分：创建权限相关表
-- 角色权限关联表
CREATE TABLE uac.role_permissions (
    role_id UUID,
    permission_id UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id)
);

-- 添加角色权限关联表外键
ALTER TABLE uac.role_permissions
ADD CONSTRAINT fk_role_permissions_role
FOREIGN KEY (role_id) REFERENCES uac.roles(role_id) ON DELETE CASCADE,
ADD CONSTRAINT fk_role_permissions_permission
FOREIGN KEY (permission_id) REFERENCES uac.permissions(permission_id) ON DELETE CASCADE;

-- 用户角色关联表
CREATE TABLE uac.user_roles (
    user_id UUID,
    role_id UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

-- 添加用户角色关联表外键
ALTER TABLE uac.user_roles
ADD CONSTRAINT fk_user_roles_user
FOREIGN KEY (user_id) REFERENCES uac.users(user_id) ON DELETE CASCADE,
ADD CONSTRAINT fk_user_roles_role
FOREIGN KEY (role_id) REFERENCES uac.roles(role_id) ON DELETE CASCADE;

-- 数据权限规则表（含软删除）
CREATE TABLE uac.data_permission_rules (
    rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID,
    resource_type VARCHAR(50) NOT NULL,
    conditions JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'DISABLED', 'ARCHIVED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- 添加数据权限规则表外键
ALTER TABLE uac.data_permission_rules
ADD CONSTRAINT fk_data_permission_rules_role
FOREIGN KEY (role_id) REFERENCES uac.roles(role_id) ON DELETE CASCADE;

-- 第六部分：创建日志和令牌相关表
-- 操作日志表（Saga模式）
CREATE TABLE uac.operation_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    operation_type VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(50) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS' CHECK(status IN ('SUCCESS', 'FAILED', 'PENDING')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 添加操作日志表外键
ALTER TABLE uac.operation_logs
ADD CONSTRAINT fk_operation_logs_user
FOREIGN KEY (user_id) REFERENCES uac.users(user_id);

-- 刷新令牌表
CREATE TABLE uac.refresh_tokens (
    token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'REVOKED', 'EXPIRED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 重置密码记录表
CREATE TABLE uac.password_resets (
    reset_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token VARCHAR(8) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'USED', 'EXPIRED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 添加重置密码记录表外键
ALTER TABLE uac.password_resets
ADD CONSTRAINT fk_password_resets_user
FOREIGN KEY (user_id) REFERENCES uac.users(user_id) ON DELETE CASCADE;

-- 添加重置密码记录表索引
CREATE INDEX idx_password_resets_user_id ON uac.password_resets(user_id);
CREATE INDEX idx_password_resets_token ON uac.password_resets(token);
CREATE INDEX idx_password_resets_status ON uac.password_resets(status);
CREATE INDEX idx_password_resets_expires_at ON uac.password_resets(expires_at);

-- 添加重置密码记录表注释
COMMENT ON COLUMN uac.password_resets.reset_id IS '重置记录ID';
COMMENT ON COLUMN uac.password_resets.user_id IS '用户ID';
COMMENT ON COLUMN uac.password_resets.token IS '重置令牌（8位）';
COMMENT ON COLUMN uac.password_resets.expires_at IS '过期时间';
COMMENT ON COLUMN uac.password_resets.status IS '状态：PENDING-待使用, USED-已使用, EXPIRED-已过期';
COMMENT ON COLUMN uac.password_resets.created_at IS '创建时间';
COMMENT ON COLUMN uac.password_resets.updated_at IS '更新时间';

-- 添加刷新令牌表外键
ALTER TABLE uac.refresh_tokens
ADD CONSTRAINT fk_refresh_tokens_user
FOREIGN KEY (user_id) REFERENCES uac.users(user_id) ON DELETE CASCADE;

-- 登录尝试表
CREATE TABLE uac.login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    attempt_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    success BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 添加登录尝试表外键
ALTER TABLE uac.login_attempts
ADD CONSTRAINT fk_login_attempts_user
FOREIGN KEY (user_id) REFERENCES uac.users(user_id);

-- 验证码表
CREATE TABLE uac.captchas (
    captcha_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bg_url VARCHAR(255) NOT NULL,
    puzzle_url VARCHAR(255) NOT NULL,
    target_x INTEGER NOT NULL,
    target_y INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'USED', 'EXPIRED')),
    verified_at TIMESTAMPTZ
);

-- 添加验证码表索引
CREATE INDEX idx_captchas_expires_at ON uac.captchas(expires_at);
CREATE INDEX idx_captchas_status ON uac.captchas(status);

-- 添加验证码表注释
COMMENT ON COLUMN uac.captchas.captcha_id IS '验证码ID';
COMMENT ON COLUMN uac.captchas.bg_url IS '背景图URL';
COMMENT ON COLUMN uac.captchas.puzzle_url IS '拼图URL';
COMMENT ON COLUMN uac.captchas.target_x IS '目标X坐标';
COMMENT ON COLUMN uac.captchas.target_y IS '目标Y坐标';
COMMENT ON COLUMN uac.captchas.created_at IS '创建时间';
COMMENT ON COLUMN uac.captchas.expires_at IS '过期时间';
COMMENT ON COLUMN uac.captchas.status IS '状态：ACTIVE-有效, USED-已使用, EXPIRED-已过期';
COMMENT ON COLUMN uac.captchas.verified_at IS '验证时间';

-- 第七部分：创建触发器
CREATE OR REPLACE FUNCTION uac.update_login_attempts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_login_attempts_updated_at
    BEFORE UPDATE ON uac.login_attempts
    FOR EACH ROW
    EXECUTE FUNCTION uac.update_login_attempts_updated_at();

-- 第八部分：创建索引
CREATE INDEX idx_users_username ON uac.users(username);
CREATE INDEX idx_users_email ON uac.users(email);
CREATE INDEX idx_users_department_id ON uac.users(department_id);
CREATE INDEX idx_users_deleted_at ON uac.users(deleted_at);
CREATE INDEX idx_users_status ON uac.users(status);

CREATE INDEX idx_departments_parent_id ON uac.departments(parent_id);
CREATE INDEX idx_departments_deleted_at ON uac.departments(deleted_at);
CREATE INDEX idx_departments_status ON uac.departments(status);

CREATE INDEX idx_department_closure_ancestor ON uac.department_closure(ancestor_id);
CREATE INDEX idx_department_closure_descendant ON uac.department_closure(descendant_id);

CREATE INDEX idx_permissions_code ON uac.permissions(code);
CREATE INDEX idx_permissions_deleted_at ON uac.permissions(deleted_at);
CREATE INDEX idx_permissions_status ON uac.permissions(status);

CREATE INDEX idx_roles_deleted_at ON uac.roles(deleted_at);
CREATE INDEX idx_roles_status ON uac.roles(status);

CREATE INDEX idx_data_permission_rules_role_id ON uac.data_permission_rules(role_id);
CREATE INDEX idx_data_permission_rules_deleted_at ON uac.data_permission_rules(deleted_at);
CREATE INDEX idx_data_permission_rules_status ON uac.data_permission_rules(status);

CREATE INDEX idx_operation_logs_user_id ON uac.operation_logs(user_id);
CREATE INDEX idx_operation_logs_resource ON uac.operation_logs(resource_type, resource_id);
CREATE INDEX idx_operation_logs_status ON uac.operation_logs(status);

CREATE INDEX idx_refresh_tokens_user_id ON uac.refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON uac.refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_status ON uac.refresh_tokens(status);

CREATE INDEX idx_login_attempts_user_id ON uac.login_attempts(user_id);
CREATE INDEX idx_login_attempts_attempt_time ON uac.login_attempts(attempt_time);

-- 第九部分：添加表注释
COMMENT ON COLUMN uac.users.status IS '用户状态：ACTIVE-启用, DISABLED-停用, LOCKED-锁定, ARCHIVED-离职归档';
COMMENT ON COLUMN uac.users.email IS '用户邮箱';
COMMENT ON COLUMN uac.users.phone IS '用户电话';
COMMENT ON COLUMN uac.users.deleted_at IS '软删除时间';

COMMENT ON COLUMN uac.departments.status IS '部门状态：ACTIVE-启用, DISABLED-停用, ARCHIVED-归档';
COMMENT ON COLUMN uac.departments.deleted_at IS '软删除时间';

COMMENT ON COLUMN uac.roles.status IS '角色状态：ACTIVE-启用, DISABLED-停用, ARCHIVED-归档';
COMMENT ON COLUMN uac.roles.deleted_at IS '软删除时间';

COMMENT ON COLUMN uac.permissions.status IS '权限状态：ACTIVE-启用, DISABLED-停用, ARCHIVED-归档';
COMMENT ON COLUMN uac.permissions.deleted_at IS '软删除时间';

COMMENT ON COLUMN uac.data_permission_rules.status IS '规则状态：ACTIVE-启用, DISABLED-停用, ARCHIVED-归档';
COMMENT ON COLUMN uac.data_permission_rules.deleted_at IS '软删除时间';
COMMENT ON COLUMN uac.data_permission_rules.conditions IS '数据权限条件（JSON格式）';

COMMENT ON COLUMN uac.operation_logs.status IS '操作状态：SUCCESS-成功, FAILED-失败, PENDING-处理中';
COMMENT ON COLUMN uac.operation_logs.error_message IS '错误信息';

COMMENT ON COLUMN uac.refresh_tokens.status IS '令牌状态：ACTIVE-有效, REVOKED-已撤销, EXPIRED-已过期';
COMMENT ON COLUMN uac.refresh_tokens.token IS '刷新令牌';
COMMENT ON COLUMN uac.refresh_tokens.expires_at IS '令牌过期时间';

COMMENT ON COLUMN uac.login_attempts.user_id IS '用户ID';
COMMENT ON COLUMN uac.login_attempts.attempt_time IS '尝试时间';
COMMENT ON COLUMN uac.login_attempts.ip_address IS 'IP地址';
COMMENT ON COLUMN uac.login_attempts.user_agent IS '用户代理';
COMMENT ON COLUMN uac.login_attempts.success IS '是否成功';