# 德语 A1 学习工具 📚

一个现代化的德语 A1 级别词汇学习 H5 应用，基于 React Router 7 和 Cloudflare Workers 构建。

## ✨ 功能特性

### 📖 学习模式
- **单元学习**: 按照单元系统学习新词汇
- **学习页面**: 系统化的词汇学习，包含发音、词性、例句等
- **随机学习**: 随机挑选词汇进行学习

### 💪 练习模式
- **冠词练习**: 练习德语名词的冠词（der/die/das）
- **复数练习**: 练习名词的复数形式
- **动词练习**: 练习动词变位

### 📝 测试模式
- **选择题测试**: 多选题形式测试词汇掌握程度
- **完形填空**: 通过上下文填写正确的词汇
- **中译德测试**: 根据中文翻译写出德语单词
- **听力测试**: 通过语音识别德语单词

### 🔄 复习系统
- **智能复习**: 基于 SRS（间隔重复系统）算法的智能复习
- **错题本**: 收集并复习答错的题目
- **进度追踪**: 实时查看学习进度和统计数据

### 🎯 其他特性
- 📱 响应式设计，支持移动端和桌面端
- 🔊 内置语音播放功能
- 📊 学习进度可视化
- 💾 本地存储学习数据
- 🌐 支持离线使用

## 🛠️ 技术栈

- **前端框架**: React 19 + React Router 7
- **样式**: TailwindCSS 4
- **语言**: TypeScript
- **部署**: Cloudflare Workers
- **构建工具**: Vite 6

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

或使用 pnpm:

```bash
pnpm install
```

### 开发模式

启动开发服务器：

```bash
npm run dev
```

应用将在 `http://localhost:5173` 运行。

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 📦 数据管理

项目包含一些实用的脚本来管理词汇数据：

```bash
# 为词汇添加单元 ID
npm run add-unit-ids

# 添加动词变位信息
npm run add-verb-conjugations

# 标记词汇类型
npm run mark-word-types

# 获取词汇的音标信息
npm run fetch-phonetics
```

## 🌐 部署

### 部署到 Cloudflare Workers

1. 创建 [Cloudflare 账号](https://dash.cloudflare.com/sign-up)
2. 构建应用：
```bash
npm run build
```
3. 部署：
```bash
npm run deploy
```

### 部署预览版本

```bash
npx wrangler versions upload
```

### 推送到生产环境

```bash
npx wrangler versions deploy
```

## 📁 项目结构

```
deutsch-words/
├── app/
│   ├── components/       # React 组件
│   ├── hooks/           # 自定义 Hooks
│   ├── routes/          # 路由页面
│   ├── types/           # TypeScript 类型定义
│   └── utils/           # 工具函数
├── public/
│   └── words.json       # 词汇数据
├── scripts/             # 数据处理脚本
└── workers/             # Cloudflare Workers 配置
```

## 📝 词汇数据格式

词汇数据存储在 `public/words.json` 文件中，包含以下信息：
- 德语单词及其变体
- 中文翻译
- 词性标记
- 音标
- 例句
- 单元分类
- 动词变位（针对动词）

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可

MIT License

---

使用 ❤️ 和 React Router 构建
