'use strict';

return L.Class.extend({
    /*
    该 desc 函数用于生成一个带有 GitHub 项目和其 LuCI 界面项目链接的 HTML 片段，常用于 OpenWrt 的 LuCI 应用描述区，方便用户快速跳转到相关 GitHub 项目页面。

    参数说明：
      - description: 项目描述文本
      - username: GitHub 用户名
      - project: 项目名（如 apfree-wifidog）

    主要逻辑：
      1. 构造 LuCI 项目的名称（如 luci-app-apfree-wifidog）。
      2. 构造主项目和 LuCI 项目的 GitHub 跳转提示语。
      3. 构造用于 shields.io 徽章的 label（将 - 替换为 _，并加上 -default 后缀）。
      4. 返回一段 HTML 表格，内容包括：
         - 第一列为项目描述
         - 第二列为嵌套表格，包含两个 GitHub 链接（主项目和 LuCI 项目），每个链接下有两个徽章：
           - 一个是 package/luci 的自定义 badge
           - 一个是 GitHub star 数的社交徽章
      5. 所有链接均新窗口打开，徽章图片通过 shields.io 动态生成。

    这样做的目的是让用户在 LuCI 界面上能直观看到项目描述、快速跳转到源码仓库，并看到 star 数等信息。
    */
    desc: function(description, username, project) {
        var title = _('if you have any problem, please click to view the project on GitHub : ') + project;
        var luci_title = _('if you have any problem, please click to view the luci ui project on GitHub : ')  + project;
        var chawrt_title = _('if you have any problem, please click to view the chawrt firmware project on GitHub : ')  + project;
        var package_label = 'package-' + project.replace(/-/g, '_') + '-default';
        var chawrt_label = 'chawrt-openwrt_variant-default';
        var luci_label = 'LuCI-UI_for_'+project.replace(/-/g, '_')+'-default';

        return "<table style='border: 0; table-layout: auto; width:100%; text-align: left;'>" +
                    "<tr>" +
                        "<td style='border: 0; text-align: left; padding: 8px 0; font-size: 16px; font-weight: 500;'>" + _(description) + "</td>" +
                    "</tr>" +
                    "<tr>" +
                        "<td style='border: 0; text-align: left; padding: 8px 0;'>" +
                            "<a href='https://github.com/" + username + "/" + project + "' target='_blank' title='" + title + "' style='display: inline-block; margin-right: 8px;'>" +
                                "<img alt='" + project + "' src='https://img.shields.io/badge/" + package_label +  "' />" +
                                "<img alt='" + project + "' src='https://img.shields.io/github/stars/" + username + "/" + project + "?style=social' />" +
                            "</a>" +
                            "<a href='https://github.com/liudf0716/luci' target='_blank' title='" + luci_title + "' style='display: inline-block; margin-right: 8px;'>" +
                                "<img alt='LuCI' src='https://img.shields.io/badge/" + luci_label + "' />" +
                                "<img alt='LuCI' src='https://img.shields.io/github/stars/liudf0716/luci?style=social' />" +
                            "</a>" +
                            "<a href='https://github.com/liudf0716/chawrt' target='_blank' title='" + chawrt_title + "' style='display: inline-block; margin-right: 8px;'>" +
                                "<img alt='Chawrt' src='https://img.shields.io/badge/" + chawrt_label + "' />" +
                                "<img alt='Chawrt' src='https://img.shields.io/github/stars/liudf0716/chawrt?style=social' />" +
                            "</a>" +
                        "</td>" +
                    "</tr>" +
                "</table>";
    },

    luci_desc: function(description, username, project) {
        var title = _('if you have any problem, please click to view the project on GitHub : ') + project;
        var luci_title = _('if you have any problem, please click to view the luci ui project on GitHub : ')  + project;
        var chawrt_title = _('if you have any problem, please click to view the chawrt firmware project on GitHub : ')  + project;
        var chawrt_label = 'chawrt-openwrt_variant-default';
        var luci_label = 'LuCI-UI_for_'+project.replace(/-/g, '_')+'-default';

        return "<table style='border: 0; table-layout: auto;'>" +
                    "<tr>" +
                        "<td style='border: 0; font-size: 16px; font-weight: 500;'>" + _(description) + "</td>" +
                        "<td style='border: 0;'>" +
                            "<table style='border: 0; table-layout: auto;'>" +
                                "<tr>" +
                                    "<td style='border: 0;'>" +
                                        "<a href='https://github.com/" + username + "/" + project + "' target='_blank' title='" + title + "'>" +
                                            "<img alt='" + project + "' src='https://img.shields.io/github/stars/" + username + "/" + project + "?style=social' />" +
                                        "</a>" +
                                        "<a href='https://github.com/liudf0716/luci' target='_blank' title='" + luci_title + "'>" +
                                            "<img alt='LuCI' src='https://img.shields.io/badge/" + luci_label + "' />" +
                                            "<img alt='LuCI' src='https://img.shields.io/github/stars/liudf0716/luci?style=social' />" +
                                        "</a>" +
                                        "<a href='https://github.com/liudf0716/chawrt' target='_blank' title='" + chawrt_title + "'>" +
                                            "<img alt='Chawrt' src='https://img.shields.io/badge/" + chawrt_label + "' />" +
                                            "<img alt='Chawrt' src='https://img.shields.io/github/stars/liudf0716/chawrt?style=social' />" +
                                        "</a>" +
                                    "</td>" +
                                "</tr>" +
                            "</table>" +
                        "</td>" +
                    "</tr>" +
                "</table>";
    }
});