import fs from"node:fs";import path from"node:path";import{BaseSystem}from"../../common/packages/module.mjs";import{ALL_DOCUMENT_TYPES,PACKAGE_AVAILABILITY_CODES}from"../../common/constants.mjs";import{isNewerVersion}from"../../common/utils/helpers.mjs";import ServerPackageMixin,{PackageAssetField}from"./package.mjs";export default class System extends(ServerPackageMixin(BaseSystem)){static defineSchema(){const e=super.defineSchema();return e.background=new PackageAssetField({relativeToPackage:!1,mustExist:!1,...e.background.options}),e}#e;#t=0;get template(){return this._template}_template;_initialize(e){super._initialize(e),this._initializeTemplateDocumentTypes()}_initializeTemplateDocumentTypes(){if(this.loadDataTemplate(),!this.installed||!this._template)return;const e=["htmlFields","filePathFields","gmOnlyFields"];for(const[t,s]of Object.entries(this._template))for(const a of s.types||[]){const i=this.documentTypes[t]||={};i[a]={};for(const t of e)t in s&&(i[a][t]=s[t])}}validate(e){return this.installed&&this.loadDataTemplate(this._source.id),super.validate(e)}updateSource(e={},t={}){return this._template=void 0,super.updateSource(e,t)}vend(){const e=super.vend();return e.strictDataCleaning=this._template?.strictDataCleaning,e}loadDataTemplate(e=this.id){return this._template||(this._template=System.#s(e)),this._template}static#s(e){const t=path.join(this.baseDir,e,"template.json");if(!fs.existsSync(t))return null;let s;try{s=JSON.parse(fs.readFileSync(t,"utf-8"))}catch(t){throw new Error(`Unable to parse system template for ${e}: ${t.message}`)}for(const t of ALL_DOCUMENT_TYPES){const a=s[t];if(!a)continue;const i=getDocumentClass(t);a.types=(a.types||[]).filter((a=>{try{return System.#a(e,i,a),a}catch(i){packages.warnings.add(e,{type:this.type,level:"warning",message:i.message}),console.warn(i.message),delete s[t][a]}}))}return s}static#a(e,t,s){const a=t.documentName;if(t.metadata.coreTypes.includes(s))throw new Error(`System "${e}" defines ${a} document sub-type "${s}" which is a reserved core type.`);if(s.includes("."))throw new Error(`System "${e}" defines ${a} document sub-type "${s}" which may not contain periods.`)}async getUpdateNotification(){const e=Date.now();if(!this.#e||e-this.#t>864e5){const e=await this.constructor.check(this.manifest,this);e.isUpgrade?globalThis.logger.info(`${this.title} update ${e.remote.version} is now available!`):globalThis.logger.info(`No system update for ${this.title} is currently available.`),this.#e={hasUpdate:e.isUpgrade,version:e.remote?.version||null}}return this.#e}async checkUpdateAvailable(){const e=await System.fromRemoteManifest(this.manifest);return isNewerVersion(e.version,this.version)&&e.availability<=PACKAGE_AVAILABILITY_CODES.UNVERIFIED_GENERATION?e.version:null}static async install(e,t,s,a,i){const n=await super.install(e,t,s,a,i);return packages.World.resetPackages(),n}static async uninstall(e){const t=await super.uninstall(e);return packages.World.resetPackages(),t}}