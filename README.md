# textlint-rule-alive-link

[![textlint rule](https://img.shields.io/badge/textlint-fixable-green.svg?style=social)](https://textlint.github.io/)
[![npm](https://img.shields.io/npm/v/textlint-rule-alive-link.svg)](https://www.npmjs.com/package/textlint-rule-alive-link)
[![test](https://github.com/fengma1992/textlint-rule-alive-link/actions/workflows/test.yml/badge.svg)](https://github.com/fengma1992/textlint-rule-alive-link/actions/workflows/test.yml)

[中文版 README](./docs/README_ZH.md)

[textlint](https://github.com/textlint/textlint) rule to make sure every link in a document is available.

The targets of this rule is Markdown documents and plain text documents (See tests).

This rule is mainly adopted from [textlint-rule-no-dead-link](https://github.com/textlint-rule/textlint-rule-no-dead-link) but much more faster and more features provided.

## Installation

```
$ npm install textlint-rule-alive-link
```

## Usage

```
$ npm install textlint textlint-rule-alive-link
$ textlint --rule textlint-rule-alive-link text-to-check.txt
```

## Features

### Dead Link Detection

Shows an error if a link is dead (i.e. its server returns one of the ["non-ok" responses](https://fetch.spec.whatwg.org/#ok-status)).


### Dead Image Link Detection

Shows an error if an image link is dead (i.e. its server returns one of the ["non-ok" responses](https://fetch.spec.whatwg.org/#ok-status)).

### Obsolete Link Detection

[![Fixable](https://img.shields.io/badge/textlint-fixable-green.svg?style=social)](https://textlint.github.io/)

Shows an error if a link is obsolete or moved to another location (i.e. its server returns one of the ["redirect" responses](https://fetch.spec.whatwg.org/#redirect-status)).

This error is fixable and `textlint` will automatically replace the obsolete links with their new ones if you run it with `--fix` option.

### Relative Link Resolution

Sometimes your files contain relative URIs, which don't have domain information in an URI string.
In this case, we have to somehow resolve the relative URIs and convert them into absolute URIs.

The resolution strategy is as follows:

1. If the URI is like `//example.com`, the rule check `https://example.com` instead. 
2. If `baseURI` is specified, use that path to resolve relative URIs (See the below section for details).
3. If not, try to get the path of the file being linted and use its parent folder as the base path.
4. If that's not available (e.g., when you are performing linting from API), put an error `Unable to resolve the relative URI`.

### URI matching in plain text

URI RegExpression this rule using is:

```js
/(?:https?:)?\/\/(?:www\.)?[-a-z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-\p{L}0-9()@:%_+.~#?&/=]*)/gu
```

## Options

Please write your configurations in `.textlintrc`, `.textlintrc.js` is recommended.

The default options are:

```js
{
  "rules": {
    "alive-link": {
      language: 'en', // {string} 'en' outputs info in English, set to 'zh' if you want Chinese
      checkRelative: true, // {boolean} `false` disables the checks for relative URIs.
      baseURI: null, // {string|function} a base URI to resolve relative URIs. If baseURI is a function, baseURI(uri) will be the URL to be checked, Function is only supported by .textlintrc.js.
      ignore: [], // {string|regExp|function[]} URIs to be skipped from availability checks. RegExp and Function are only supported by .textlintrc.js.
      ignoreRedirects: false, // {boolean} `false` ignores redirect status codes.
      ignoreStringLinks: false, // {boolean} `false` skip URI_REGEXP checking in string.
      preferGET: [], // {string[]} origins to prefer GET over HEAD.
      retry: 3, // {number} Max retry count
      concurrency: 8, // {number} Concurrency count of linting link [Experimental]
      interval: 500, // {number} The length of time in milliseconds before the interval count resets. Must be finite. [Experimental]
      intervalCap: 8, // {number} The max number of runs in the given interval of time. [Experimental]
      userAgent: 'textlint-rule-alive-link/0.1', // {string} a UserAgent,
      maxRetryDelay: 10, // {number} The max of waiting seconds for retry. It is related to `retry` option. It does affect to `Retry-After` header.
      maxRetryAfterDelay: 10, // {number} The max of waiting seconds for `Retry-After` header.
      timeout: 20, // {number} Request timeout, default is 20s.
    }
  }
}
```

### `{string}` language

This rule outputs error info in English by default (`language: 'en'`).
You can change to Chinese by passing `'zh'` to this option.

### `{boolean}` checkRelative

This rule checks the availability of relative URIs by default.
You can turn off the checks by passing `false` to this option.

### `{string|function}` baseURI

The base URI to be used for resolving relative URIs.

#### `{string}` baseURI

`string` type `baseURI`.
Though its name, you can pass either an URI starting with `http` or `https`, or an file path starting with `/`.

This option uses `URL.resolve(baseURI, relativeURI)` method in node `url` module to join URIs.

#### `{function}` baseURI

`function` type `baseURI`.

This option uses `baseURI(url)` result as the URI to be checked.

**Notice: Only supported in `.textlintrc.js`**

Examples:

```js
"alive-link": {
  "baseURI": "https://example.com/path/"
}

// Markdown content:
// [page1](/sub1/to/page1)
// [page2](sub2/to/page2)

// Parsed link:
// https://example.com/sub1/to/page1
// https://example.com/path/sub2/to/page2
```

```js
"alive-link": {
  "baseURI": "/Users/textlint/path/to/parent/folder/"
}

// Markdown content:
// [file](/path/to/file)

// Parsed link:
// /Users/textlint/path/to/parent/folder/path/to/file
```

```js
"alive-link": {
  "baseURI": url => 'https://example.com/' + url
}

// Markdown content:
// [page](page.html)

// Parsed link:
// https://example.com/page.html
```

### `{string|regExp|function[]}` ignore

#### `{string[]}` ignore

`string` type config in `ignore` option array. 

An array of URIs, [glob](https://github.com/isaacs/node-glob "glob")s,  to be ignored.
These list will be skipped from the availability checks.

The matching method use [minimatch](https://www.npmjs.com/package/minimatch).

#### `{regExp[]}` ignore

`regExp` type config in `ignore` option array.

URI matching RegExpression, matched URI will be ignored.

**Notice: Only supported in `.textlintrc.js`**

#### `{function[]}` ignore

`function` type config in `ignore` option array.

URI checking function, URI will be the function param and Boolean should be returned.

**Notice: Only supported in `.textlintrc.js`**

Example:

```js
"alive-link": {
  "ignore": [
    "http://example.com/not-exist/index.html", // URI string
    "http://example.com/*" // glob format string
    /example\.com/g, // regExp
    uri => uri.startsWith('https://example.com/') // function
  ]
}
```

### `string[]` preferGET

An array of [origins](https://url.spec.whatwg.org/#origin) to lets the rule connect to the origin's URL by `GET` instead of default `HEAD` request at first time.

Example:

```js
"alive-link": {
  "preferGET": [
    "http://example.com"
  ]
}
```

### `{boolean}` ignoreRedirects

This rule checks for redirects (3xx status codes) and considers them an error by default.
To ignore redirects during checks, set this value to `false`.

<!-- Experimental 

### concurrency

This rule checks links concurrently.
The default concurrency count is `8`.

-->

### `{boolean}` ignoreStringLinks

This rule extracts links from plain text using by default.
To ignore extracting during checks, set this value to `false`.

Example:

```js
// example 1
"alive-link": {
  "ignoreStringLinks": true
}
// Won't check this URL: https://example.com/

// example 2
"alive-link": {
  "ignoreStringLinks": false
}
// Will check this URL: https://example.com/
```

### `{number}` retry

This rule checks the URL with retry.
The default max retry count is `3`.
Set smaller to save linting time as needed.

Retry request method:

1. by `Response Headers Allow` parameter if `statusCode` is `405`.
2. `GET` as alternative.

### `{string}` userAgent

Customize `User-Agent` http header.

### `{number}` maxRetryDelay

The max of waiting seconds for retry. It is related to `retry` option.

:memo: It does affect to [`Retry-After`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After) header. If you want to max waiting seconds for `Retry-After` header, please use `maxRetryAfterDelay` option.

Default: `10`

### `{number}` maxRetryAfterDelay

The max of allow waiting time second for [`Retry-After`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After) header value.

Some website like GitHub returns `Retry-After` header value with `429 too many requests`.
This `maxRetryAfterDelay` option is for that `Retry-After`.

Default: `10`

### `{number}` timeout

Request timeout (seconds).

Default: `20`

## Tests

```
npm test
```

## License

[MIT License](https://github.com/fengma1992/textlint-rule-alive-link/blob/master/LICENSE)
