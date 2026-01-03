# 北京智能政务导航系统 - Ubuntu 24.04 部署指南

本文档详细说明如何将项目部署到自己的 Ubuntu 24.04 服务器上。

## 前置要求

- Ubuntu 24.04 LTS 系统
- 4GB+ RAM（推荐 8GB）
- 20GB+ 磁盘空间
- 稳定的网络连接
- 一个域名（可选，用于 HTTPS）

## 第一步：准备服务器环境

### 1.1 更新系统
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 安装 Node.js 和 npm
```bash
# 安装 Node.js 22.x LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# 验证安装
node --version
npm --version
```

### 1.3 安装 pnpm（推荐包管理器）
```bash
npm install -g pnpm

# 验证安装
pnpm --version
```

### 1.4 安装 MySQL/MariaDB
```bash
# 安装 MySQL 8.0
sudo apt install -y mysql-server

# 启动 MySQL 服务
sudo systemctl start mysql
sudo systemctl enable mysql

# 验证安装
mysql --version
```

### 1.5 安装 Git
```bash
sudo apt install -y git
```

### 1.6 安装 Nginx（反向代理）
```bash
sudo apt install -y nginx

# 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 1.7 安装 PM2（进程管理）
```bash
sudo npm install -g pm2

# 验证安装
pm2 --version
```

## 第二步：准备数据库

### 2.1 创建数据库和用户
```bash
# 登录 MySQL
sudo mysql -u root

# 在 MySQL 命令行中执行：
CREATE DATABASE beijing_gov_nav CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'gov_user'@'localhost' IDENTIFIED BY 'your_secure_password_here';
GRANT ALL PRIVILEGES ON beijing_gov_nav.* TO 'gov_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2.2 记录数据库连接信息
```
数据库名称: beijing_gov_nav
用户名: gov_user
密码: your_secure_password_here
主机: localhost
端口: 3306
```

## 第三步：克隆和配置项目

### 3.1 克隆项目仓库
```bash
# 进入应用目录
cd /opt
sudo mkdir -p beijing-gov-nav
sudo chown $USER:$USER beijing-gov-nav

# 克隆项目（假设您已将项目推送到 GitHub）
git clone https://github.com/your-username/beijing-gov-nav.git
cd beijing-gov-nav
```

如果项目还在本地，可以通过以下方式上传：
```bash
# 在本地机器上
scp -r /path/to/beijing-gov-nav user@your-server:/opt/
```

### 3.2 安装依赖
```bash
cd /opt/beijing-gov-nav
pnpm install
```

### 3.3 配置环境变量

创建 `.env.production` 文件：
```bash
cat > .env.production << 'EOF'
# 数据库配置
DATABASE_URL="mysql://gov_user:your_secure_password_here@localhost:3306/beijing_gov_nav"

# JWT 密钥（生成强随机密钥）
JWT_SECRET="your_random_jwt_secret_here_min_32_chars"

# OAuth 配置（如果使用 Manus OAuth）
VITE_APP_ID="your_app_id"
OAUTH_SERVER_URL="https://api.manus.im"
VITE_OAUTH_PORTAL_URL="https://manus.im/login"

# 应用配置
VITE_APP_TITLE="北京智能政务导航系统"
VITE_APP_LOGO="https://your-domain.com/logo.png"

# 所有者信息
OWNER_NAME="Your Name"
OWNER_OPEN_ID="your_open_id"

# 分析（可选）
VITE_ANALYTICS_ENDPOINT="https://your-analytics.com"
VITE_ANALYTICS_WEBSITE_ID="your_website_id"
EOF
```

**生成强随机密钥的方法**：
```bash
# 生成 JWT_SECRET
openssl rand -base64 32

# 生成其他随机值
head -c 32 /dev/urandom | base64
```

### 3.4 初始化数据库

```bash
# 生成迁移文件并推送到数据库
pnpm db:push
```

### 3.5 构建项目

```bash
# 构建前端和后端
pnpm build

# 验证构建成功
ls -la dist/
```

## 第四步：配置 Nginx 反向代理

### 4.1 创建 Nginx 配置文件
```bash
sudo tee /etc/nginx/sites-available/beijing-gov-nav > /dev/null << 'EOF'
upstream app {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # 重定向到 HTTPS（可选，需要配置 SSL）
    # return 301 https://$server_name$request_uri;

    # 日志
    access_log /var/log/nginx/beijing-gov-nav.access.log;
    error_log /var/log/nginx/beijing-gov-nav.error.log;

    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://app;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # API 路由
    location /api/ {
        proxy_pass http://app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }

    # 所有其他请求转发到应用
    location / {
        proxy_pass http://app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
```

### 4.2 启用 Nginx 配置
```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/beijing-gov-nav /etc/nginx/sites-enabled/

# 测试 Nginx 配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

## 第五步：使用 PM2 启动应用

### 5.1 创建 PM2 配置文件
```bash
cat > /opt/beijing-gov-nav/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'beijing-gov-nav',
      script: './dist/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '1G',
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'dist'],
    },
  ],
};
EOF
```

### 5.2 启动应用
```bash
cd /opt/beijing-gov-nav

# 启动应用
pm2 start ecosystem.config.js

# 查看应用状态
pm2 status

# 查看日志
pm2 logs beijing-gov-nav

# 设置开机自启
pm2 startup
pm2 save
```

## 第六步：配置 SSL/TLS（HTTPS）

### 6.1 使用 Let's Encrypt 和 Certbot
```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot certonly --nginx -d your-domain.com -d www.your-domain.com

