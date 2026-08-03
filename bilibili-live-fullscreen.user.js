// ==UserScript==
// @name         B站直播 F/G 键全屏
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  F键浏览器全屏，G键网页全屏
// @author       Seven
// @match        https://live.bilibili.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    document.addEventListener('keydown', function(e) {
        if (e.isComposing) return;

        const tag = e.target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;

        const livePlayer = window.top?.livePlayer;
        if (!livePlayer) return;

        // F键 - 浏览器全屏
        if (e.code === 'KeyF') {
            e.preventDefault();
            const nextStatus = document.fullscreenElement ? 0 : 2;
            livePlayer.setFullscreenStatus(nextStatus);
        }
        // G键 - 网页全屏
        else if (e.code === 'KeyG') {
            e.preventDefault();
            const isWebFullscreen = document.body?.classList.contains('player-full-win');
            const nextStatus = isWebFullscreen ? 0 : 1;
            livePlayer.setFullscreenStatus(nextStatus);
        }
    });
})();
