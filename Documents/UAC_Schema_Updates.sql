-- UAC系统数据库Schema更新
-- 版本：1.1
-- 补充缺失的表和字段

-- 1. 更新用户表，添加email和phone字段
ALTER TABLE uac.users
ADD COLUMN email VARCHAR(255),
ADD COLUMN phone VARCHAR(20);

-- 2. 创建refresh token表
CREATE TABLE uac.refresh_tokens (
    token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES uac.users,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES uac.users(user_id) ON DELETE CASCADE
);

-- 3. 创建数据权限规则表
CREATE TABLE uac.data_permission_rules (
    rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id INT REFERENCES uac.roles,
    resource_type VARCHAR(50) NOT NULL,
    conditions JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_role FOREIGN KEY (role_id) REFERENCES uac.roles(role_id) ON DELETE CASCADE
);

-- 4. 添加必要的索引
CREATE INDEX idx_refresh_tokens_user ON uac.refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON uac.refresh_tokens(token);
CREATE INDEX idx_data_permission_rules_role ON uac.data_permission_rules(role_id);
CREATE INDEX idx_data_permission_rules_resource ON uac.data_permission_rules(resource_type);

-- 5. 添加审计日志相关索引
CREATE INDEX idx_user_history_operation ON uac.user_history(operation);
CREATE INDEX idx_user_history_operated_at ON uac.user_history(operated_at);
CREATE INDEX idx_transaction_log_status ON uac.transaction_log(status);
CREATE INDEX idx_transaction_log_created_at ON uac.transaction_log(created_at);

-- 6. 添加表注释
COMMENT ON TABLE uac.refresh_tokens IS '用户刷新令牌表';
COMMENT ON TABLE uac.data_permission_rules IS '数据权限规则表';
COMMENT ON COLUMN uac.users.email IS '用户邮箱';
COMMENT ON COLUMN uac.users.phone IS '用户电话';
COMMENT ON COLUMN uac.refresh_tokens.token IS '刷新令牌';
COMMENT ON COLUMN uac.refresh_tokens.expires_at IS '令牌过期时间';
COMMENT ON COLUMN uac.data_permission_rules.conditions IS '数据权限条件（JSON格式）'; 