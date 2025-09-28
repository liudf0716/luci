# 登录页面居中修改说明

## 修改内容

本次修改将 luci-theme-argon 主题的登录页面从原来的居左布局改为居中布局。

## 修改的文件

1. **less/cascade.less** - LESS源文件修改
   - 修改了 `.login-container` 的样式定义
   - 使用 `left: 50%` 和 `transform: translateX(-50%)` 实现水平居中
   - 将 `align-items` 从 `flex-start` 改为 `center`

2. **htdocs/luci-static/argon/css/login-center.css** - 新增CSS覆盖文件
   - 创建了专门的CSS文件来覆盖原有样式
   - 包含移动端响应式设计
   - 使用 `!important` 确保样式优先级

3. **luasrc/view/themes/argon/header_login.htm** - 模板文件修改
   - 在头部添加了新的CSS文件引用
   - 确保登录页面加载新的居中样式

## 样式变更详情

### 原始样式
```css
.login-container {
    margin-left: 5%;
    align-items: flex-start;
}
```

### 修改后样式
```css
.login-container {
    left: 50%;
    transform: translateX(-50%);
    align-items: center;
    margin-left: 0;
}
```

## 响应式设计

在移动端（屏幕宽度 ≤ 480px）时：
- 取消居中效果，恢复全宽显示
- 确保在小屏幕设备上的良好显示效果

## 兼容性

- 保持了原有的毛玻璃效果和背景图片/视频支持
- 兼容明暗主题切换
- 保持了所有原有的交互功能

## 测试建议

1. 在不同分辨率下测试登录页面显示效果
2. 测试移动端响应式布局
3. 验证明暗主题切换功能
4. 确认背景图片和视频功能正常

## 回滚方法

如需回滚修改：
1. 删除 `htdocs/luci-static/argon/css/login-center.css` 文件
2. 从 `header_login.htm` 中移除对该CSS文件的引用
3. 恢复 `less/cascade.less` 中的原始样式定义