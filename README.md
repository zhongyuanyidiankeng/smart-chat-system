# 智能聊天系统

一个基于 Next.js 的现代化智能聊天系统，支持多种聊天模式和文件管理功能。

## 功能特性

### 🤖 多模式聊天
- **普通聊天**: 基础AI对话功能
- **RAG模式**: 基于知识库的检索增强生成
- **智能体模式**: 支持多步骤任务执行和进度跟踪

### 📁 文件管理
- 多文件上传支持
- 上传进度实时显示
- 文件列表管理
- 文件删除功能

### 💬 聊天管理
- 多会话支持
- 聊天历史记录
- 会话切换
- 消息持久化存储

## 技术栈

- **前端**: Next.js 14 + TypeScript + Tailwind CSS
- **状态管理**: React Context + useReducer
- **图标**: Lucide React
- **存储**: LocalStorage (可扩展为数据库)

## 快速开始

### 环境要求
- Node.js >= 18.0.0
- npm 或 yarn

### 安装步骤

1. 克隆项目
```bash
git clone <repository-url>
cd smart-chat-system
```
2. 运行安装脚本
```bash
npm install
```
3. 启动开发服务器
```bash
npm run dev
```
4. 访问应用
打开浏览器访问 http://localhost:3000