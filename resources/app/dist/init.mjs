import fs from"node:fs";import path from"node:path";import crypto from"node:crypto";import*as packages from"./packages/_module.mjs";globalThis.packages=packages;import lockfile from"proper-lockfile";import{createLogger,Logger,LogEntry}from"./logging.mjs";import configurePaths from"./paths.mjs";import ServerConfiguration from"./core/config.mjs";import License from"./core/license.mjs";import Updater from"./core/update.mjs";import*as database from"./database/database.mjs";import Files from"./files/files.mjs";import GameServer from"./core/game.mjs";import{World}from"./packages/_module.mjs";import Express from"./server/express.mjs";import UPnP from"./server/upnp.mjs";import{vtt}from"../common/constants.mjs";import{resetDemo}from"./components/demo.mjs";import{ReleaseData}from"../common/config.mjs";import{fromUuid}from"./core/utils.mjs";globalThis.crypto??=crypto,globalThis.crypto.getRandomValues??=crypto.webcrypto.getRandomValues.bind(crypto.webcrypto);export default async function initialize({args:e=[],root:o,messages:t=[],debug:s=!1}={}){global.vtt="FoundryVTT",global.release=new ReleaseData(JSON.parse(fs.readFileSync(`${o}/package.json`,"utf8")).release),global.config={},global.startupMessages=t,global.fatalError=null,global.fromUuid=fromUuid;try{global.paths=configurePaths({root:o,messages:t,debug:s})}catch(e){process.stdout.write(e.stack),process.exit(1)}const r=global.paths,a=_parseArgs(e),n=global.logger=createLogger(r,t,a);n.info(`Foundry Virtual Tabletop - Version ${global.release.generation} Build ${global.release.build}`),n.info(`User Data Directory - "${global.paths.user}"`),"adminKey"in a&&global.logger.warn("You are using the old --adminKey parameter which has been renamed to --adminPassword"),global.game=new GameServer;let i={};try{i=global.config=await _initializeCriticalFunctions(a,r,n)}catch(e){e.message=`A fatal error occurred while trying to start the Foundry Virtual Tabletop server: ${e.message}`,(n||console).error(e),await new Promise((()=>setTimeout((()=>process.exit(1)),100)))}i.updater=new Updater(r);const{app:l,express:c,license:p,options:u,upnp:d}=i;global.db=i.db,global.getDocumentClass=db.getDocumentClass,global.express=i.express,global.options=i.options,p.needsSignature||await _launchDefaultWorld(u);try{await c.listen()}catch(e){e.message=`Unable to start Express server: ${e.message}`,(n||console).error(e),await new Promise((()=>setTimeout((()=>process.exit(1)),100)))}return process.on("uncaughtException",(e=>n.error(e))),handleRestart(n),process.once("exit",(()=>handleShutdown({exit:!1,logger:n,express:c,upnp:d}))),process.once("SIGINT",process.exit.bind(null,0)),process.once("SIGTERM",process.exit.bind(null,0)),process.once("SIGHUP",process.exit.bind(null,0)),l&&l.initialize(c.address),i}async function _initializeCriticalFunctions(e,o,t){_testPermissions(),_createUserDataStructure(),await _acquireLockFile(),await _clearUnnecessaryFiles();const s=ServerConfiguration.load();s.initialize(e);const r=new License(s.service);r.verify();const a=new Files(s);if(a.availableStorageNames.includes("s3"))try{await a.storages.s3.identifyEndpoint()}catch(e){t.error(`Failed to determine S3 endpoint: ${e.message}`),delete a.storages.s3}const n=s.upnp?new UPnP({port:s.port,ttl:s.upnpLeaseDuration}).createMapping():null;let i=null;if(s.isElectron){i=new((await import("./interface/electron.js")).default)(s,t)}const l=new Express(s,o,t);return await Promise.all([]),{adminPassword:s.adminPassword,app:i,db:database,express:l,files:a,license:r,logger:t,options:s,service:s.service,sockets:l.io.sockets.sockets,upnp:n,release:release,vtt:vtt}}function _testPermissions(){const e=global.paths;try{const o=fs.existsSync(e.user)?e.user:path.dirname(e.user);let t=path.join(o,".permission-test.txt");fs.writeFileSync(t,"test"),fs.unlinkSync(t)}catch(o){throw o.message=`You do not have permission to create content in ${e.user}: ${o.message}`,o}}function _createUserDataStructure(){const e=global.paths,o=["user","data","config","logs"];for(let t of o)fs.mkdirSync(e[t],{recursive:!0});if(!fs.existsSync(e.options)){const o={dataPath:e.user},t=fs.existsSync(e.envOptions)?JSON.parse(fs.readFileSync(e.envOptions)):{},s=["compressStatic","fullscreen","hostname","language","localHostname","port","protocol","proxyPort","proxySSL","routePrefix","updateChannel","upnp","upnpLeaseDuration"];for(const e of s)o[e]=t[e];new ServerConfiguration(o).save()}const t=["systems","modules","worlds"],s={systems:"This directory contains systems which define game frameworks for use in Foundry VTT. Each system has its own uniquely named subdirectory containing a system.json manifest file.",modules:"This directory contains add-on modules which add or extend core VTT functionality. Each module has its own uniquely named subdirectory containing a module.json manifest file.",worlds:"This directory contains worlds which define the game and campaign settings in Foundry VTT. Each world has its own uniquely named subdirectory containing a world.json manifest file."};for(let o of t){let t=path.join(e.data,o);fs.mkdirSync(t,{recursive:!0}),fs.writeFileSync(path.join(t,"README.txt"),s[o])}}async function _acquireLockFile(){const e=global.paths;if(await lockfile.check(e.options))throw new Error(`${vtt} cannot start in this directory which is already locked by another process.`);return lockfile.lock(e.options,{stale:1e4})}async function _clearUnnecessaryFiles(){const e=global.paths,o=path.join(e.root,"certs");try{await fs.promises.rm(o,{force:!0,recursive:!0})}catch(e){}}function _parseArgs(e){const o={},t=/^--/;for(let s of e){if(!t.test(s))continue;s=s.replace(t,"");const e=s.split("=");o[e[0]]=!(e.length>1)||e[1]}return"adminKey"in o&&(o.adminPassword=o.adminKey),o}async function _launchDefaultWorld(e){if(e.demoMode)try{return resetDemo()}catch(o){logger.warn(o),e.demo=null}if(e.world){const o=World.get(e.world,{strict:!1});if(!o?.canAutoLaunch)return logger.warn(`The requested World "${e.world}" is not available to auto-launch.`),void(e.world=null);try{await o.setup()}catch(t){logger.error(`The requested World "${e.world}" could not be auto-launched as it encountered an error.`),logger.error(t),e.world=null,await o.deactivate(null,{asAdmin:!0})}}}function handleRestart(e){process.env.restart&&(e.info("Server restarted after update"),delete process.env.restart)}function handleShutdown({exit:e=!0,logger:o,upnp:t,express:s}={}){o.info("Shutting down Foundry Virtual Tabletop server"),t&&t.removeMapping(),s&&s.server.close(),o.info("Shut-down success. Goodbye!"),e&&process.exit()}