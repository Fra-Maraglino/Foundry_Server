export default class Activity{constructor(t){this.#t=t,this.#e=setInterval((()=>this.heartbeat(this)),15e3),this.#i()}#t;#e;users={};worldTime;#s;#i(){this.#s=Date.now(),db.Setting.getValue("core.time").then((t=>{if(this.worldTime=Number.isNumeric(t)?Number(t):0,void 0===t)return db.Setting.set("core.time",0)}))}get serverTime(){return Date.now()-this.#s}heartbeat(){if(game.world===this.#t){if(game.users)for(let t of game.users)t.id in this.users&&0===t.sockets.length&&this.deactivateUser(t)}else clearInterval(this.#e)}activateUser(t){const{express:e,game:i,db:s}=global;return"string"==typeof t&&(t=i.users.find((e=>e.id===t))),t instanceof s.User&&(!(t.id in this.users)&&(this.users[t.id]={},e.io.emit("userActivity",t.id,{active:!0}),!0))}deactivateUser(t){const{express:e,db:i}=global;if(!(t instanceof i.User))throw new Error("You must provide a User document instance to the deactivateUser method");return!t.sockets.length&&(t.id in this.users&&(delete this.users[t.id],e.io.emit("userActivity",t.id,{active:!1})),!0)}static socketListeners(t){this._onActivate(t,!0),t.on("disconnect",(()=>this._onActivate(t,!1))),t.on("userActivity",((e,i)=>Activity.#a(t,e,i))),t.on("getUserActivity",(()=>Activity.#r(t))),t.on("pause",(e=>this.pause(t,e))),t.on("time",this._onGameTime),t.on("reload",(()=>{t.user.can("SETTINGS_MODIFY")&&t.broadcast.emit("reload")}))}static _onActivate(t,e){const{game:i}=global;i.ready&&i.activity&&t.user&&(e?i.activity.activateUser(t.user):i.activity.deactivateUser(t.user))}static async _onGameTime(t){const{game:e}=global;return e.ready&&e.activity?t({serverTime:e.activity.serverTime,worldTime:e.activity.worldTime}):t({})}static pause(t,e){game.ready&&(global.logger.info(`Toggling game pause status to ${e}`),game.paused=e,t.broadcast.emit("pause",e))}static#a(t,e,i={}){if(!game.ready||!game.activity)return;const s=game.activity.users;e in s||(s[e]={});const a=s[e];for(const t of["sceneId","cursor","ruler","targets","av"])t in i&&(a[t]=i[t]);t.broadcast.emit("userActivity",e,i)}static#r(t){if(game.ready&&game.activity)for(const[e,i]of Object.entries(game.activity.users))t.emit("userActivity",e,i)}}