import Express from"../express.mjs";import{Module}from"../../packages/_module.mjs";export default class View{route;socket=!1;_template;_methods=[];get hasGet(){return this._methods.includes("get")}get hasPost(){return this._methods.includes("post")}async handleGet(e,s){}async handlePost(e,s){}async handleSocket(e,s){}_noWorld(e,s){return View.error(e,s,{pageTitle:"No Active Game",message:"There is currently no active game session. Please wait for the host to configure the world and then refresh this page."})}static error(e,s,...t){const r=t.pop()||global.fatalError,o=this._getStaticContent({setup:!0});s.render("error",{layout:"setup",bodyClass:["auth","error","flexcol",`theme-${config.options.cssTheme}`].join(" "),pageTitle:r.title||"Critical Failure!",message:r.message||"Something went wrong with the Foundry Virtual Tabletop server.",setupUrl:foundry.utils.getRoute("setup",{prefix:express.routePrefix}),stack:r.stack||null,styles:o.styles})}static home(e,s){const{config:t,game:r}=global;return t.license.needsSignature?s.redirect(`${e.baseUrl}/license`):r.world?e.user?s.redirect(`${e.baseUrl}/game`):s.redirect(`${e.baseUrl}/join`):s.redirect(`${e.baseUrl}/setup`)}static _getStaticContent({world:e=!1,setup:s=!1,moduleConfig:t={}}){const r=[];let o=[];const i=new Set,c=(e,s,t)=>{const c="style"===s?o:r;i.has(e)||c.push({src:e,type:s,priority:t,isModule:"module"===s})},l=0,a=1,n=2,p=3,u=4,d=5,h=6,m=7,f=8,y=9,g=10,E=0,_=1,S=2,w=3,b=4;if(Express.CORE_VIEW_SCRIPTS.forEach((e=>c(e,"script",l))),e&&c("scripts/simplepeer.min.js","script",l),Express.CORE_VIEW_MODULES.forEach((e=>c(e,"module",a))),Express.CORE_VIEW_STYLES.forEach((e=>c(e,"style",_))),e){const e=global.game.world;e.system.esmodules.forEach((e=>c(e,"module",h))),e.system.scripts.forEach((e=>c(e,"script",d))),e.system.styles.forEach((e=>c(e,"style",S)));for(let s of e.modules){if(!0!==t[s.id])continue;const e=s.library??!1;s.esmodules.forEach((s=>c(s,"module",e?u:f))),s.scripts.forEach((s=>c(s,"script",e?p:m))),s.styles.forEach((s=>c(s,"style",e?E:w)))}e.esmodules.forEach((e=>c(e,"module",g))),e.scripts.forEach((e=>c(e,"script",y))),e.styles.forEach((e=>c(e,"style",b)))}if(c("scripts/foundry-esm.js","script",n),c("scripts/foundry.js","script",n),s){o.find((e=>"css/style.css"===e.src)).src="css/foundry2.css",c("scripts/setup.js","script",n);Module.getCoreTranslationStyles().forEach((e=>c(e,"style",w)))}const x=(e,s)=>e.priority-s.priority;return r.sort(x),o.sort(x),{scripts:r,styles:o}}}