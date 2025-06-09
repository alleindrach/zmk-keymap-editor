# 使用指定的Node.js基础镜像
FROM node:20.19.2-alpine

# 设置工作目录
WORKDIR /keymap-editor/api

# 拷贝package.json和package-lock.json（如果存在）
COPY api/package*.json ./

# 安装依赖
RUN npm install

# 拷贝api目录下的所有文件到工作目录
COPY api/  .
# 暴露应用所需的端口（根据你的实际情况调整）
# EXPOSE 3000

# 设置启动命令
CMD ["npm", "start"]