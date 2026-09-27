/*!
 * THYUU 区块 —— 媒体加载状态处理
 *
 * 移植自 Halo 插件 plugin-thyuu-embed（作者：困困鱼 & THYUU，GPL-3.0）
 * 原版这段代码是 Java 的 EmbedHeadProcessor 内联注入到 <head> 的，
 * 这里抽成独立文件，逻辑保持逐行一致，仅额外套了一层 IIFE 避免污染全局。
 *
 * 作用：thyuu-embed.iife.js 会把 <thyuu-video> / <thyuu-music> 替换成带 iframe 的
 * <thyuu-embed>，而 thyuu-embed.css 里有
 *     thyuu-embed:not(.loaded) iframe { opacity: 0; visibility: hidden }
 * 也就是说——没有本文件给 <thyuu-embed> 加上 .loaded 类，iframe 将永远不可见。
 * 本文件同时负责"媒体加载中 / 加载失败点击重试"的提示气泡。
 */

(function () {
  'use strict';

  // 加载提示
  function THYUUloader(parent, loadingText, errorText) {
    loadingText = loadingText === undefined ? '加载中' : loadingText;
    errorText = errorText === undefined ? '加载失败，点击重试' : errorText;

    const loader = document.createElement('thyuu-loaed');
    loader.textContent = loadingText;
    parent.appendChild(loader);
    return {
      complete: () => {
        loader.classList.add('loaded');
        setTimeout(() => {
          loader.remove();
        }, 1000);
      },
      error: (retryCallback) => {
        loader.textContent = errorText;
        loader.classList.add('error');
        loader.style.cursor = 'pointer';
        loader.addEventListener('click', () => {
          loader.textContent = loadingText;
          loader.classList.remove('error');
          if (typeof retryCallback === 'function') {
            retryCallback();
          }
        }, { once: true });
      }
    };
  }

  // 嵌入懒加载动画
  function THYUUEmbedLoad(parentSelector, childSelector, loadedClass) {
    document.querySelectorAll(parentSelector).forEach(parent => {
      const child = parent.querySelector(childSelector);
      if (!child) return;
      const loader = THYUUloader(parent, '媒体加载中', '媒体加载失败，点击重试');
      const loadHandler = () => {
        parent.classList.add(loadedClass);
        loader.complete();
        child.removeEventListener('load', loadHandler);
        child.removeEventListener('error', errorHandler);
      };
      const errorHandler = () => {
        loader.error(() => {
          child.addEventListener('load', loadHandler);
          child.addEventListener('error', errorHandler);
          if (child.tagName === 'IMG' || child.tagName === 'IFRAME') {
            child.src += '';
          }
        });
      };
      if (child.complete && child.tagName === 'IMG') {
        loadHandler();
        return;
      }
      child.addEventListener('load', loadHandler);
      child.addEventListener('error', errorHandler);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    THYUUEmbedLoad('thyuu-embed', 'iframe', 'loaded');
  }, {
    once: true
  });

  // bitcron-pro 当前没有 pjax，此监听不会触发；保留以对齐上游，将来若启用 pjax 也能照常工作。
  document.addEventListener('pjax:success', () => {
    THYUUEmbedLoad('thyuu-embed', 'iframe', 'loaded');
  });

})();
