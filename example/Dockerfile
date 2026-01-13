# 使用官方 Node.js 24 作为基础镜像
FROM node:24.12-alpine AS build
 
# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
# 注意：.env 文件需和 Dockerfile 同目录，若路径不同请调整
COPY .env ./
COPY package*.json ./

# 安装依赖
RUN npm config set registry https://mirrors.huaweicloud.com/repository/npm/ && npm install

# 复制项目文件
COPY . .

# --- 关键修复：赋予 node_modules 下所有可执行文件权限 ---
RUN chmod -R +x node_modules/.bin

# 构建生产版本
RUN npm run build

# 使用 Nginx 作为生产服务器
FROM nginx:1.23-alpine

# 复制构建产物到 Nginx 静态目录
COPY --from=build /app/dist /usr/share/nginx/html

# 复制自定义 Nginx 配置
COPY example/nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
