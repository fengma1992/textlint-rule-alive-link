"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _path = require("path");
var _url = _interopRequireDefault(require("url"));
var _promises = _interopRequireDefault(require("fs/promises"));
var _textlintRuleHelper = require("textlint-rule-helper");
var _nodeFetch = _interopRequireDefault(require("node-fetch"));
var _minimatch = _interopRequireDefault(require("minimatch"));
var _pMemoize = _interopRequireDefault(require("p-memoize"));
var _pQueue = _interopRequireDefault(require("p-queue"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }
function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
var DEFAULT_OPTIONS = {
  language: 'en',
  // {string} 'en': output info in English, set to 'zh' if you want Chinese
  checkRelative: true,
  // {boolean} `false` disables the checks for relative URIs.
  baseURI: null,
  // {string|function} a base URI to resolve relative URIs. If baseURI is a function, baseURI(uri) will be the URL to be checked, Function is only supported by .textlintrc.js.
  ignore: [],
  // {string|regExp|function[]} URIs to be skipped from availability checks. RegExp and Function are only supported by .textlintrc.js.
  ignoreRedirects: false,
  // {boolean} `false` ignores redirect status codes.
  ignoreStringLinks: false,
  // {boolean} `false` URI matching in plain text.
  preferGET: [],
  // {string[]} origins to prefer GET over HEAD.
  retry: 3,
  // {number} Max retry count
  concurrency: 8,
  // {number} Concurrency count of linting link [Experimental]
  interval: 500,
  // {number} The length of time in milliseconds before the interval count resets. Must be finite. [Experimental]
  intervalCap: 8,
  // {number} The max number of runs in the given interval of time. [Experimental]
  userAgent: 'textlint-rule-alive-link/0.1',
  // {string} a UserAgent,
  maxRetryDelay: 10,
  // {number} The max of waiting seconds for retry. It is related to `retry` option. It does affect to `Retry-After` header.
  maxRetryAfterDelay: 10,
  // {number} The max of waiting seconds for `Retry-After` header.
  timeout: 20 // {number} Request timeout (s), default is 20s.
};

var URI_REGEXP = /(?:https?:)?\/\/(?:www\.)?[#%\+\x2D\.0-:=@_a-z~]{1,256}\.[\(\)0-9A-Za-z]{1,6}\b(?:(?:[#%&\(\)\+\x2D-:=\?-Z_a-z~\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0560-\u0588\u05D0-\u05EA\u05EF-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u0860-\u086A\u0870-\u0887\u0889-\u088E\u08A0-\u08C9\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u09FC\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C5D\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D04-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E86-\u0E8A\u0E8C-\u0EA3\u0EA5\u0EA7-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16F1-\u16F8\u1700-\u1711\u171F-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1878\u1880-\u1884\u1887-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4C\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C88\u1C90-\u1CBA\u1CBD-\u1CBF\u1CE9-\u1CEC\u1CEE-\u1CF3\u1CF5\u1CF6\u1CFA\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2183\u2184\u2C00-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005\u3006\u3031-\u3035\u303B\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312F\u3131-\u318E\u31A0-\u31BF\u31F0-\u31FF\u3400-\u4DBF\u4E00-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6E5\uA717-\uA71F\uA722-\uA788\uA78B-\uA7CA\uA7D0\uA7D1\uA7D3\uA7D5-\uA7D9\uA7F2-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA8FE\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB69\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF2D-\uDF40\uDF42-\uDF49\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF]|\uD801[\uDC00-\uDC9D\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDD70-\uDD7A\uDD7C-\uDD8A\uDD8C-\uDD92\uDD94\uDD95\uDD97-\uDDA1\uDDA3-\uDDB1\uDDB3-\uDDB9\uDDBB\uDDBC\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67\uDF80-\uDF85\uDF87-\uDFB0\uDFB2-\uDFBA]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE35\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2\uDD00-\uDD23\uDE80-\uDEA9\uDEB0\uDEB1\uDF00-\uDF1C\uDF27\uDF30-\uDF45\uDF70-\uDF81\uDFB0-\uDFC4\uDFE0-\uDFF6]|\uD804[\uDC03-\uDC37\uDC71\uDC72\uDC75\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD44\uDD47\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE3F\uDE40\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC00-\uDC34\uDC47-\uDC4A\uDC5F-\uDC61\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDEB8\uDF00-\uDF1A\uDF40-\uDF46]|\uD806[\uDC00-\uDC2B\uDCA0-\uDCDF\uDCFF-\uDD06\uDD09\uDD0C-\uDD13\uDD15\uDD16\uDD18-\uDD2F\uDD3F\uDD41\uDDA0-\uDDA7\uDDAA-\uDDD0\uDDE1\uDDE3\uDE00\uDE0B-\uDE32\uDE3A\uDE50\uDE5C-\uDE89\uDE9D\uDEB0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC2E\uDC40\uDC72-\uDC8F\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD30\uDD46\uDD60-\uDD65\uDD67\uDD68\uDD6A-\uDD89\uDD98\uDEE0-\uDEF2\uDF02\uDF04-\uDF10\uDF12-\uDF33\uDFB0]|\uD808[\uDC00-\uDF99]|\uD809[\uDC80-\uDD43]|\uD80B[\uDF90-\uDFF0]|[\uD80C\uD81C-\uD820\uD822\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879\uD880-\uD883\uD885-\uD887][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2F\uDC41-\uDC46]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE70-\uDEBE\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDE40-\uDE7F\uDF00-\uDF4A\uDF50\uDF93-\uDF9F\uDFE0\uDFE1\uDFE3]|\uD821[\uDC00-\uDFF7]|\uD823[\uDC00-\uDCD5\uDD00-\uDD08]|\uD82B[\uDFF0-\uDFF3\uDFF5-\uDFFB\uDFFD\uDFFE]|\uD82C[\uDC00-\uDD22\uDD32\uDD50-\uDD52\uDD55\uDD64-\uDD67\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD837[\uDF00-\uDF1E\uDF25-\uDF2A]|\uD838[\uDC30-\uDC6D\uDD00-\uDD2C\uDD37-\uDD3D\uDD4E\uDE90-\uDEAD\uDEC0-\uDEEB]|\uD839[\uDCD0-\uDCEB\uDFE0-\uDFE6\uDFE8-\uDFEB\uDFED\uDFEE\uDFF0-\uDFFE]|\uD83A[\uDC00-\uDCC4\uDD00-\uDD43\uDD4B]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDEDF\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF39\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]|\uD884[\uDC00-\uDF4A\uDF50-\uDFFF]|\uD888[\uDC00-\uDFAF])*)/g;
var STATUS_CODE = {
  NOT_ALLOWED: 405,
  REDIRECT: [301, 302, 303, 307, 308]
};

/**
 * Return URL origin string from `urlString`.
 * If origin is not found, return null
 * @param {string} urlString
 * @returns {string | null}
 * @see https://url.spec.whatwg.org/#origin
 */
function getURLOrigin(urlString) {
  if (!urlString) {
    return null;
  }
  var obj = _url.default.parse(urlString);
  if (!obj.protocol && !obj.hostname) {
    return null;
  }
  return "".concat(obj.protocol, "//").concat(obj.hostname).concat(obj.port ? ":".concat(obj.port) : '');
}

/**
 * Returns `true` if a given URI is https? url.
 * @param {string} uri
 * @return {boolean}
 */
function isHttp(uri) {
  var {
    protocol
  } = _url.default.parse(uri);
  return protocol === 'http:' || protocol === 'https:';
}

/**
 * Returns `true` if a given URI is relative.
 * @param {string} uri
 * @return {boolean}
 * @see https://github.com/panosoft/is-local-path
 */
function isRelative(uri) {
  var {
    host
  } = _url.default.parse(uri);
  return host === null || host === '';
}

/**
 * Returns if a given URI indicates a local file.
 * @param {string} uri
 * @return {boolean}
 * @see https://nodejs.org/api/path.html#path_path_isabsolute_path
 */
function isLocal(uri) {
  if ((0, _path.isAbsolute)(uri)) {
    return true;
  }
  return isRelative(uri);
}

/**
 * Return `true` if the `code` is redirect status code.
 * @see https://fetch.spec.whatwg.org/#redirect-status
 * @param {number} code
 * @returns {boolean}
 */
function isRedirect(code) {
  return STATUS_CODE.REDIRECT.includes(code);
}

/**
 * Return `true` if reg is a regExpression
 * @param reg
 * @return {boolean}
 */
function isRegExp(reg) {
  return Object.prototype.toString.call(reg) === '[object RegExp]';
}
function isIgnored(uri, ignoreFuncs) {
  return ignoreFuncs.some(ignoreFunc => ignoreFunc(uri));
}

/**
 * Check if URI have protocol
 * @description Some URIs' protocol in HTML is removed. Like: //google.com instead of https://google.com
 * @param {string} uri
 * @return {boolean}
 */
function checkProtocol(uri) {
  return /^\/\//.test(uri);
}

/**
 * wait for ms and resolve the promise
 * @param ms
 * @returns {Promise<any>}
 */
function waitTimeMs(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
var createFetchWithRuleDefaults = ruleOptions => {
  return (uri, fetchOptions) => {
    var {
      host
    } = _url.default.parse(uri);
    return (0, _nodeFetch.default)(uri, _objectSpread(_objectSpread({}, fetchOptions), {}, {
      timeout: ruleOptions.timeout * 1000,
      // Disable gzip compression in Node.js
      // to avoid the zlib's "unexpected end of file" error
      // https://github.com/request/request/issues/2045
      compress: false,
      // Some website require UserAgent and Accept header
      // to avoid ECONNRESET error
      headers: _objectSpread({
        'User-Agent': ruleOptions.userAgent,
        Accept: '*/*'
      }, host ? {
        // Same host for target url
        Host: host
      } : {})
    }));
  };
};

/**
 * Create isAliveURI function with ruleOptions
 * @param {object} ruleOptions
 * @returns {function}
 */
var createCheckAliveURL = ruleOptions => {
  // Create fetch function for this rule
  var fetchWithDefaults = createFetchWithRuleDefaults(ruleOptions);
  /**
   * Checks if a given URI is alive or not.
   *
   * Normally, this method following strategiry about retry
   *
   * 1. Head
   * 2. Get
   * 3. Get
   *
   * @param {string} uri
   * @param {string} method
   * @param {number} maxRetryCount
   * @param {number} currentRetryCount
   * @return {{ ok: boolean, redirect?: string, message: string }}
   */
  return /*#__PURE__*/function () {
    var _isAliveURI = _asyncToGenerator(function* (uri) {
      var method = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'HEAD';
      var maxRetryCount = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 3;
      var currentRetryCount = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
      var opts = {
        method,
        // Use `manual` redirect behaviour to get HTTP redirect status code
        // and see what kind of redirect is occurring
        redirect: 'manual'
      };
      try {
        var res = yield fetchWithDefaults(uri, opts);
        // Redirected
        if (isRedirect(res.status)) {
          var redirectedUrl = res.headers.get('Location');
          // Status code is 301 or 302, but Location header is not set
          if (redirectedUrl === null) {
            return {
              ok: false,
              redirected: true,
              redirectTo: null,
              message: "".concat(res.status, " ").concat(res.statusText)
            };
          }
          var finalRes = yield fetchWithDefaults(redirectedUrl, _objectSpread(_objectSpread({}, opts), {}, {
            redirect: 'follow'
          }));
          var {
            hash
          } = _url.default.parse(uri);
          return {
            ok: finalRes.ok,
            redirected: true,
            redirectTo: hash !== null ? "".concat(finalRes.url).concat(hash) : finalRes.url,
            message: "".concat(res.status, " ").concat(res.statusText)
          };
        }

        // Return directly if true
        if (res.ok) {
          return {
            ok: true,
            message: 'OK'
          };
        }

        // Retry available
        if (currentRetryCount < maxRetryCount) {
          // If current method is not allowed, switch to the allowed method
          if (res.status === STATUS_CODE.NOT_ALLOWED) {
            method = res.headers.get('Allow') || 'GET';
          } else {
            // Retry using 'GET' method if it is not ok when use 'HEAD' method
            method = 'GET';
          }
          var delayMs = 0;
          // Try to fetch again if not reach max retry count
          var retryAfter = res.headers.get('Retry-After');
          // The response `Retry-After` header has a higher priority
          // e.g. `Retry-After: 60` and `maxRetryAfterDelay: 90`, wait 60 seconds
          if (retryAfter) {
            var retryAfterMs = Number(retryAfter) * 1000;
            var maxRetryAfterDelayMs = ruleOptions.maxRetryAfterDelay * 1000;
            delayMs = Math.min(retryAfterMs, maxRetryAfterDelayMs);
          } else {
            // exponential retry: 0ms -> 100ms -> 200ms -> 400ms -> 800ms ...
            var retryWaitTimeMs = currentRetryCount ** 2 * 100;
            var maxRetryDelayMs = ruleOptions.maxRetryDelay * 1000;
            delayMs = Math.min(retryWaitTimeMs, maxRetryDelayMs);
          }
          if (delayMs > 0) {
            // Retry delay
            yield waitTimeMs(delayMs);
          }
          return isAliveURI(uri, method, maxRetryCount, currentRetryCount + 1);
        }
        return {
          ok: false,
          message: "".concat(res.status, " ").concat(res.statusText)
        };
      } catch (ex) {
        // Retry with `GET` method if the request failed
        // as some servers don't accept `HEAD` requests but are OK with `GET` requests.
        if (method === 'HEAD' && currentRetryCount < maxRetryCount) {
          return isAliveURI(uri, 'GET', maxRetryCount, currentRetryCount + 1);
        }
        return {
          ok: false,
          message: ex.message
        };
      }
    });
    function isAliveURI(_x) {
      return _isAliveURI.apply(this, arguments);
    }
    return isAliveURI;
  }();
};

/**
 * Check if a given file exists
 */
function isAliveLocalFile(_x2) {
  return _isAliveLocalFile.apply(this, arguments);
}
function _isAliveLocalFile() {
  _isAliveLocalFile = _asyncToGenerator(function* (filePath) {
    try {
      // Remove query string and hash string
      yield _promises.default.access(filePath.replace(/[?#].*?$/, ''));
      return {
        ok: true,
        message: 'OK'
      };
    } catch (ex) {
      return {
        ok: false,
        message: ex.message
      };
    }
  });
  return _isAliveLocalFile.apply(this, arguments);
}
var MESSAGE_CODE = {
  RELATIVE_URI: 1,
  DEAD_URI: 2,
  REDIRECT_URI: 3
};
var MESSAGE = {
  [MESSAGE_CODE.RELATIVE_URI]: {
    en: 'Unable to resolve the relative URI. Please check if the options.baseURI is correctly specified.',
    zh: '无法解析相对链接。请检查是否正确配置 options.baseURI'
  },
  [MESSAGE_CODE.DEAD_URI]: {
    en: '${uri} is dead. (${message})',
    zh: '${uri} 是死链接。（${message}）'
  },
  [MESSAGE_CODE.REDIRECT_URI]: {
    en: '${uri} is redirected to ${redirectTo}. (${message})',
    zh: '${uri} 重定向到了 ${redirectTo}。（${message}）'
  }
};
var DEFAULT_MESSAGE = {
  en: 'Unknown error',
  zh: '未知错误'
};

/**
 * 基于语种等信息取出 lint message
 * @param {number} code
 * @param {object|null} data
 * @param {string} language
 * @return {string}
 */
function getLintMessage(_ref) {
  var {
    code,
    data,
    language
  } = _ref;
  var message = MESSAGE[code] || DEFAULT_MESSAGE;
  if (!data) {
    return message[language];
  }
  return Object.entries(data).reduce((result, _ref2) => {
    var [key, value] = _ref2;
    return result.replace("${".concat(key, "}"), value);
  }, message[language]);
}
var reporter = (context, options) => {
  var {
    Syntax,
    getSource,
    report,
    RuleError,
    fixer,
    getFilePath,
    locator
  } = context;
  var helper = new _textlintRuleHelper.RuleHelper(context);
  var ruleOptions = _objectSpread(_objectSpread({}, DEFAULT_OPTIONS), options);
  // format preferGET list to ensure URI string is origin
  ruleOptions.preferGET = ruleOptions.preferGET.map(origin => getURLOrigin(origin));
  // transform ignore patterns to function
  ruleOptions.ignoreFuncs = (ruleOptions.ignore || []).map(pattern => {
    if (typeof pattern === 'function') {
      return pattern;
    } else if (isRegExp(pattern)) {
      return uri => {
        // reset reg index on every test to avoid global pattern
        pattern.lastIndex = 0;
        return pattern.test(uri);
      };
    }
    return uri => (0, _minimatch.default)(uri, pattern);
  });
  var isAliveURI = createCheckAliveURL(ruleOptions);
  // 30sec memorized
  var memorizedIsAliveURI = (0, _pMemoize.default)(isAliveURI, {
    maxAge: 30 * 1000
  });

  /**
   * Checks a given URI's availability and report if it is dead.
   * @param {TextLintNode} node TextLintNode the URI belongs to.
   * @param {string} uri a URI string to be linted.
   * @param {number} index column number the URI is located at.
   * @param {number} maxRetryCount retry count of linting
   */
  var lint = /*#__PURE__*/function () {
    var _ref4 = _asyncToGenerator(function* (_ref3, maxRetryCount) {
      var {
        node,
        uri,
        index
      } = _ref3;
      if (isIgnored(uri, ruleOptions.ignoreFuncs)) {
        return;
      }
      var URIRange = [index, index + uri.length];
      var newURI = uri;
      var result = null;
      if (isRelative(uri)) {
        // Check if there is just no protocol ahead
        if (checkProtocol(uri)) {
          newURI = "https:".concat(uri);
        } else {
          if (!ruleOptions.checkRelative) {
            return;
          }
          if (typeof ruleOptions.baseURI === 'function') {
            newURI = ruleOptions.baseURI(uri);
          } else {
            // Input source may be a file, use the filePath as baseURI if ruleOptions.baseURI is not provided
            var base = ruleOptions.baseURI || getFilePath();
            if (!base) {
              var lintMessage = getLintMessage({
                code: MESSAGE_CODE.RELATIVE_URI,
                language: ruleOptions.language
              });
              report(node, new RuleError(lintMessage, {
                padding: locator.range(URIRange)
              }));
              return;
            }
            newURI = _url.default.resolve(base, uri);
          }
        }
      }
      if (isLocal(newURI)) {
        result = yield isAliveLocalFile(newURI);
      } else {
        // Ignore non http external link
        if (!isHttp(newURI)) {
          return;
        }

        // Determine request method
        var method = ruleOptions.preferGET.includes(getURLOrigin(newURI)) ? 'GET' : 'HEAD';
        result = yield memorizedIsAliveURI(newURI, method, maxRetryCount);
      }
      var {
        ok,
        redirected,
        redirectTo,
        message
      } = result;
      // When ignoreRedirects is true, redirected should be ignored
      if (redirected && ruleOptions.ignoreRedirects) {
        return;
      }
      if (!ok) {
        var _lintMessage = getLintMessage({
          code: MESSAGE_CODE.DEAD_URI,
          data: {
            uri,
            message
          },
          language: ruleOptions.language
        });
        report(node, new RuleError(_lintMessage, {
          padding: locator.range(URIRange)
        }));
      } else if (redirected) {
        var _lintMessage2 = getLintMessage({
          code: MESSAGE_CODE.REDIRECT_URI,
          data: {
            uri,
            redirectTo,
            message
          },
          language: ruleOptions.language
        });
        // Replace the old URI with redirected URI
        var fix = redirectTo ? fixer.replaceTextRange(URIRange, redirectTo) : undefined;
        report(node, new RuleError(_lintMessage2, {
          fix,
          padding: locator.range(URIRange)
        }));
      }
    });
    return function lint(_x3, _x4) {
      return _ref4.apply(this, arguments);
    };
  }();

  /**
   * URIs to be checked.
   */
  var URIs = [];
  return {
    [Syntax.Str](node) {
      if (ruleOptions.ignoreStringLinks) {
        return;
      }
      if (helper.isChildNode(node, [Syntax.BlockQuote])) {
        return;
      }

      // prevent double checks
      if (helper.isChildNode(node, [Syntax.Link])) {
        return;
      }

      // prevent double checks
      if (helper.isChildNode(node, [Syntax.Image])) {
        return;
      }
      var text = getSource(node);

      // Use `String#replace` instead of `RegExp#exec` to allow us
      // perform RegExp matches in an iterate and immutable manner
      var matches = text.matchAll(URI_REGEXP);
      Array.from(matches).forEach(match => {
        var url = match[0];
        if (url && match.input !== undefined && match.index !== undefined) {
          URIs.push({
            node,
            uri: url,
            index: match.index
          });
        }
      });
    },
    [Syntax.Link](node) {
      if (helper.isChildNode(node, [Syntax.BlockQuote])) {
        return;
      }

      // Ignore HTML5 place holder link.
      // Ex) <a>Placeholder Link</a>
      if (typeof node.url === 'undefined') {
        return;
      }

      // [text](http://example.com)
      //       ^
      var index = node.raw.indexOf(node.url) || 0;
      URIs.push({
        node,
        uri: node.url,
        index
      });
    },
    [Syntax.Image](node) {
      if (helper.isChildNode(node, [Syntax.BlockQuote])) {
        return;
      }

      // ![img](http://example.com)
      //       ^
      var index = node.raw.indexOf(node.url) || 0;
      URIs.push({
        node,
        uri: node.url,
        index
      });
    },
    // Reference links is markdown specific
    Definition: function Definition(node) {
      if (!node.url) {
        return;
      }

      // Some link text[1]
      //
      // [1]: https://foo.bar
      //      ^
      var indexOfUrl = node.raw.indexOf(node.url);
      var index = indexOfUrl !== -1 ? indexOfUrl : 0;
      URIs.push({
        node,
        uri: node.url,
        index
      });
    },
    [Syntax.DocumentExit]() {
      var queue = new _pQueue.default({
        concurrency: ruleOptions.concurrency,
        intervalCap: ruleOptions.intervalCap,
        interval: ruleOptions.interval
      });
      var linkTasks = URIs.map(item => () => lint(item, ruleOptions.retry));
      return queue.addAll(linkTasks);
    }
  };
};
var _default = {
  linter: reporter,
  fixer: reporter
};
exports.default = _default;
//# sourceMappingURL=alive-link.js.map