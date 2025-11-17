# Pokemon Flash（宝可梦快闪）

宝可梦快闪H5小游戏，使用最基础的 `HTML/CSS/JavaScript` 实现。
> Ai描述: Pokemon Flash 是一个面向移动端与桌面端浏览器的快闪小游戏原型，专注“上手即玩”的体验。无需构建、无需依赖，下载后直接打开即可游玩。

[点此在线游玩](https://cxyagua.github.io/pokemon-flash/)

点击 `START` 开始快闪，点击 `STOP` 暂停，看看你都“抓到”了哪些宝可梦！

---

## Features
- 基础玩法：`START` 开始快闪，`STOP` 暂停
- 轻量资源：仅图片、音效和单文件 `index.html`
- 即开即玩：无需依赖、无需构建，双击即可运行
- 易于扩展：所有逻辑集中在 `index.html`，方便二次开发

## Dependencies

以下依赖均通过CDN引入，无需安装：

- [animate.css](https://github.com/animate-css/animate.css) 简单动画
- [weui](https://github.com/Tencent/weui) 微信风格UI组件库
- [howler](https://github.com/goldfire/howler.js) 简单易用的HTML5音频库

## Quick Start

使用任意本地静态服务器均可，例如[anywhere](https://github.com/JacksonTian/anywhere):
```bash
# 全局安装
npm install -g anywhere

# 进入目录
cd pokemon-flash

# 开启本地静态服务器
anywhere
```
另外IDE也有很多类似`Live Server`之类的插件，都可以快速开启本地静态服务器。

## Roadmap
- [x] v1.0.0：Pokemon Flash 登场！
  - 基础玩法、随机快闪、点击开始/暂停
- [x] v1.1.0：增加神秘感！  
  - 增加设置面板，可设置滤镜（模糊、灰度、亮度）、调节强度
- [ ] v1.2.0：更多的快闪形式！
  - 多样出现方式、速度曲线、布局
- [ ] v1.3.0：快闪抽卡历史！
  - 记录抓到的宝可梦历史与次数
- [ ] v1.4.0：图鉴出现！
  - 独立图鉴页面，展示已收集条目
- [ ] v1.5.0：成就系统！努力集齐图鉴吧！
  - 成就徽章、进度统计、里程碑奖励
- [ ] v1.6.0：宝可梦百科！
  - 链接到宝可梦百科，展示详细信息
- [ ] v1.7.0：PC 也能玩！
  - 键盘/鼠标操作优化、响应式桌面布局

## Change Logs
- v1.0.0 `2025-11-15`：初始版本
  - 基础玩法、随机快闪、点击开始/暂停
- v1.1.0 `2025-11-16`：增加神秘感！
  - 增加设置按钮及设置面板，可设置滤镜（模糊、灰度、亮度）、调节强度
  - 新增依赖：[weui](https://github.com/Tencent/weui)
  - 音效增加（点击、背景音乐）
  - 代码结构及注释优化、删除多余资源
- v1.1.1 `2025-11-17`: 样式优化
  - 修改按钮样式
  - 主图大小自适应

## Contribution
1. 提交 Issue：描述问题或建议，附带复现实例与截图
2. Fork 仓库并创建分支：`feat/xxx` 或 `fix/xxx`
3. 保持代码简洁、避免无关改动
4. 提交 Pull Request 并说明改动内容与影响范围

## License
- [MIT](https://opensource.org/license/MIT)

## Statements
- 本项目为学习与交流用途，涉及的图片与音频仅作示例，不用于商业用途
- 感谢开源社区与浏览器规范制定者为轻量前端开发提供的优秀生态

---

欢迎提出建议与改进，让 Pokemon Flash 更好玩！