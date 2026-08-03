// ==UserScript==
// @name         B站隐藏广告拦截提示
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  自动隐藏"检测到您的页面展示可能受到浏览器插件影响"提示
// @author       Seven
// @match        https://*.bilibili.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // 隐藏广告拦截提示
    function hideAdblockTips() {
        const tips = document.querySelector('.adblock-tips');
        if (tips) {
            tips.style.display = 'none';
        }
    }

    // 页面加载后立即隐藏
    hideAdblockTips();

    // 监听DOM变化，防止提示框动态加载
    const observer = new MutationObserver(hideAdblockTips);
    observer.observe(document.body, { childList: true, subtree: true });
})();
