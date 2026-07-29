// Stub for Cesium's optional KML/zip import (`@zip.js/zip.js/lib/zip-no-worker.js`),
// which is missing from the installed @zip.js version. We never use Cesium's
// KmlDataSource, so an empty module is sufficient to let Vite/esbuild resolve it.
export const configure = () => {};
export class ZipReader {}
export class ZipWriter {}
export class BlobReader {}
export class BlobWriter {}
export class Uint8ArrayReader {}
export class Uint8ArrayWriter {}
export class TextReader {}
export class TextWriter {}
export class Data64URIReader {}
export class Data64URIWriter {}
export const ERR_EOCDR_NOT_FOUND = "ERR_EOCDR_NOT_FOUND";
export default {};
