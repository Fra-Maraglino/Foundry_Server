import BaseCard from"../../../common/documents/card.mjs";import ServerDocumentMixin from"../backend/server-document.mjs";export default class Card extends(ServerDocumentMixin(BaseCard)){static _migrationRegistry=[...super._migrationRegistry,{fn:migrateV10Fields,version:12}]}function migrateV10Fields(e){return Card._addDataFieldMigration(e,"data","system")}