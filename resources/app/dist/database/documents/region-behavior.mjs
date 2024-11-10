import BaseRegionBehavior from"../../../common/documents/region-behavior.mjs";import{setProperty}from"../../../common/utils/helpers.mjs";import ServerDocumentMixin from"../backend/server-document.mjs";export default class RegionBehavior extends(ServerDocumentMixin(BaseRegionBehavior)){static _migrationRegistry=[...super._migrationRegistry,{fn:migrateExecuteMacroEveryone,version:"12.326"}]}function migrateExecuteMacroEveryone(e){return"executeMacro"===e.type&&(setProperty(e,"system.everyone",!0),!0)}