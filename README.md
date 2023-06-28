# textlint-rule-alive-link

[![textlint rule](https://img.shields.io/badge/textlint-fixable-green.svg?style=social)](https://textlint.github.io/)
[![npm](https://img.shields.io/npm/v/textlint-rule-alive-link.svg)](https://www.npmjs.com/package/textlint-rule-alive-link)
[![test](https://github.com/fengma1992/textlint-rule-alive-link/actions/workflows/test.yml/badge.svg)](https://github.com/fengma1992/textlint-rule-alive-link/actions/workflows/test.yml)

[textlint](https://github.com/textlint/textlint) rule
to make sure every link in a document is available.

The targets of this rule is Markdown documents and plain text documents (See tests).

This rule is mainly adopted from [textlint-rule-no-dead-link](https://github.com/textlint-rule/textlint-rule-no-dead-link) with some modifications.

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

This error is fixable and textlint will automatically replace the obsolete links with their new ones if you run it with `--fix` option.

### Relative Link Resolution

Sometimes your files contain relative URIs, which don't have domain information in an URI string.
In this case, we have to somehow resolve the relative URIs and convert them into absolute URIs.

The resolution strategy is as follows:

1. If `baseURI` is specified, use that path to resolve relative URIs (See the below section for details).
2. If not, try to get the path of the file being linted and use its parent folder as the base path.
3. If that's not available (e.g., when you are performing linting from API), put an error `Unable to resolve the relative URI`.

### URI matching in plain text

URI RegExpression this rule using is:

```js
/(?:https?:)?\/\/(?:www\.)?[-a-z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-\p{L}0-9()@:%_+.~#?&/=]*)/gu
```

## Options

Please write your configurations in `.textlintrc`.

The default options are:

```js
{
  "rules": {
    "alive-link": {
      checkRelative: true, // {boolean} `false` disables the checks for relative URIs.
      baseURI: null, // {String|null} a base URI to resolve relative URIs. baseURI is required if checkRelative is set true.
      ignore: [], // {Array<String>} URIs to be skipped from availability checks.
      ignoreRedirects: false, // {boolean} `false` ignores redirect status codes.
      ignoreStringLinks: false, // {boolean} `false` URI matching in plain text.
      preferGET: [], // {Array<String>} origins to prefer GET over HEAD.
      retry: 3, // {number} Max retry count
      concurrency: 8, // {number} Concurrency count of linting link [Experimental]
      interval: 500, // The length of time in milliseconds before the interval count resets. Must be finite. [Experimental]
      intervalCap: 8, // The max number of runs in the given interval of time. [Experimental]
      userAgent: 'textlint-rule-alive-link/0.1', // {String} a UserAgent,
      maxRetryDelay: 10, // (number) The max of waiting seconds for retry. It is related to `retry` option. It does affect to `Retry-After` header.
      maxRetryAfterDelay: 10, // (number) The max of waiting seconds for `Retry-After` header.
    }
  }
}
```

### checkRelative

This rule checks the availability of relative URIs by default.
You can turn off the checks by passing `false` to this option.

### baseURI

The base URI to be used for resolving relative URIs.

Though its name, you can pass either an URI starting with `http` or `https`, or an file path starting with `/`.

Examples:

```js
"alive-link": {
  "baseURI": "http://example.com/"
}
```

```js
"alive-link": {
  "baseURI": "/Users/textlint/path/to/parent/folder/"
}
```

### ignore

An array of URIs or [glob](https://github.com/isaacs/node-glob "glob")s to be ignored.
These list will be skipped from the availability checks.

The matching method use [minimatch](https://www.npmjs.com/package/minimatch).

Example:

```js
"alive-link": {
  "ignore": [
    "http://example.com/not-exist/index.html",
    "http://example.com/*" // glob format
    "**/api/v1",
  ]
}
```

### preferGET

An array of [origins](https://url.spec.whatwg.org/#origin) to lets the rule connect to the origin's URL by `GET` instead of default `HEAD` request.

Although the rule will fall back to `GET` method when `HEAD` request is failed (status code is not between 200 and 300), in order to shorten time to run your test, you can use this option when you are sure that target origin always returns 5xx for `HEAD` request.

Example:

```js
"alive-link": {
  "preferGET": [
    "http://example.com"
  ]
}
```

### ignoreRedirects

This rule checks for redirects (3xx status codes) and considers them an error by default.
To ignore redirects during checks, set this value to `false`.

<!-- Experimental 

### concurrency

This rule checks links concurrently.
The default concurrency count is `8`.

-->

### ignoreStringLinks

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

### retry

This rule checks the url with retry.
The default max retry count is `3`.
Set smaller to save linting time as needed.

### userAgent

Customize `User-Agent` http header.

### maxRetryDelay

The max of waiting seconds for retry. It is related to `retry` option.

:memo: It does affect to [`Retry-After`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After) header. If you want to max waiting seconds for `Retry-After` header, please use `maxRetryAfterDelay` option.

Default: `10`

### maxRetryAfterDelay

The max of allow waiting time second for [`Retry-After`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After) header value.

Some website like GitHub returns `Retry-After` header value with `429 too many requests`.
This `maxRetryAfterDelay` option is for that `Retry-After`.

Default: `10`

## Tests

```
npm test
```

## License

MIT License (http://nodaguti.mit-license.org/)
