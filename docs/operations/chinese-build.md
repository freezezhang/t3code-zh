# 简体中文版本构建

此分支基于官方稳定版 `v0.1.7`（`322f6544dfad0a3c8a0c8cbecf2c7f7874b14268`）。网页和桌面端的共用界面支持在 **Settings → General → Language** 中切换 English／简体中文，立即生效并在此设备保存。尚未翻译的界面文本回退到英文。原生移动端和 Electron 的系统菜单目前仍使用上游语言。

## macOS Intel 和 Apple Silicon

在 Mac 上安装 `package.json` 指定的 Node.js、[Vite+](https://viteplus.dev/)、[Rust](https://rustup.rs/) 和 Xcode Command Line Tools（`xcode-select --install`）。Apple Silicon 构建 Intel 版本还需要 Rosetta。打包过程需要联网下载依赖及原生组件，不使用 GitHub Actions。

在仓库根目录执行：

```bash
# 同时构建 M 系列和 Intel 两种版本
bash scripts/build-macos-zh.sh

# 或仅构建一种
bash scripts/build-macos-zh.sh arm64
bash scripts/build-macos-zh.sh x64
```

产物位于 `release/`，文件名包含 `arm64`（M 系列）或 `x64`（Intel）。脚本默认生成未签名、未公证的安装包；macOS 可能要求在“系统设置 → 隐私与安全性”中允许打开。更新源指向本 Fork。

Linux 可以构建网页和通用 JavaScript，但最终的 macOS DMG 打包及运行验证需要在 Mac 上完成。

## 公开仓库的免费 macOS 构建

本 Fork 的 `Build macOS Chinese Edition` 工作流使用标准 `macos-26` 和 `macos-15-intel` runner。[GitHub 的计费说明](https://docs.github.com/en/billing/concepts/product-billing/github-actions)规定，公开仓库的标准 runner 不消耗私有仓库的计算额度；大型 runner 不适用此规则。工作流仅允许在公开的 `freezezhang/t3code-zh` 中运行。

启用仓库的 Actions 后，推送汉化分支会触发构建。产物直接上传到 Release 草稿，不占 Actions artifact 存储额度，也不会自动发布正式版。若工作流尚未启用，先启用它，再推送一次分支以触发构建。

## 网页生产包

```bash
vp install
vp run --filter @t3tools/web build
```

产物在 `apps/web/dist/`。这是前端资源，需要配合兼容的 T3 Code 服务端使用，不能作为 macOS 安装包运行。
