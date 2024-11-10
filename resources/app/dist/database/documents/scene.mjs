import BaseScene from"../../../common/documents/scene.mjs";import ServerDocumentMixin from"../backend/server-document.mjs";import{getProperty,getType,setProperty}from"../../../common/utils/helpers.mjs";export default class Scene extends(ServerDocumentMixin(BaseScene)){static isCached=!0;static _migrationRegistry=[...super._migrationRegistry,{fn:migrateV10Fields,version:12},{fn:migrateLegacyHexFlag,version:12},{fn:migrateRangesInLegacyHex,version:12},{fn:migrateHexGridAlpha,version:12},{fn:migrateOverheadTiles,version:12},{fn:migrateGlobalLightLuminosity,version:"12.325"}];async _preCreate(e,t,r){return this.active&&await this.activate(),super._preCreate(e,t,r)}async _preUpdate(e,t,r){if(!1===await super._preUpdate(e,t,r))return!1;e.active&&await this.activate()}_onDelete(e,t){super._onDelete(e,t),db.Combat._onDeleteScene(this),db.FogExploration.sublevel.findDelete({scene:this.id})}async activate(){logger.info(`Activating scene ${this.name} [${this.id}]`);(await this.constructor.sublevel.findUpdate({active:!0},{active:!1})).forEach((({_id:e})=>{if(e===this.id)return;const t=game.documentCache.get(this.constructor.documentName,e);t&&(t.updateSource({active:!1}),game.documentCache.set(t))}))}static async get(e,t,r){const i=game.documentCache.get(this.documentName,e)??await super.get(e,t,r);return game.documentCache.set(i),i}static async getMany(e,t){const r=[],i=[];for(const t of e){const e=game.documentCache.get(this.documentName,t);e?i.push(e):r.push(t)}return r.length?i.concat(await super.getMany(e,t)):i}static socketListeners(e){e.on("preloadScene",this.#e.bind(e)),e.on("pullToScene",this.#t.bind(e))}static#e(e,t){this.broadcast.emit("preloadScene",e),t(e)}static async#t(e,t){if(!this.user.isGM)return;const r=(await db.User.get(t,{strict:!0})).sockets;r.length&&r.forEach((t=>this.server.to(t.id).emit("pullToScene",e)))}static async migrateSystem(){const{logger:e}=global;e.info("Migrating Scene documents to the latest game system data model");const t=await this.find({},{}),r=this.db.batch();for(const i of t){for(const t of i.tokens){try{await t.loadRelatedDocuments()}catch(t){e.error(t);continue}const i=t.delta?._source.items||[];if(t.actorLink||!i.length)continue;const o=[];for(const t of i)try{if(t._tombstone)return t;const e=db.Item.fromSource(t);e.updateSource({system:e.migrateSystemData()}),o.push(e.toObject())}catch(t){e.error(t)}t.delta._source.items=o,t.batchWrite(r)}i.batchWrite(r,{writeEmbedded:!1})}await r.write(),globalThis.logger.info(`Successfully migrated ${t.length} Scene documents to the latest system data model.`)}}function isHexGrid(e){const{HEXODDR:t,HEXEVENQ:r}=CONST.GRID_TYPES,i=e.grid?.type??e.gridType;return i>=t&&i<=r}function migrateV10Fields(e){let t=!1;"grid"in e&&"Object"!==getType(e.grid)&&(e.grid={size:e.grid},t=!0);const r={gridType:"grid.type",gridColor:"grid.color",gridAlpha:"grid.alpha",gridDistance:"grid.distance",gridUnits:"grid.units",img:"background.src",shiftX:"background.offsetX",shiftY:"background.offsetY"};for(const[i,o]of Object.entries(r)){const r=Scene._addDataFieldMigration(e,i,o);t||=r}return t}function migrateLegacyHexFlag(e){const t=isHexGrid(e),r=getProperty(e,"flags.core.legacyHex");return t&&!0!==r&&!getProperty(e,"_stats.coreVersion")?(setProperty(e,"flags.core.legacyHex",!0),!0):!!(!t&&void 0!==r||t&&!1===r)&&(delete source.flags.core.legacyHex,!0)}function migrateHexGridAlpha(e){if(!isHexGrid(e))return!1;const t=Math.clamp(e.grid?.alpha??.2,0,1),r=Number((t*(2-t)).toFixed(4));return r!==e.grid?.alpha&&(setProperty(e,"grid.alpha",r),!0)}function migrateRangesInLegacyHex(e){if(!(isHexGrid(e)&&getProperty(e,"flags.core.legacyHex")))return!1;const t=2*Math.SQRT1_3;let r=!1;if(Array.isArray(e.lights))for(const i of e.lights)"Object"===getType(i)&&"Object"===getType(i.config)&&(i.config.dim>0&&(i.config.dim*=t,r=!0),i.config.bright>0&&(i.config.bright*=t,r=!0));if(Array.isArray(e.sounds))for(const i of e.sounds)"Object"===getType(i)&&i.radius>0&&(i.radius*=t,r=!0);return r}function migrateOverheadTiles(e){let t=!1;const r=e.grid?.distance??game.system.grid.distance,i=e.foregroundElevation??4*r;if(!Array.isArray(e.tiles))return!1;for(const r of e.tiles)"Object"===getType(r)&&(r.overhead?(r.elevation=i,t=!0):(r.roof&&(r.roof=!1,t=!0),getProperty(r,"occlusion.mode")>CONST.OCCLUSION_MODES.NONE&&(setProperty(r,"occlusion.mode",CONST.OCCLUSION_MODES.NONE),t=!0)));return t}function migrateGlobalLightLuminosity(e){return setProperty(e,"environment.globalLight.luminosity",0),!0}