# 更新 Nginx 配置（自动完成）
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 测试自动续期
sudo certbot renew --dry-run

# 设置自动续期定时任务
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### 6.2 验证 HTTPS
```bash
# 访问您的网站
curl -I https://your-domain.com
```

## 第七步：监控和维护

### 7.1 查看应用状态
```bash
# 查看 PM2 应用状态
pm2 status

# 查看应用日志
pm2 logs beijing-gov-nav

# 查看实时监控
pm2 monit
```

### 7.2 重启应用
```bash
# 重启应用
pm2 restart beijing-gov-nav

# 重新加载应用（无停机）
pm2 reload beijing-gov-nav

# 停止应用
pm2 stop beijing-gov-nav
```

### 7.3 更新应用
```bash
cd /opt/beijing-gov-nav

# 拉取最新代码
git pull origin main

# 安装依赖
pnpm install

# 构建项目
pnpm build

# 重启应用
pm2 restart beijing-gov-nav
```

### 7.4 备份数据库
```bash
# 每日备份脚本
cat > /opt/beijing-gov-nav/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/beijing-gov-nav/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

mysqldump -u gov_user -p'your_secure_password_here' beijing_gov_nav > $BACKUP_DIR/beijing_gov_nav_$DATE.sql

# 保留最近 7 天的备份
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete

echo "Database backup completed: $BACKUP_DIR/beijing_gov_nav_$DATE.sql"
EOF

chmod +x /opt/beijing-gov-nav/backup-db.sh

# 添加到 crontab（每天凌晨 2 点备份）
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/beijing-gov-nav/backup-db.sh") | crontab -
```

## 故障排查

### 问题 1：应用无法启动
```bash
# 查看详细错误日志
pm2 logs beijing-gov-nav --err

# 检查数据库连接
mysql -u gov_user -p'your_secure_password_here' -h localhost beijing_gov_nav -e "SELECT 1;"
```

### 问题 2：Nginx 502 Bad Gateway
```bash
# 检查应用是否在运行
pm2 status

# 检查应用监听的端口
netstat -tlnp | grep 3000

# 重启应用
pm2 restart beijing-gov-nav
```

### 问题 3：数据库连接错误
```bash
# 检查 MySQL 服务状态
sudo systemctl status mysql

# 检查数据库用户权限
sudo mysql -u root -e "SHOW GRANTS FOR 'gov_user'@'localhost';"

# 重新授予权限
sudo mysql -u root << 'EOF'
GRANT ALL PRIVILEGES ON beijing_gov_nav.* TO 'gov_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
EOF
```

### 问题 4：内存不足
```bash
# 查看内存使用情况
free -h

# 查看应用内存使用
pm2 monit

# 增加交换空间（如果需要）
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

## 性能优化建议

### 1. 启用 Gzip 压缩
在 Nginx 配置中添加：
```nginx
gzip on;
gzip_types text/plain text/css text/javascript application/json;
gzip_min_length 1000;
```

### 2. 启用缓存
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m;
proxy_cache my_cache;
proxy_cache_valid 200 10m;
```

### 3. 增加 Node.js 内存限制
在 PM2 配置中：
```javascript
node_args: '--max-old-space-size=2048'
```

### 4. 数据库优化
```bash
# 添加索引
mysql -u gov_user -p'password' beijing_gov_nav << 'EOF'
CREATE INDEX idx_user_id ON conversations(userId);
CREATE INDEX idx_conversation_id ON messages(conversationId);
CREATE INDEX idx_category_id ON govProjects(categoryId);
EOF
```

## 安全建议

1. **更改默认端口** - 不要使用标准的 3000 端口
2. **启用防火墙** - 只开放必要的端口（80, 443, 22）
3. **定期更新** - 定期更新系统和依赖包
4. **监控日志** - 定期检查 Nginx 和应用日志
5. **备份数据** - 定期备份数据库和应用文件
6. **使用强密码** - 为数据库和系统用户设置强密码
7. **启用 HTTPS** - 使用 SSL/TLS 加密通信

## 常用命令速查表

```bash
# 应用管理
pm2 start ecosystem.config.js          # 启动应用
pm2 stop beijing-gov-nav               # 停止应用
pm2 restart beijing-gov-nav            # 重启应用
pm2 reload beijing-gov-nav             # 无停机重启
pm2 delete beijing-gov-nav             # 删除应用
pm2 logs beijing-gov-nav               # 查看日志

# Nginx 管理
sudo systemctl start nginx             # 启动 Nginx
sudo systemctl stop nginx              # 停止 Nginx
sudo systemctl restart nginx           # 重启 Nginx
sudo nginx -t                          # 测试配置

# MySQL 管理
sudo systemctl start mysql             # 启动 MySQL
sudo systemctl stop mysql              # 停止 MySQL
mysql -u gov_user -p beijing_gov_nav   # 连接数据库

# 系统监控
top                                    # 查看系统资源
df -h                                  # 查看磁盘空间
free -h                                # 查看内存使用
netstat -tlnp                          # 查看监听端口
```

## 获取帮助

如遇到问题，请检查：
1. 日志文件：`pm2 logs beijing-gov-nav`
2. Nginx 错误日志：`/var/log/nginx/beijing-gov-nav.error.log`
3. MySQL 错误日志：`/var/log/mysql/error.log`
4. 系统日志：`journalctl -xe`

祝您部署顺利！
