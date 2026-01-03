#!/bin/bash

# 北京智能政务导航系统 - 快速部署脚本
# 使用方法: ./deploy.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查依赖
check_dependencies() {
    print_info "检查系统依赖..."
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js 未安装。请先安装 Node.js 22.x LTS"
        exit 1
    fi
    print_success "Node.js $(node --version) 已安装"
    
    # 检查 pnpm
    if ! command -v pnpm &> /dev/null; then
        print_warning "pnpm 未安装，正在安装..."
        npm install -g pnpm
    fi
    print_success "pnpm $(pnpm --version) 已安装"
    
    # 检查 MySQL
    if ! command -v mysql &> /dev/null; then
        print_error "MySQL 未安装。请先安装 MySQL 8.0"
        exit 1
    fi
    print_success "MySQL 已安装"
    
    # 检查 Git
    if ! command -v git &> /dev/null; then
        print_error "Git 未安装。请先安装 Git"
        exit 1
    fi
    print_success "Git $(git --version | awk '{print $3}') 已安装"
}

# 安装项目依赖
install_dependencies() {
    print_info "安装项目依赖..."
    pnpm install
    print_success "项目依赖安装完成"
}

# 配置环境变量
setup_env() {
    print_info "配置环境变量..."
    
    if [ -f .env.production ]; then
        print_warning ".env.production 已存在，跳过创建"
        return
    fi
    
    read -p "请输入数据库主机 (默认: localhost): " DB_HOST
    DB_HOST=${DB_HOST:-localhost}
    
    read -p "请输入数据库名称 (默认: beijing_gov_nav): " DB_NAME
    DB_NAME=${DB_NAME:-beijing_gov_nav}
    
    read -p "请输入数据库用户名 (默认: gov_user): " DB_USER
    DB_USER=${DB_USER:-gov_user}
    
    read -sp "请输入数据库密码: " DB_PASSWORD
    echo
    
    # 生成随机 JWT_SECRET
    JWT_SECRET=$(openssl rand -base64 32)
    
    cat > .env.production << EOF
# 数据库配置
DATABASE_URL="mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:3306/${DB_NAME}"

# JWT 密钥
JWT_SECRET="${JWT_SECRET}"

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
    
    print_success "环境变量配置完成"
}

# 初始化数据库
init_database() {
    print_info "初始化数据库..."
    pnpm db:push
    print_success "数据库初始化完成"
}

# 构建项目
build_project() {
    print_info "构建项目..."
    pnpm build
    print_success "项目构建完成"
}

# 配置 PM2
setup_pm2() {
    print_info "配置 PM2..."
    
    if ! command -v pm2 &> /dev/null; then
        print_warning "PM2 未安装，正在安装..."
        sudo npm install -g pm2
    fi
    
    cat > ecosystem.config.js << 'EOF'
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
    
    mkdir -p logs
    print_success "PM2 配置完成"
}

# 启动应用
start_application() {
    print_info "启动应用..."
    pm2 start ecosystem.config.js
    pm2 save
    print_success "应用已启动"
    
    print_info "应用状态:"
    pm2 status
}

# 配置 Nginx
setup_nginx() {
    print_info "配置 Nginx..."
    
    read -p "请输入您的域名 (例如: example.com): " DOMAIN
    
    if [ -z "$DOMAIN" ]; then
        print_warning "未提供域名，跳过 Nginx 配置"
        return
    fi
    
    NGINX_CONFIG="/etc/nginx/sites-available/beijing-gov-nav"
    
    cat > /tmp/beijing-gov-nav.nginx << EOF
upstream app {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    access_log /var/log/nginx/beijing-gov-nav.access.log;
    error_log /var/log/nginx/beijing-gov-nav.error.log;

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://app;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location /api/ {
        proxy_pass http://app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }

    location / {
        proxy_pass http://app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
    
    sudo cp /tmp/beijing-gov-nav.nginx $NGINX_CONFIG
    sudo ln -sf /etc/nginx/sites-available/beijing-gov-nav /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl restart nginx
    
    print_success "Nginx 配置完成"
    print_info "您的应用现在可以通过 http://${DOMAIN} 访问"
}

# 显示部署总结
show_summary() {
    print_info "=========================================="
    print_success "部署完成！"
    print_info "=========================================="
    echo ""
    echo "应用信息:"
    echo "  - 应用名称: beijing-gov-nav"
    echo "  - 本地访问: http://localhost:3000"
    echo "  - 应用日志: pm2 logs beijing-gov-nav"
    echo ""
    echo "常用命令:"
    echo "  - 查看状态: pm2 status"
    echo "  - 重启应用: pm2 restart beijing-gov-nav"
    echo "  - 停止应用: pm2 stop beijing-gov-nav"
    echo "  - 查看日志: pm2 logs beijing-gov-nav"
    echo ""
    echo "下一步建议:"
    echo "  1. 配置 HTTPS (使用 Certbot)"
    echo "  2. 配置数据库备份"
    echo "  3. 配置监控和告警"
    echo "  4. 定期更新依赖包"
    echo ""
}

# 主函数
main() {
    print_info "开始部署北京智能政务导航系统..."
    echo ""
    
    check_dependencies
    echo ""
    
    install_dependencies
    echo ""
    
    setup_env
    echo ""
    
    init_database
    echo ""
    
    build_project
    echo ""
    
    setup_pm2
    echo ""
    
    start_application
    echo ""
    
    read -p "是否配置 Nginx? (y/n): " SETUP_NGINX
    if [ "$SETUP_NGINX" = "y" ]; then
        setup_nginx
        echo ""
    fi
    
    show_summary
}

# 运行主函数
main
