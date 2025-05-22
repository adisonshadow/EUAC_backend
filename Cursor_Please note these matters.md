蠢货，你不能还似之前那么傻, 一定要注意这些事项：

- 修改本项目的代码并保存后，web服务会自动启动，无需你启动
- 如果需要安装package, 
    1. 先执行使用VPN： export http_proxy=http://127.0.0.1:7890 &&export https_proxy=$http_proxy
    2. 使用 sudo yarn，需要密码时再提示我
- 使用curl 测试一个API时，先向我索要一个认证token
- 不要删除我留下的注释(以 // // 开头)，你自己写的注释随你处置
- 你修改代码后如需更新接口文档，不要忘记更新 swagger