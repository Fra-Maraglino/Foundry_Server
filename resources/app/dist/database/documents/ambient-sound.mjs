import BaseAmbientSound from"../../../common/documents/ambient-sound.mjs";import ServerDocumentMixin from"../backend/server-document.mjs";export default class AmbientSound extends(ServerDocumentMixin(BaseAmbientSound)){static _migrationRegistry=[...super._migrationRegistry,{fn:migrateWallAttributes,version:12}]}function migrateWallAttributes(e){return"t"in e&&("walls"in e||(e.walls="l"===e.t),delete e.t,!0)}