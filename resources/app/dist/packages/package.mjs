import crypto from"node:crypto";import fs from"node:fs";import path from"node:path";import{PACKAGE_AVAILABILITY_CODES,TIMEOUTS}from"../../common/constants.mjs";import{isNewerVersion,isEmpty,fetchWithTimeout,fetchJsonWithTimeout,mergeObject,deepClone}from"../../common/utils/module.mjs";import{PACKAGE_TYPE_MAPPING}from"./_module.mjs";import*as fields from"../../common/data/fields.mjs";import{cleanHTML,stripTags}from"../database/validators.mjs";import{handleCustomSocket}from"../server/sockets.mjs";import Files from"../files/files.mjs";import PackageInstaller from"./installer.mjs";import FileDownloader from"../files/downloader.mjs";import Collection from"../../common/utils/collection.mjs";import{ReleaseData}from"../../common/config.mjs";class PackageAssetField extends fields.StringField{constructor(e={}){super(e)}static get _defaults(){return mergeObject(super._defaults,{required:!0,blank:!1,mustExist:!0,allowHTTP:!0,relativeToPackage:!0,allowedPublicDir:null})}_cast(e){return this.allowHTTP&&URL.parseSafe(e)?e:Files.standardizePath(e)}initialize(e,t,i={}){if(!t.installed||!e)return e;if(this.allowHTTP&&URL.parseSafe(e))return e;const s=t._source.id,a=global.paths,r=this.relativeToPackage?path.join(t.constructor.collection,s):"",o=[{root:a.data,directory:r}];this.allowedPublicDir&&o.push({root:a.public,directory:this.allowedPublicDir});const n=Files.resolveClientPaths(e,o,{allowHTTP:this.allowHTTP});if(!n.some((({exists:e})=>e))&&this.mustExist)throw new Error(`The file "${e}" included by ${t.constructor.type} ${s} does not exist`);return n.find((({exists:e})=>e))?.clientPath??n[0]?.clientPath}}const ServerPackageMixin=e=>{const t=class extends e{constructor(e={},i={}){super(e,i),this.locked=t.#e(this.path,this.id)}static name="ServerPackageMixin";static defineSchema(){const e=super.defineSchema();e.scripts=new fields.SetField(new PackageAssetField({allowedPublicDir:"scripts"})),e.esmodules=new fields.SetField(new PackageAssetField({allowedPublicDir:"scripts"})),e.styles=new fields.SetField(new PackageAssetField);const t=e.packs.element;t.fields.path=new PackageAssetField({required:!1,allowHTTP:!1,mustExist:!1}),Object.assign(t.fields.path,{name:"path",parent:t});const i=e.languages.element;return i.fields.path=new PackageAssetField,Object.assign(i.fields.path,{name:"path",parent:i}),e}_initializeSource(e,{installed:t=!0}={}){const{logger:i}=global;try{this.constructor.migrateData(e,{installed:t})}catch(e){e.message=`Failed data migration for ${this.name}: ${e.message}`,i.warn(e)}return this.constructor.cleanData(e,{installed:t}),this.constructor.shimData(e)}static manifestMetadataFields=["title","author","authors","url","license","readme","bugs","changelog","manifest","download","compatibility"];installed=this.installed;get path(){return path.join(this.constructor.baseDir,this.id)}static get baseDir(){return path.join(global.paths.data,this.collection)}static get manifestFile(){return`${this.type}.json`}static cleanData(e={},t={}){const i=super.cleanData(e,t);return"string"==typeof i.title&&(i.title=stripTags(i.title)),"string"==typeof i.description&&(i.description=cleanHTML(i.description)),i}_configure({installed:e=!0,...t}={}){this.installed=e,super._configure(t)}_initialize(e={}){super._initialize(e);for(const e of this.packs)e.absPath=path.join(global.paths.data,e.path)}static reevaluateAvailabilities(){this.packages||this.getPackages();for(const e of this.packages.values())e.availability=e.constructor.testAvailability(e)}static#e(e,t){const i=path.join(e,`${t}.lock`);return fs.existsSync(i)}vend(){const e=super.toObject(!1);return e.availability=this.availability,e.locked=this.locked,e.exclusive=this.exclusive,e.owned=this.owned,e.tags=this.tags,e.hasStorage=this.persistentStorage&&Files.getDirectorySizeSync(this.path+"/storage")>0,e}static packages;static get(e,{strict:t=!1}={}){this.packages||this.getPackages();const i=this.packages.get(e);if(!i){if(t)throw new Error(`The requested ${this.type} ${e} does not exist!`);return null}if(i.unavailable&&t)throw new Error(`The requested package ${e} is not available for use! Make sure your core software and game system are fully updated.`);return i}static getPackages({enforceCompatibility:e=!1}={}){if(this.packages)return this.packages;const t=config.files.storages.data.getDirectories(this.baseDir).reduce(((e,t)=>{const i=path.join(t,this.manifestFile);return fs.existsSync(i)&&e.push(i),e}),[]);return this.packages=t.reduce(((t,i)=>{const s=this.fromManifestPath(i);return s?(e&&s.incompatibleWithCoreVersion||t.set(s.id,s),t):t}),new Collection)}static fromManifestPath(e){const i=config.logger;let s;try{const t=this.loadLocalManifest(e);e=t.manifestPath,s=t.manifestData}catch(t){const s=`Error loading ${this.type} "${e}": ${t.message}`;return packages.warnings.add(e,{type:this.type,level:"error",message:s}),i.error(new Error(s)),null}const a=path.basename(path.dirname(e));if(s.id!==a){const e=`Invalid ${this.type} "${s.id}" detected in directory "${a}"`;return packages.warnings.add(s.id,{type:this.type,level:"error",message:e}),i.error(e),null}if(s.protected&&!global.options.debug){const a=path.join(path.dirname(e),"signature.json");try{t.#t(a,s.version)}catch(e){const t=`Invalid signature file for protected ${this.type} "${s.id}"`;return packages.warnings.add(s.id,{type:this.type,level:"error",message:t}),i.error(t),null}}let r=null;try{r=new this(s,{strict:!0,fallback:!0,installed:!0});const e=r.validationFailures.fields;e&&packages.warnings.add(r.id,{type:this.type,level:"warning",message:e.toString()});const t=r.schema.unknownKeys.filter((e=>!r.constructor.migratedKeys.has(e)));t.length&&packages.warnings.add(r.id,{type:this.type,level:"warning",message:`The "${r.title}" ${this.type}'s manifest contained the following unknown keys: `+t.map((e=>`"${e}"`)).join(", ")})}catch(e){e.message=`Metadata validation failed for ${this.type} "${s.id}": ${e.message}`,packages.warnings.add(s.id,{type:this.type,level:"error",message:e.message}),i.error(e)}if(packages.warnings.has(s.id)){const e=packages.warnings.get(s.id);e.reinstallable=s.protected||!!URL.parseSafe(s.manifest),e.manifest=s.manifest}return r}static loadLocalManifest(e){const t=JSON.parse(fs.readFileSync(e,"utf-8"));return t.id||(t.id=t.name),delete t.availability,{manifestPath:e,manifestData:t}}static async fromRemoteManifest(e,{strict:t=!0}={}){const i={404:`No ${this.type} manifest found at ${e}`,401:`Access to ${this.type} manifest at ${e} is unauthorized`,403:`Access to ${this.type} manifest at ${e} is forbidden`,500:`The server at ${e} failed to respond with ${this.type} manifest data`};let s,a;const r={timeoutMs:TIMEOUTS.PACKAGE_REPOSITORY};try{a=await fetchWithTimeout(e,{referrerPolicy:"no-referrer"},r)}catch(e){const t=i[e.code];throw t&&(e.message=t),e}try{s=await a.json()}catch(t){throw new Error(`Error parsing ${this.type} manifest data from ${e}: ${t.message}`)}return new this(s,{installed:!1,strict:t})}static async fromRepository(e){const{packages:t}=await this.getRepositoryPackages();return t.get(e)||null}static fromRepositoryData(e,t){return new this(this._convertRepositoryDataToPackageData(e,t),{installed:!1})}static _convertRepositoryDataToPackageData(e,t){return{id:e.name,title:e.title,version:e.version.version,description:e.description,changelog:e.version.notes,authors:[{name:e.author}],url:e.url,manifest:e.version.manifest,protected:e.is_protected,compatibility:{minimum:e.version.required_core_version,verified:e.version.compatible_core_version,maximum:e.version.maximum_core_version},relationships:{systems:e.requires.map((e=>({id:e,type:"system"})))},tags:e.tags??[],exclusive:e.is_exclusive,owned:e.is_protected&&t.includes(e.id)}}static async install(e,i,s,a,{onError:r,onProgress:o,onFetched:n}={}){const c=await t.#i(e,s,{onError:r,onProgress:o,onFetched:n}),l=await t.#s(e,c,a,{onError:r,onProgress:o});globalThis.packages.warnings.delete(e),this._addInstalledPackageToCache(e,l);const d=this.get(l.id);return await t.#a(d,i),d}static async#a(e,t){const i=PACKAGE_TYPE_MAPPING[e.type],s=await i.fromRepository(e.id);const a=await async function(){return s||e.availability===PACKAGE_AVAILABILITY_CODES.VERIFIED||e.manifest===t?null:(await i.check(e.manifest,e)).remote}(),r=e.sidegrade(a,s);foundry.utils.isEmpty(r)||(e.availability=e.constructor.testAvailability(e))}static async#i(e,t,{onError:i,onProgress:s,onFetched:a}={}){const r=CONST.SETUP_PACKAGE_PROGRESS.STEPS,o=path.join(this.baseDir,`${e}.zip`),n=new FileDownloader(t,o);return i&&n.on("error",(e=>i(r.DOWNLOAD,e))),s&&n.on("progress",((e,t)=>s(r.DOWNLOAD,e,t))),a&&n.on("fetched",a),await n.download(),o}static async#s(e,t,i,{onError:s,onProgress:a}={}){const r=new PackageInstaller(this.type,this.baseDir,e,t,i);s&&r.on("error",(e=>s(CONST.SETUP_PACKAGE_PROGRESS.STEPS.INSTALL,e))),a&&r.on("progress",a);const o=await r.install();return globalThis.logger.info(`Installed ${this.type} ${e}`),o}static _addInstalledPackageToCache(e,t){if(!this.packages)return;const i=this.get(e);if(i)i.updateSource(t),i.availability=i.constructor.testAvailability(i);else{const t=path.join(this.baseDir,e,this.manifestFile),i=this.fromManifestPath(t);i&&this.packages.set(e,i)}for(const e of Object.values(PACKAGE_TYPE_MAPPING))e.reevaluateAvailabilities()}static async check(e,t,{strict:i=!0}={}){let s,a={remote:null,isUpgrade:!1,isDowngrade:!1,availability:PACKAGE_AVAILABILITY_CODES.UNKNOWN};try{s=await this.fromRemoteManifest(e,{strict:i}),a.remote=s}catch(e){return globalThis.logger.warn(e.message),a.error=e.message,e.code&&(a.errorCode=e.code),a}return a.isUpgrade=!t||isNewerVersion(s.version,t.version),a.isDowngrade=!!t&&isNewerVersion(t.version,s.version),a.availability=s.availability,a}suggestTrackChange(e){return e&&e.manifest&&e.version?e.manifest===this.manifest?null:isNewerVersion(e.version,this.version)?{manifest:e.manifest,version:e.version}:null:null}sidegrade(e,t){let i={};const s=(e,t,i)=>{const s=(e,t,i,s)=>{e[t]||(e[t]=deepClone(i)),isNewerVersion(i.minimum,s.minimum)&&(e[t].minimum=s.minimum),isNewerVersion(s.verified,i.verified)&&(e[t].verified=s.verified),isNewerVersion(s.maximum,i.maximum)&&(e[t].maximum=s.maximum)};for(const a of t){const t=e[a],r=this._source[a];switch(a){case"authors":t.map((e=>e.name)).equals(r.map((e=>e.name)))||(i[a]=t);break;case"minimumCoreVersion":isNewerVersion(r,t)&&(i[a]=t);break;case"compatibleCoreVersion":isNewerVersion(t,r)&&(i[a]=t);break;case"compatibility":case"systemCompatibility":s(i,a,r,t);break;default:r!==t&&(i[a]=t)}}};if(e&&s(e.toObject(),this.constructor.manifestMetadataFields,i),t){const e=["compatibility"];s(t.toObject(),e,i)}const a=this.updateSource(i);return isEmpty(a)?null:(this.installed&&this.save(),this.availability=this.constructor.testAvailability(this),globalThis.logger.info(`Applied sidegrade metadata updates to ${this.type} ${this.id}`),a)}static async uninstall(e){const t=this.get(e),i=path.join(this.baseDir,e);if(!fs.existsSync(i))throw new Error(`The package ${e} does not exist to uninstall!`);await fs.promises.rm(i,{force:!0,recursive:!0}),this.packages&&this.packages.delete(e),globalThis.logger.info(`Uninstalled ${this.type} ${e}`),globalThis.packages.warnings.delete(e);for(const e of Object.values(PACKAGE_TYPE_MAPPING))e.reevaluateAvailabilities();return t?.toObject()??{id:e}}static resetPackages(){this.packages=null}async lock(e){const t=path.join(this.path,`${this.id}.lock`);fs.existsSync(t)?(e||fs.unlinkSync(t),globalThis.logger.info(`Unlocked ${this.type} ${this.id}`)):(e&&fs.writeFileSync(t,"🔒"),globalThis.logger.info(`Locked ${this.type} ${this.id}`)),this.locked=e}save(e={}){const t=foundry.utils.mergeObject(this.toObject(),e),i=this.constructor.cleanData(),s=foundry.utils.diffObject(i,t),a=path.join(this.path,this.constructor.manifestFile);return Files.writeFileSyncSafe(a,JSON.stringify(s,null,2)),this}registerCustomSocket(e){if(!this.socket)return;const t=`${this.constructor.type}.${this.id}`;e.on(t,handleCustomSocket.bind(e,t))}static#r="https://foundryvtt.com/_api/packages/get";static#o="https://foundryvtt.com/_api/packages/auth";static#n=3e5;static#c={packages:new Map,owned:[],lastUpdated:0,request:void 0};static async getRepositoryPackages({release:e}={}){const i=!(e instanceof ReleaseData);i&&(e=config.release);const s=i?t.#c:{packages:new Map,owned:[],lastUpdated:0,request:void 0};if(s.request)return await s.request,s;const a=Date.now()-s.lastUpdated>=t.#n;return i&&!a||(s.packages.clear(),s.owned=[],s.request=new Promise((async i=>{let a,r;try{a=await fetchJsonWithTimeout(t.#r,{headers:{"Content-Type":"application/json",Authorization:config.license.authorizationHeader},method:"POST",body:JSON.stringify({type:this.type,version:e.version,license:config.license.data})},{timeoutMs:TIMEOUTS.FOUNDRY_WEBSITE}),(a.error||"error"===a.status)&&(r=a.error.message)}catch(e){r=`Could not get Repository Packages - ${e}`}if(r)return logger.error(r),s.packages=new Map,s.owned=[],i();const{packages:o,owned:n}=a;for(const e of o){let t;try{t=this.fromRepositoryData(e,n)}catch(t){logger.warn(`Received invalid Package data from website repository for package id "${e.name}"`)}t&&(s.packages.set(t.id,t),t.owned&&s.owned.push(t.id))}return s.lastUpdated=Date.now(),i()})),await s.request,s.request=void 0),s}static async getProtectedDownloadURL({type:e,id:i,version:s}={}){return await fetchJsonWithTimeout(t.#o,{headers:{"Content-Type":"application/json",Authorization:config.license.authorizationHeader},method:"POST",body:JSON.stringify({type:e,name:i,version:s,license:config.license.data})})}static#t(e,t){const i=global.config.license;let s=JSON.parse(fs.readFileSync(e,"utf-8"));const a="package"in s?{license:i.data.license,key:s.key,package:s.package,version:t}:{license:i.data.license,key:s.key,version:t},r=crypto.createVerify("SHA256");r.write(JSON.stringify(a));const o=crypto.createPublicKey(i.constructor.PUBLIC_KEY);if(!r.verify(o,s.signature,"base64"))throw new Error("Invalid signature")}};return t};export default ServerPackageMixin;export{PackageAssetField,ServerPackageMixin};