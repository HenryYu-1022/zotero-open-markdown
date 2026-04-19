# Zotero Open Markdown

English version: [README.md](README.md)

---

一个轻量级 [Zotero 7](https://www.zotero.org/) 插件，在右键菜单中添加 **在 Finder 中显示** 和 **用默认编辑器打开** 对应 Markdown 文件的选项——将你的 Zotero 文献库与 [paper-agent](https://github.com/HenryYu-1022/paper-agent) 生成的 Markdown 语料库连接起来。

## 为什么需要这个插件

如果你使用 [paper-agent](https://github.com/HenryYu-1022/paper-agent) 将 Zotero 的 PDF 文献库转换成了 Markdown，你就拥有了一个丰富的、可搜索的纯文本语料库。但是，当你在 Zotero 中想快速跳转到某篇文献的 Markdown 文件时——比如想在 Obsidian 里阅读、喂给 AI agent、或者只是浏览转换后的全文——Zotero 本身没有这个功能。

这个插件在右键菜单中添加了两个选项：

- **在 Finder 中显示 Markdown** — 在系统的文件管理器中高亮显示 Markdown 文件/文件夹（macOS 用 Finder，Windows 用资源管理器）
- **打开 Markdown 文件** — 使用系统默认的 Markdown 编辑器打开 `.md` 文件（如 Obsidian、Typora、VS Code）

## 工作原理

```text
Zotero 条目 → PDF 附件 → input_root/<路径>/Paper.pdf
                                   ↓ (文件名映射)
                          markdown_root/<路径>/Paper/Paper.md
                                   ↓
                          在 Finder 中显示 / 用编辑器打开
```

插件读取 PDF 附件的文件路径，计算相对于 `input_root` 的相对路径，然后在 `markdown_root` 下查找对应的 Markdown 目录。这与 [paper-agent](https://github.com/HenryYu-1022/paper-agent) 的输出目录结构一致。

## 安装

### 前提条件

- **Zotero 7** 或更高版本
- 由 [paper-agent](https://github.com/HenryYu-1022/paper-agent) 生成的 Markdown 库（或任何遵循 `<文件名>/<文件名>.md` 目录结构的工具）

### 从 .xpi 安装

1. 从 [Releases](https://github.com/HenryYu-1022/zotero-open-markdown/releases) 页面下载最新的 `zotero-open-markdown.xpi`
2. 在 Zotero 中，打开 **工具 → 附加组件**
3. 点击齿轮图标 ⚙ → **从文件安装附加组件…**
4. 选择下载的 `.xpi` 文件
5. 如果提示重启 Zotero，请重启

### 从源码构建

```bash
git clone https://github.com/HenryYu-1022/zotero-open-markdown.git
cd zotero-open-markdown
bash scripts/build.sh
```

这会在项目根目录下生成 `zotero-open-markdown.xpi`。按上面的步骤安装即可。

## 配置

安装后，在 **Zotero 偏好设置 → Open Markdown** 中配置插件：

| 设置 | 说明 | 示例 |
|------|------|------|
| **Markdown 库根目录** | 转换后的 Markdown 文件所在的根目录。这是 paper-agent 的 `output_root/markdown/` 目录。 | `/Users/你的用户名/Documents/paper-library/output/markdown` |
| **PDF 库根目录** | 源 PDF 文件所在的根目录。这应该和 paper-agent 的 `settings.json` 中的 `input_root` 一致。 | `/Users/你的用户名/Documents/paper-library/input` |

> **提示：** 如果你使用 [zotero-attanger](https://github.com/HenryYu-1022/zotero-attanger) 将 PDF 同步到 Google Drive，PDF 库根目录应该指向 attanger 的导出目录。

## 使用方法

1. 在 Zotero 中选中一个有 PDF 附件的条目
2. 右键打开上下文菜单
3. 你会在菜单底部看到两个新选项：
   - **在 Finder 中显示 Markdown** — 在文件管理器中定位到 Markdown 文件
   - **打开 Markdown 文件** — 用默认编辑器打开 `.md` 文件

如果没有找到对应的 Markdown 文件，会显示一个包含排错指引的提示对话框。

## 兼容性

| Zotero 版本 | 状态 |
|-------------|------|
| Zotero 7.x | ✅ 完全支持 |
| Zotero 6.x | ❌ 不支持（需要 Zotero 7 bootstrap API） |

## 相关项目

| 项目 | 说明 |
|------|------|
| [paper-agent](https://github.com/HenryYu-1022/paper-agent) | 将你的 Zotero PDF 文献库转换成 Markdown 语料库，供 AI agent 使用 |
| [zotero-attanger](https://github.com/HenryYu-1022/zotero-attanger) | 将 Zotero 附件同步到 Google Drive，支持多设备访问 |

## 致谢

本项目在 AI 编程助手的协助下开发：

<table>
  <tr>
    <td align="center"><a href="https://deepmind.google/technologies/gemini/"><img src="https://img.shields.io/badge/Gemini-Google_DeepMind-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini"></a></td>
    <td>架构设计、代码实现和文档编写均与 <strong>Gemini</strong> 结对完成。</td>
  </tr>
</table>

## 许可证

MIT。详见 [LICENSE](LICENSE)。
