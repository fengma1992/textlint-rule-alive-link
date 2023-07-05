# textlint-rule-alive-link

[![textlint rule](https://img.shields.io/badge/textlint-fixable-green.svg?style=social)](https://textlint.github.io/)
[![npm](https://img.shields.io/npm/v/textlint-rule-alive-link.svg)](https://www.npmjs.com/package/textlint-rule-alive-link)
[![test](https://github.com/fengma1992/textlint-rule-alive-link/actions/workflows/test.yml/badge.svg)](https://github.com/fengma1992/textlint-rule-alive-link/actions/workflows/test.yml)

[textlint](https://github.com/textlint/textlint) 规则，用来确保文档内的每个链接、文件路径可用。

本规则适用于 Markdown 文档或纯文本内容（详情见测试用例）。

本规则主要参考了 [textlint-rule-no-dead-link](https://github.com/textlint-rule/textlint-rule-no-dead-link)，但校验快很多且提供了更多功能特性。

## 安装

```
$ npm install textlint-rule-alive-link
```

## 使用

```
$ npm install textlint textlint-rule-alive-link
$ textlint --rule textlint-rule-alive-link text-to-check.txt
```

## 功能特性

### 死链接/路径检测

检测到死链接/路径时提示错误。

### 死图片链接检测

检测到死图片链接时提示错误。

### 过期链接检测

[![Fixable](https://img.shields.io/badge/textlint-fixable-green.svg?style=social)](https://textlint.github.io/)

当检测到链接过期或迁移到其他地址时提示错误。

此类错误可修复，当使用 `--fix` 配置时， `textlint` 将自动用新地址替换过期链接。

### 相对链接解析

有时你的内容存在不包含域名信息的相对链接/路径。此时我们可以解析相对链接/路径并转化为绝对链接/路径。

解析策略如下：
1. 如果 URI 类似 `//example.com`, 将被解析为 `https://example.com`。 
2. 如果 `baseURI` 不为空, 本规则将结合 `baseURI` 来解析相对链接/路径，得到最终的链接/路径（详情见下面章节）。
3. 如果以上 2 点均不是，那么将尝试以文件所在路径为基础路径，结合将相对链接解析为最终文件路径。
4. 如果以上 3 点均不是，将提示错误 `无法解析相对链接`.

### 纯文本的 URI 匹配

本规则使用的 URI 正则表达式如下:

```js
/(?:https?:)?\/\/(?:www\.)?[-a-z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-\p{L}0-9()@:%_+.~#?&/=]*)/gu
```

## 配置项

请在 `.textlintrc` 内配置，建议使用 `.textlintrc.js`。

默认配置如下：

```js
{
  "rules": {
    "alive-link": {
      language: 'en',
      checkRelative: true,
      baseURI: null,
      ignore: [],
      ignoreRedirects: false,
      ignoreStringLinks: false,
      preferGET: [],
      retry: 3,
      concurrency: 8,
      interval: 500,
      intervalCap: 8,
      userAgent: 'textlint-rule-alive-link/0.1',
      maxRetryDelay: 10,
      maxRetryAfterDelay: 10,
      timeout: 20,
    }
  }
}
```

### `{string}` language

本规则默认提示英文错误（`language: 'en'`）。 设置 `language: 'zh'` 来提示中文错误。

### `{boolean}` checkRelative

本规则默认检查相对链接可用性。设为 `false` 来关闭检查。

### `{string|function}` baseURI

解析相对链接用到的基础 URI。

#### `{string}` baseURI

当 `baseURI` 是字符串时，你可以传以 `http` 或 `https` 开头的 URI，或者传以 `/` 开头的文件路径。

此选项使用 `node` 中 `url` 模块的 `URL.resolve(baseURI, relativeURI)` 方法来连接链接/路径。

#### `{function}` baseURI

当 `baseURI` 是函数时，此选项使用 `baseURI(url)` 的执行结果作为最终检查的链接。

**注意：此类型的选项仅在配置为 `.textlintrc.js` 时支持**

示例：

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

`ignore` 选项数组内的 `string` 类型配置。

待忽略的 URI 数组配置，[glob](https://github.com/isaacs/node-glob "glob")。 命中匹配的链接将被跳过检测。

匹配方法使用 [minimatch](https://www.npmjs.com/package/minimatch)。

#### `{regExp[]}` ignore

`ignore` 选项数组内的 `regExp` 类型配置。

命中正则匹配的链接将被跳过检测。

**注意：此类型的选项仅在配置为 `.textlintrc.js` 时支持**

#### `{function[]}` ignore

`ignore` 选项数组内的 `function` 类型配置。

待匹配的链接为函数入参，函数返回为 `true` 的链接将被跳过检测。

**注意：此类型的选项仅在配置为 `.textlintrc.js` 时支持**

示例：

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

配置 [origins](https://url.spec.whatwg.org/#origin) 数组来让规则在首次请求时优先使用 `GET` 方法进行检测，而不是默认的 `HEAD` 方法。

注意：配置的是 origin， `http://example.com/a/b/c` 会被重置为 `http://example.com`。

示例:

```js
"alive-link": {
  "preferGET": [
    "http://example.com"
  ]
}
```

### `{boolean}` ignoreRedirects

本规则默认检测重定向（3xx 状态码）并认定为错误。 如果想忽略重定向检测，设置 `ignoreRedirects` 为 `false`。

### `{boolean}` ignoreStringLinks

本规则默认提取纯文本内的链接并进行检测。如果想忽略提取，设置 `ignoreStringLinks` 为 `false`。

示例：

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

本规则检测链接不通过时将重试，默认最大重试次数是 `3`。设置更小重试次数来节省检测时长。

重试使用的请求方法：
1.  如果上次请求返回的 `statusCode` 是 `405`，使用 `Response Headers Allow` 的返回参数。
2. `GET`。

### `{string}` userAgent

自定义的 `User-Agent` http 头.

### `{number}` maxRetryDelay

最大的请求等待时间（秒），与 `retry` 选项相关联。

默认: `10`

### `{number}` maxRetryAfterDelay

针对 [`Retry-After`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After) 返回头的最大允许等待时间（秒）

有些网站例如 GitHub 的 `Retry-After` 返回头的值为 `429 too many requests`。 本配置项 `maxRetryAfterDelay` 正是用来重置 `Retry-After` 的.

默认: `10`

### `{number}` timeout

请求超时时间（秒），超时则认为链接错误。

默认: `20`

## 测试

```
npm test
```

## 许可证

[MIT License](https://github.com/fengma1992/textlint-rule-alive-link/blob/master/LICENSE)
