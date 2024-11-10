import BasePlaylist from"../../../common/documents/playlist.mjs";import ServerDocumentMixin from"../backend/server-document.mjs";import{handleCustomSocket}from"../../server/sockets.mjs";export default class Playlist extends(ServerDocumentMixin(BasePlaylist)){static socketListeners(o){o.on("playAudio",handleCustomSocket.bind(o,"playAudio")),o.on("playAudioPosition",handleCustomSocket.bind(o,"playAudioPosition")),o.on("preloadAudio",(e=>o.broadcast.emit("preloadAudio",e)))}}