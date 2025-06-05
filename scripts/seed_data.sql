-- 插入密码重置记录示例数据
INSERT INTO uac.password_resets (reset_id, user_id, token, expires_at, status, created_at, updated_at)
VALUES 
  (gen_random_uuid(), (SELECT user_id FROM uac.users WHERE username = 'admin'), 'TEST1234', NOW() + INTERVAL '30 minutes', 'PENDING', NOW(), NOW()),
  (gen_random_uuid(), (SELECT user_id FROM uac.users WHERE username = 'admin'), 'USED5678', NOW() - INTERVAL '1 day', 'USED', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  (gen_random_uuid(), (SELECT user_id FROM uac.users WHERE username = 'admin'), 'EXPIRED9', NOW() - INTERVAL '2 days', 'EXPIRED', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days');
