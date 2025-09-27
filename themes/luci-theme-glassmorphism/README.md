# 🌊 Glassmorphism Theme for ChaWrt LuCI

现代液态玻璃主题 - 为ChaWrt LuCI设计的下一代用户界面主题

## ✨ 特性

### 🎨 现代设计
- **Glassmorphism效果**: 半透明背景配合背景模糊，营造现代液态玻璃质感
- **动态渐变**: 精美的渐变色彩系统，支持主题色切换
- **响应式布局**: 完美适配桌面、平板和手机设备
- **交互动画**: 流畅的悬停和点击动画效果

### 🔧 技术特性
- **CSS变量系统**: 50+ 自定义CSS变量，便于定制和维护
- **性能优化**: 使用现代CSS特性，快速加载和渲染
- **完整覆盖**: 100% LuCI组件样式覆盖
- **跨浏览器兼容**: 支持所有现代浏览器

### 🎯 Logo系统
- **主Logo** (`logo.svg`): 完整版本，适用于头部导航和大尺寸显示
- **48px专用版** (`logo_48.svg`): 专门为48像素优化，适用于favicon和应用图标
- **简化版** (`logo-simple.svg`): 最简洁版本，适用于16px-24px小图标

### 🏷️ ChaWrt品牌标识
- **完整版品牌** (`brand.svg`): 200x60px，ChaWrt完整品牌标识，包含网络图标和品牌文字
- **紧凑版品牌** (`brand-compact.svg`): 120x40px，适合导航栏等小空间显示

## � 安装

### 方法一：ChaWrt编译集成

1. 将主题文件夹复制到ChaWrt源码目录：
```bash
cp -r luci-theme-glassmorphism $(CHAWRT_DIR)/feeds/luci/themes/
```

2. 更新feeds并安装：
```bash
./scripts/feeds update luci
./scripts/feeds install luci-theme-glassmorphism
```

3. 在menuconfig中选择主题：
```
LuCI -> 3. Themes -> luci-theme-glassmorphism
```

### 方法二：手动安装

1. 将theme文件夹上传到ChaWrt设备：
```bash
scp -r luci-theme-glassmorphism root@192.168.1.1:/usr/lib/lua/luci/view/themes/
```

2. 重启uhttpd服务：
```bash
/etc/init.d/uhttpd restart
```

3. 在LuCI界面选择主题：
`System -> System -> Language and Style -> Design`

## 🎨 自定义

### 颜色系统

主题使用CSS变量系统，可以轻松自定义颜色：

```css
:root {
    /* 主色调 */
    --glass-primary: #e94560;
    --glass-secondary: #9333ea;
    
    /* 状态色 */
    --glass-success: #10b981;
    --glass-warning: #f59e0b;
    --glass-danger: #ef4444;
    --glass-info: #3b82f6;
    
    /* 背景色 */
    --glass-bg-primary: #1a1a2e;
    --glass-bg-secondary: #16213e;
    
    /* 玻璃效果 */
    --glass-blur: 10px;
    --glass-opacity: 0.05;
}
```

### Logo定制

根据需要修改对应的logo文件：
- 主界面显示：修改 `logo.svg`
- 浏览器图标：修改 `logo_48.svg`
- 小尺寸图标：修改 `logo-simple.svg`

## 📱 浏览器支持

| 浏览器 | 版本支持 | Glassmorphism效果 |
|--------|----------|-------------------|
| Chrome | 76+ | ✅ 完整支持 |
| Firefox | 103+ | ✅ 完整支持 |
| Safari | 14+ | ✅ 完整支持 |
| Edge | 79+ | ✅ 完整支持 |
| Opera | 63+ | ✅ 完整支持 |

> **注意**: `backdrop-filter` 是Glassmorphism效果的核心，较老的浏览器可能不支持模糊效果，但会优雅降级到纯色背景。

## 🛠️ 开发

### 文件结构

```
luci-theme-glassmorphism/
├── Makefile                    # ChaWrt包配置
├── README.md                   # 文档
├── demo.html                   # 主题演示页面
├── logo-sizes.html            # Logo尺寸测试页面
├── htdocs/luci-static/glassmorphism/
│   ├── cascade.css            # 主样式文件 (3000+ 行)
│   ├── glassmorphism.css      # Glassmorphism效果
│   ├── cbi.css               # 表单组件样式
│   ├── logo.css              # Logo相关样式
│   ├── glassmorphism.js      # 交互脚本
│   ├── logo.svg              # 主Logo
│   ├── logo_48.svg           # 48px专用Logo
│   └── logo-simple.svg       # 简化Logo
└── ucode/template/themes/glassmorphism/
    ├── header.ut             # 页面头部模板
    └── footer.ut             # 页面底部模板
```

### 样式开发

主要样式文件说明：

1. **cascade.css**: 主样式文件，包含所有LuCI组件的Glassmorphism样式
2. **glassmorphism.css**: 专门的Glassmorphism效果定义
3. **cbi.css**: CBI表单系统的样式覆盖
4. **logo.css**: Logo显示和响应式相关样式

### 颜色变量

```css
/* 主题色系 */
--glass-primary: #e94560;          /* 主色 - 珊瑚红 */
--glass-secondary: #9333ea;        /* 辅色 - 紫罗兰 */
--glass-accent: #06b6d4;           /* 强调色 - 青色 */

/* 状态色系 */
--glass-success: #10b981;          /* 成功 - 绿色 */
--glass-warning: #f59e0b;          /* 警告 - 琥珀色 */
--glass-danger: #ef4444;           /* 危险 - 红色 */
--glass-info: #3b82f6;             /* 信息 - 蓝色 */

/* 背景色系 */
--glass-bg-primary: #1a1a2e;       /* 主背景 */
--glass-bg-secondary: #16213e;      /* 辅助背景 */
--glass-bg-tertiary: #0f1419;      /* 深背景 */
```

## 🎯 演示页面

访问以下页面查看主题效果：

- `demo.html` - 完整主题演示
- `logo-sizes.html` - Logo尺寸对比测试

## 🔄 版本历史

### v1.0.0 (2024-01-XX)
- ✅ 完整的Glassmorphism主题实现
- ✅ 响应式设计支持
- ✅ 多版本Logo系统
- ✅ CSS变量自定义系统
- ✅ 完整的LuCI组件覆盖

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献

欢迎提交问题和功能请求！

1. Fork 这个项目
2. 创建你的功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的修改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 💎 特别说明

这个主题采用了现代的Glassmorphism设计语言，灵感来源于：
- Apple的设计系统
- Microsoft Fluent Design
- Google Material You

主题的网络拓扑Logo设计象征着：
- 🌐 连接性：路由器的核心功能
- ⚡ 现代化：先进的网络技术
- 🎨 美观：优雅的视觉体验

---

*"重新定义路由器管理体验，让网络管理变得优雅而现代"*