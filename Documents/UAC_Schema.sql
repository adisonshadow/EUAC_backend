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

CREATE SCHEMA IF NOT EXISTS uac;

-- 用户表（含状态管理和软删除）
CREATE TABLE uac.users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(64) NOT NULL UNIQUE,
    password_hash VARCHAR(128) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'DISABLED', 'LOCKED', 'ARCHIVED')),
    department_id INT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    last_password_updated TIMESTAMPTZ
);

-- 部门邻接表（含软删除）
CREATE TABLE uac.departments (
    department_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    parent_id INT REFERENCES uac.departments(department_id),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'DISABLED', 'ARCHIVED')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- 部门闭包表（用于高效的层级查询）
CREATE TABLE uac.department_closure (
    ancestor_id INT REFERENCES uac.departments(department_id),
    descendant_id INT REFERENCES uac.departments(department_id),
    depth INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (ancestor_id, descendant_id)
);

-- 部门历史版本表（SCD Type4）
CREATE TABLE uac.department_history (
    history_id SERIAL PRIMARY KEY,
    department_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    parent_id INT,
    status VARCHAR(20) NOT NULL CHECK(status IN ('ACTIVE', 'DISABLED', 'ARCHIVED')),
    description TEXT,
    valid_from TIMESTAMPTZ NOT NULL,
    valid_to TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

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
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    resource_type VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'DISABLED', 'ARCHIVED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- 角色权限关联表
CREATE TABLE uac.role_permissions (
    role_id UUID REFERENCES uac.roles(role_id) ON DELETE CASCADE,
    permission_id UUID REFERENCES uac.permissions(permission_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id)
);

-- 用户角色关联表
CREATE TABLE uac.user_roles (
    user_id UUID REFERENCES uac.users(user_id) ON DELETE CASCADE,
    role_id UUID REFERENCES uac.roles(role_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

-- 数据权限规则表（含软删除）
CREATE TABLE uac.data_permission_rules (
    rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID REFERENCES uac.roles(role_id) ON DELETE CASCADE,
    resource_type VARCHAR(50) NOT NULL,
    conditions JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'DISABLED', 'ARCHIVED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- 操作日志表（Saga模式）
CREATE TABLE uac.operation_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES uac.users(user_id),
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

-- 刷新令牌表
CREATE TABLE uac.refresh_tokens (
    token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES uac.users(user_id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'REVOKED', 'EXPIRED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 登录尝试表
CREATE TABLE IF NOT EXISTS uac.login_attempts (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES uac.users(user_id),
    attempt_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    success BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_users_username ON uac.users(username);
CREATE INDEX idx_users_email ON uac.users(email);
CREATE INDEX idx_users_department_id ON uac.users(department_id);
CREATE INDEX idx_users_deleted_at ON uac.users(deleted_at);
CREATE INDEX idx_users_status ON uac.users(status);

CREATE INDEX idx_departments_parent_id ON uac.departments(parent_id);
CREATE INDEX idx_departments_code ON uac.departments(code);
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

-- 表注释
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

-- 添加触发器
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