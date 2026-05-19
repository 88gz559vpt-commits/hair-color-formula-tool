# 染发配方工具 MVP

这是一个可以直接在浏览器访问的染发配方推荐工具。最终页面是仓库根目录的 `index.html`：不需要 React/Vite/Tailwind，不需要构建，也不需要联网下载依赖。

## 直接使用

双击打开：

```txt
index.html
```

或在浏览器地址栏打开这个文件即可使用。页面内置了样式、交互脚本和 6 条示例高频色配方数据；历史方案保存在浏览器 `localStorage` 中。


## 公共网络访问 / 给同事测试

如果你需要一个自己和门店同事都能打开的公网网址，推荐先用 GitHub Pages 部署这个静态页面：

1. 在 GitHub 创建一个仓库，并把本项目推送上去。
2. 进入 GitHub 仓库的 **Settings → Pages**。
3. 在 **Build and deployment** 里把 **Source** 选择为 **GitHub Actions**。
4. 推送到 `work`、`main` 或 `master` 分支后，仓库会自动运行 `.github/workflows/deploy-pages.yml`。
5. 部署完成后，GitHub 会生成公网地址，通常格式是：

```txt
https://<你的 GitHub 用户名>.github.io/<仓库名>/
```

把这个网址发给同事即可测试。当前工具是纯前端静态页，历史方案会保存在每位同事自己浏览器的 `localStorage` 中；后续要做门店共享数据、账号权限或对外销售时，再接入后端数据库和登录系统。

> 如果公网部署失败，请先看 [`DEPLOYMENT.md`](./DEPLOYMENT.md)。当前最常见原因是 GitHub 仓库里还没有推送本项目文件，只有 `.gitkeep` 时 GitHub Actions 不会部署页面。

## 可选命令

这些命令只是为了本地校验或用本地 HTTP 服务预览，不是使用页面的必要步骤。

```bash
npm install
npm run check
npm run dev
```

`npm run dev` 会在 <http://localhost:5173> 预览同一个 `index.html` 页面。

## 功能

- 新建顾客染发方案
- 新生发 / 发中 / 发尾分区录入
- 目标色与目标明度输入
- 自动生成分区配方建议、操作流程、风险提示与摘要
- 高频色配方搜索与筛选
- localStorage 本地保存历史方案
- 高频色数据使用不重叠明度区间：6-7、8-9、10-12、13-15、16度以上
