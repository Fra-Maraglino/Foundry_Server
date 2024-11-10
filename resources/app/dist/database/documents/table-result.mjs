import BaseTableResult from"../../../common/documents/table-result.mjs";import ServerDocumentMixin from"../backend/server-document.mjs";export default class TableResult extends(ServerDocumentMixin(BaseTableResult)){static _migrationRegistry=[...super._migrationRegistry,{fn:migrateV10Fields,version:12},{fn:migrateType,version:12}]}function migrateV10Fields(e){const t=TableResult._addDataFieldMigration(e,"collection","documentCollection"),r=TableResult._addDataFieldMigration(e,"resultCollection","documentCollection"),i=TableResult._addDataFieldMigration(e,"resultId","documentId");return t||r||i}function migrateType(e){switch(e.type){case 0:return e.type=CONST.TABLE_RESULT_TYPES.TEXT,!0;case 1:return e.type=CONST.TABLE_RESULT_TYPES.DOCUMENT,!0;case 2:return e.type=CONST.TABLE_RESULT_TYPES.COMPENDIUM,!0}return!1}