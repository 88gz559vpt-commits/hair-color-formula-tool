# 公网部署排查与操作说明

## 当前失败原因

GitHub 上的 `88gz559vpt-commits/hair-color-formula-tool` 仓库目前只看到 `.gitkeep`，还没有本项目的 `index.html`、`.github/workflows/deploy-pages.yml` 等文件。因此 GitHub Actions 没有部署工作流可运行，GitHub Pages 也不会生成可访问页面。

本地已经配置好远程仓库：

```txt
https://github.com/88gz559vpt-commits/hair-color-formula-tool.git
```

但当前执行环境尝试推送时失败：

```txt
CONNECT tunnel failed, response 403
```

这表示当前容器的网络代理阻止了 GitHub git 推送。绕过代理后又无法解析 `github.com`，所以需要在你自己的电脑、GitHub Codespaces，或任何能正常访问 GitHub 的环境里完成推送。

## 最快修复方式

在你自己的电脑终端里运行：

```bash
git clone https://github.com/88gz559vpt-commits/hair-color-formula-tool.git
cd hair-color-formula-tool
```

然后把本项目所有文件复制进去，至少包括：

```txt
.github/
.gitignore
DEPLOYMENT.md
README.md
index.html
package.json
package-lock.json
scripts/
src/
tsconfig.json
```

提交并推送：

```bash
git add .
git commit -m "Deploy hair color formula tool"
git push origin main
```

## 启用 GitHub Pages

进入 GitHub 仓库：

```txt
Settings → Pages
```

把 **Build and deployment → Source** 设为：

```txt
GitHub Actions
```

然后等待 Actions 运行完成。

## 部署成功后的访问网址

```txt
https://88gz559vpt-commits.github.io/hair-color-formula-tool/
```

如果打开 404，通常是以下原因之一：

1. 代码还没有推送到 GitHub。
2. GitHub Pages 的 Source 没有选 GitHub Actions。
3. Actions 还没跑完或失败。
4. 仓库默认分支不是 `main`，但代码推到了其他分支且 workflow 没触发。

