# HM 文档站项目

![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)
![Astro](https://img.shields.io/badge/Astro-6.4.2-ff5d01.svg)
![Status](https://img.shields.io/badge/Status-MVP-111827.svg)
![Deploy](https://img.shields.io/badge/Deploy-Vercel-000000.svg)

这是一个以文档为内容源的站点项目，目标是把 `res` 目录中的 `DOCX / PDF` 文档逐步整理成可浏览、可检索、可持续更新的网页内容。

当前仓库同时包含 4 类核心资产：

- 原始文档源文件
- 文档转 Markdown 与网站化更新脚本
- 静态原型验证资源
- 正式 Astro 站点与部署配置

## 在线访问

部署完成后，可以把下面的占位地址替换成你的真实线上地址：

- 站点首页：`https://your-project.vercel.app/`
- 原型页：`https://your-project.vercel.app/prototype`
- 文档页：`https://your-project.vercel.app/documents/management-evaluation-pro-v3-2`

如果你后续绑定了自定义域名，也只需要把这里统一替换即可。

## 快速开始

如果你是第一次接手这个项目，建议按这个顺序：

1. 先看仓库说明和目录结构
2. 运行一键更新脚本，理解文档更新链路
3. 本地打开 `prototype` 预览交互效果
4. 进入 `site` 目录运行 Astro
5. 最后再接 Vercel 部署

最常用的 3 个命令如下：

```powershell
powershell -ExecutionPolicy Bypass -File e:\HM\update_management_doc.ps1
node e:\HM\prototype\server.js 8129
cd e:\HM\site; npm install; npm run dev
```

## 仓库入口

如果你只想快速找到关键文件，优先看这里：

- 站点入口：[site/src/pages/index.astro](file:///e:/HM/site/src/pages/index.astro)
- 原型页入口：[site/src/pages/prototype.astro](file:///e:/HM/site/src/pages/prototype.astro)
- 内容集合配置：[site/src/content/config.ts](file:///e:/HM/site/src/content/config.ts)
- 当前主文档：[management_evaluation_indicators_pro_v3_2.md](file:///e:/HM/site/src/content/documents/management_evaluation_indicators_pro_v3_2.md)
- 一键更新脚本：[update_management_doc.py](file:///e:/HM/update_management_doc.py)
- Vercel 部署说明：[DEPLOY_VERCEL.md](file:///e:/HM/site/DEPLOY_VERCEL.md)

当前已经围绕 `management_evaluation_indicators_pro_v3_2.docx` 完成了一条最小可用链路：

- 源文档提取
- Markdown 整理
- 单页原型验证
- Astro 页面化
- Content Collections 接入
- 一键更新脚本
- Vercel 部署配置

## 当前能力

- 将指定 DOCX 转换为适合站点发布的 Markdown
- 将内容接入 Astro Content Collections
- 提供 `/prototype` 原型页与 `/documents/[slug]` 文档详情页
- 支持正文搜索、目录导航、分类折叠、内容筛选
- 支持指标点选清单、导出和本地保存
- 支持更新前版本归档
- 支持部署到 Vercel

## 目录结构

```text
e:\HM
├─ res/                              # 原始文档目录
├─ prototype/                        # 静态原型资源与本地预览服务
├─ site/                             # 正式 Astro 站点
│  ├─ src/
│  │  ├─ components/
│  │  ├─ content/
│  │  │  ├─ documents/
│  │  │  └─ config.ts
│  │  ├─ layouts/
│  │  └─ pages/
│  ├─ astro.config.mjs
│  ├─ package.json
│  ├─ vercel.json
│  └─ DEPLOY_VERCEL.md
├─ _docx_to_md.py                    # 早期 DOCX -> Markdown 初稿脚本
├─ refine_markdown_for_site.py       # 早期 Markdown 网站化整理脚本
├─ update_management_doc.py          # 当前一键更新主脚本
├─ update_management_doc.ps1         # Windows 一键更新入口
├─ management_evaluation_indicators_pro_v3_2.md
└─ .gitignore
```

## 当前主文档

当前 MVP 文档是：

- 源文件：`res/management_evaluation_indicators_pro_v3_2.docx`
- 站点内容文件：`site/src/content/documents/management_evaluation_indicators_pro_v3_2.md`

当前主要页面入口：

- 首页：`/`
- 原型页：`/prototype`
- 文档页：`/documents/management-evaluation-pro-v3-2`

## 本地开发

### 1. 更新文档内容

当源文档有新版本时，优先运行一键更新脚本：

```powershell
powershell -ExecutionPolicy Bypass -File e:\HM\update_management_doc.ps1
```

它会完成以下事情：

- 读取最新 `.docx`
- 生成原始 Markdown
- 生成站点内容 Markdown
- 更新 `site/src/content/documents/` 中的正式内容文件
- 在更新前自动归档旧版本

### 2. 本地预览原型页

```powershell
node e:\HM\prototype\server.js 8129
```

然后打开：

- `http://127.0.0.1:8129/prototype/`

### 3. 本地运行 Astro

进入站点目录：

```powershell
cd e:\HM\site
```

安装依赖：

```powershell
npm install
```

启动开发环境：

```powershell
npm run dev
```

构建站点：

```powershell
npm run build
```

## 部署

当前推荐使用 `Vercel` 部署。

关键配置如下：

- `Framework Preset`: `Astro`
- `Root Directory`: `site`
- `Install Command`: `npm install`
- `Build Command`: `npm run build`
- `Output Directory`: `dist`
- `Node.js Version`: `20`

详细说明见：

- [DEPLOY_VERCEL.md](file:///e:/HM/site/DEPLOY_VERCEL.md)

## 推送到 GitHub

如果你要把整个项目推到 GitHub，推荐直接从仓库根目录 `e:\HM` 推。

常用命令：

```powershell
cd e:\HM
git init
git branch -M main
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main
```

后续更新时：

```powershell
git add .
git commit -m "更新文档与站点"
git push
```

## GitHub 发布建议

下面这些内容可以直接填到 GitHub 仓库设置页：

- Repository name:
  `hm-doc-site`
- Description:
  `将 DOCX/PDF 文档整理为可持续更新的 Astro 文档站，包含内容转换脚本、原型页与 Vercel 部署配置。`
- Website:
  `https://your-project.vercel.app/`
- Topics:
  `astro`, `documentation`, `markdown`, `docx`, `content-collections`, `vercel`, `knowledge-base`

如果你后续想公开展示，这一组信息已经足够作为第一版仓库元信息。

## 适合的后续方向

- 继续把 `res` 中更多文档接入 `site/src/content/documents/`
- 首页从单文档入口升级为多文档目录页
- 为文档增加更规范的元数据与分类体系
- 增加批量更新脚本，而不只处理单篇文档
- 接入自动化构建与发布流程

## 说明

当前仓库既包含“站点代码”，也包含“源文档”和“内容更新脚本”。

这意味着后续工作方式不是反复手工重做页面，而是：

`更新文档 -> 运行脚本 -> 提交代码 -> 自动部署`

## License

- License: [Apache-2.0](file:///e:/HM/LICENSE)
- Notice: [NOTICE](file:///e:/HM/NOTICE)
