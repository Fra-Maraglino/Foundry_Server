import BaseChatMessage from"../../../common/documents/chat-message.mjs";import ServerDocumentMixin from"../backend/server-document.mjs";export default class ChatMessage extends(ServerDocumentMixin(BaseChatMessage)){static _migrationRegistry=[...super._migrationRegistry,{fn:migrateRolls,version:12}]}function migrateRolls(e){return"roll"in e&&("rolls"in e||(e.rolls=[e.roll]),delete e.roll,!0)}