import fs from"node:fs";import path from"node:path";import DocumentCache from"../components/document-cache.mjs";export default class GameServer{constructor(){this.#e()}active=!1;activity;documentCache=new DocumentCache;documentTypes;featuredContent;model;news;release=globalThis.release;paused=!1;permissions;ready=!1;system=null;modules=null;users=[];world=null;get packs(){return globalThis.db.packs}static get newsPath(){return path.join(paths.logs,"news.json")}saveNews(e,t){if(!e)return logger.warn("No news or featured content received from software update check response.");Object.defineProperties(this,{news:{value:e,configurable:!0,enumerable:!1},featuredContent:{value:t,configurable:!0,enumerable:!1}}),fs.writeFileSync(GameServer.newsPath,JSON.stringify({news:e,featuredContent:t},null,2))}#e(){let e;if(fs.existsSync(GameServer.newsPath)){try{e=JSON.parse(fs.readFileSync(GameServer.newsPath,"utf-8"))}catch(e){return void console.error(e)}Object.defineProperties(this,{news:{value:e.news,configurable:!0,enumerable:!1},featuredContent:{value:e.featuredContent,configurable:!0,enumerable:!1}})}}}