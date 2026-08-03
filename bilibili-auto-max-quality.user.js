// ==UserScript==
// @name         B站直播自动最高清晰度
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  自动将B站直播切换到最高可用清晰度
// @author       Seven
// @match        https://live.bilibili.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    if (!/^\/\d+/.test(location.pathname)) return;

    const TARGET_QN = 10000;
    const LOG = '[B站直播画质]';

    // 拦截 __NEPTUNE_IS_MY_WAIFU__，注入高画质描述信息
    let neptuneData;
    Object.defineProperty(window, '__NEPTUNE_IS_MY_WAIFU__', {
        get() { return neptuneData; },
        set(val) {
            if (val?.roomInitRes?.data?.playurl_info?.playurl) {
                const playurl = val.roomInitRes.data.playurl_info.playurl;
                if (playurl.g_qn_desc) {
                    if (!playurl.g_qn_desc.some(d => d.qn === TARGET_QN)) {
                        playurl.g_qn_desc.unshift({qn: TARGET_QN, desc: '原画', hdr_desc: ''});
                    }
                } else {
                    playurl.g_qn_desc = [{qn: TARGET_QN, desc: '原画', hdr_desc: ''}];
                }
                if (playurl.stream) {
                    playurl.stream.forEach(s => s.format?.forEach(f => f.codec?.forEach(c => {
                        if (c.accept_qn && !c.accept_qn.includes(TARGET_QN)) {
                            c.accept_qn.unshift(TARGET_QN);
                        }
                    })));
                }
            }
            neptuneData = val;
        },
        configurable: true,
        enumerable: true
    });

    // 拦截 fetch，play-gateway 请求强制 qn=10000
    const originalFetch = window.fetch;
    window.fetch = function(input, init) {
        let url = typeof input === 'string' ? input : (input instanceof Request ? input.url : String(input));
        if (url.includes('play-gateway') && url.includes('/url')) {
            let newUrl = /[?&]qn=\d+/.test(url)
                ? url.replace(/([?&])qn=\d+/, `$1qn=${TARGET_QN}`)
                : url + (url.includes('?') ? '&' : '?') + `qn=${TARGET_QN}`;
            input = input instanceof Request ? new Request(newUrl, input) : newUrl;
        }
        return originalFetch.call(this, input, init);
    };

    // 拦截 XHR，play-gateway 请求强制 qn=10000
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
        if (typeof url === 'string' && url.includes('play-gateway') && url.includes('/url')) {
            url = /[?&]qn=\d+/.test(url)
                ? url.replace(/([?&])qn=\d+/, `$1qn=${TARGET_QN}`)
                : url + (url.includes('?') ? '&' : '?') + `qn=${TARGET_QN}`;
        }
        return originalOpen.call(this, method, url, ...rest);
    };

    // 等待 play-gateway 响应后切换画质
    let switched = false;
    const wrappedFetch = window.fetch;
    window.fetch = function(input, init) {
        const result = wrappedFetch.call(this, input, init);
        const url = typeof input === 'string' ? input : (input instanceof Request ? input.url : String(input));
        if (url.includes('play-gateway') && url.includes('/url')) {
            result.then(() => setTimeout(doSwitch, 500)).catch(() => {});
        }
        return result;
    };

    function doSwitch() {
        if (switched) return;
        const player = window.livePlayer;
        if (!player?.getPlayerInfo) return;

        const info = player.getPlayerInfo();
        if (!info) return;

        const currentQn = Number(info.quality);
        if (currentQn >= TARGET_QN) {
            switched = true;
            return;
        }

        const candidates = info.qualityCandidates || [];
        const best = candidates
            .filter(c => Number(c.qn) > 0)
            .sort((a, b) => Number(b.qn) - Number(a.qn))[0];

        const qn = best ? best.qn : String(TARGET_QN);
        console.log(LOG, '切换画质:', qn);
        player.switchQuality(qn);
        switched = true;

        setTimeout(() => {
            const newInfo = player.getPlayerInfo();
            if (newInfo) console.log(LOG, '当前画质:', newInfo.quality);
        }, 2000);
    }

    // 备用定时器
    let attempts = 0;
    const timer = setInterval(() => {
        if (switched || ++attempts > 10) { clearInterval(timer); return; }
        if (attempts >= 3) doSwitch();
    }, 2000);
})();
