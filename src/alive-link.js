import { isAbsolute } from 'path'
import URL from 'url'
import fs from 'fs/promises'

import { RuleHelper } from 'textlint-rule-helper'
import fetch from 'node-fetch'
import minimatch from 'minimatch'
import pMemoize from 'p-memoize'
import PQueue from 'p-queue'

const DEFAULT_OPTIONS = {
  checkRelative: true, // {boolean} `false` disables the checks for relative URIs.
  baseURI: null, // {String|null} a base URI to resolve relative URIs.
  ignore: [], // {Array<String>} URIs to be skipped from availability checks.
  ignoreRedirects: false, // {boolean} `false` ignores redirect status codes.
  ignoreStringLinks: false, // {boolean} `false` skip URI_REGEXP checking in string.
  preferGET: [], // {Array<String>} origins to prefer GET over HEAD.
  retry: 3, // {number} Max retry count
  concurrency: 8, // {number} Concurrency count of linting link [Experimental]
  interval: 500, // The length of time in milliseconds before the interval count resets. Must be finite. [Experimental]
  intervalCap: 8, // The max number of runs in the given interval of time. [Experimental]
  userAgent: 'textlint-rule-alive-link/0.1', // {String} a UserAgent,
  maxRetryDelay: 10, // (number) The max of waiting seconds for retry. It is related to `retry` option. It does affect to `Retry-After` header.
  maxRetryAfterDelay: 10, // (number) The max of waiting seconds for `Retry-After` header.
}

const URI_REGEXP = /(?:https?:)?\/\/(?:www\.)?[-a-z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-\p{L}0-9()@:%_+.~#?&/=]*)/gu

const STATUS_CODE = {
  NOT_ALLOWED: 405,
  REDIRECT: [301, 302, 303, 307, 308],
}

/**
 * Return URL origin string from `urlString`.
 * If origin is not found, return null
 * @param {string} urlString
 * @returns {string | null}
 * @see https://url.spec.whatwg.org/#origin
 */
function getURLOrigin(urlString) {
  if (!urlString) {
    return null
  }
  const obj = URL.parse(urlString)
  if (!obj.protocol && !obj.hostname) {
    return null
  }
  return `${obj.protocol}//${obj.hostname}${obj.port ? `:${obj.port}` : ''}`
}

/**
 * Returns `true` if a given URI is https? url.
 * @param {string} uri
 * @return {boolean}
 */
function isHttp(uri) {
  const { protocol } = URL.parse(uri)
  return protocol === 'http:' || protocol === 'https:'
}

/**
 * Returns `true` if a given URI is relative.
 * @param {string} uri
 * @return {boolean}
 * @see https://github.com/panosoft/is-local-path
 */
function isRelative(uri) {
  const { host } = URL.parse(uri)
  return host === null || host === ''
}

/**
 * Returns if a given URI indicates a local file.
 * @param {string} uri
 * @return {boolean}
 * @see https://nodejs.org/api/path.html#path_path_isabsolute_path
 */
function isLocal(uri) {
  if (isAbsolute(uri)) {
    return true
  }
  return isRelative(uri)
}

/**
 * Return `true` if the `code` is redirect status code.
 * @see https://fetch.spec.whatwg.org/#redirect-status
 * @param {number} code
 * @returns {boolean}
 */
function isRedirect(code) {
  return STATUS_CODE.REDIRECT.includes(code)
}

function isIgnored(uri, ignore = []) {
  return ignore.some((pattern) => minimatch(uri, pattern))
}

/**
 * Check if URI have protocol
 * @description Some URIs' protocol in HTML is removed. Like: //google.com instead of https://google.com
 * @param {string} uri
 * @return {boolean}
 */
function checkProtocol(uri) {
  return /^\/\//.test(uri)
}

/**
 * wait for ms and resolve the promise
 * @param ms
 * @returns {Promise<any>}
 */
function waitTimeMs(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

const createFetchWithRuleDefaults = (ruleOptions) => {
  return (uri, fetchOptions) => {
    const { host } = URL.parse(uri)
    return fetch(uri, {
      ...fetchOptions,
      // Disable gzip compression in Node.js
      // to avoid the zlib's "unexpected end of file" error
      // https://github.com/request/request/issues/2045
      compress: false,
      // Some website require UserAgent and Accept header
      // to avoid ECONNRESET error
      headers: {
        'User-Agent': ruleOptions.userAgent,
        Accept: '*/*',
        // avoid assign null to Host
        ...(host
          ? {
            // Same host for target url
            Host: host,
          }
          : {}),
      },
    })
  }
}

/**
 * Create isAliveURI function with ruleOptions
 * @param {object} ruleOptions
 * @returns {function}
 */
const createCheckAliveURL = (ruleOptions) => {
  // Create fetch function for this rule
  const fetchWithDefaults = createFetchWithRuleDefaults(ruleOptions)
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
  return async function isAliveURI(
    uri,
    method = 'HEAD',
    maxRetryCount = 3,
    currentRetryCount = 0,
  ) {
    const opts = {
      method,
      // Use `manual` redirect behaviour to get HTTP redirect status code
      // and see what kind of redirect is occurring
      redirect: 'manual',
    }
    try {
      const res = await fetchWithDefaults(uri, opts)
      // Redirected
      if (isRedirect(res.status)) {
        const redirectedUrl = res.headers.get('Location')
        // Status code is 301 or 302, but Location header is not set
        if (redirectedUrl === null) {
          return {
            ok: false,
            redirected: true,
            redirectTo: null,
            message: `${res.status} ${res.statusText}`,
          }
        }
        const finalRes = await fetchWithDefaults(redirectedUrl, { ...opts, redirect: 'follow' })
        const { hash } = URL.parse(uri)
        return {
          ok: finalRes.ok,
          redirected: true,
          redirectTo: hash !== null ? `${finalRes.url}${hash}` : finalRes.url,
          message: `${res.status} ${res.statusText}`,
        }
      }

      // Return directly if true
      if (res.ok) {
        return {
          ok: true,
          message: 'OK',
        }
      }

      // Retry available
      if (currentRetryCount < maxRetryCount) {
        // If current method is not allowed, switch to the allowed method
        if (res.status === STATUS_CODE.NOT_ALLOWED) {
          method = res.headers.get('Allow') || 'GET'
        } else {
          // Retry using 'GET' method if it is not ok when use 'HEAD' method
          method = 'GET'
        }

        let delayMs = 0
        // Try to fetch again if not reach max retry count
        const retryAfter = res.headers.get('Retry-After')
        // The response `Retry-After` header has a higher priority
        // e.g. `Retry-After: 60` and `maxRetryAfterDelay: 90`, wait 60 seconds
        if (retryAfter) {
          const retryAfterMs = Number(retryAfter) * 1000
          const maxRetryAfterDelayMs = ruleOptions.maxRetryAfterDelay * 1000
          delayMs = Math.min(retryAfterMs, maxRetryAfterDelayMs)
        } else {
          // exponential retry: 0ms -> 100ms -> 200ms -> 400ms -> 800ms ...
          const retryWaitTimeMs = currentRetryCount ** 2 * 100
          const maxRetryDelayMs = ruleOptions.maxRetryDelay * 1000

          delayMs = Math.min(retryWaitTimeMs, maxRetryDelayMs)
        }
        if (delayMs > 0) {
          // Retry delay
          await waitTimeMs(delayMs)
        }
        return isAliveURI(uri, method, maxRetryCount, currentRetryCount + 1)
      }

      return {
        ok: false,
        message: `${res.status} ${res.statusText}`,
      }
    } catch (ex) {
      // Retry with `GET` method if the request failed
      // as some servers don't accept `HEAD` requests but are OK with `GET` requests.
      if (method === 'HEAD' && currentRetryCount < maxRetryCount) {
        return isAliveURI(uri, 'GET', maxRetryCount, currentRetryCount + 1)
      }

      return {
        ok: false,
        message: ex.message,
      }
    }
  }
}

/**
 * Check if a given file exists
 */
async function isAliveLocalFile(filePath) {
  try {
    // Remove query string and hash string
    await fs.access(filePath.replace(/[?#].*?$/, ''))
    return {
      ok: true,
      message: 'OK',
    }
  } catch (ex) {
    return {
      ok: false,
      message: ex.message,
    }
  }
}

const reporter = (context, options) => {
  const { Syntax, getSource, report, RuleError, fixer, getFilePath, locator } = context
  const helper = new RuleHelper(context)
  const ruleOptions = { ...DEFAULT_OPTIONS, ...options }
  // format preferGET list to ensure URI string is origin
  ruleOptions.preferGET = ruleOptions.preferGET.map((origin) => getURLOrigin(origin))
  const isAliveURI = createCheckAliveURL(ruleOptions)
  // 30sec memorized
  const memorizedIsAliveURI = pMemoize(isAliveURI, {
    maxAge: 30 * 1000,
  })

  /**
   * Checks a given URI's availability and report if it is dead.
   * @param {TextLintNode} node TextLintNode the URI belongs to.
   * @param {string} uri a URI string to be linted.
   * @param {number} index column number the URI is located at.
   * @param {number} maxRetryCount retry count of linting
   */
  const lint = async ({ node, uri, index }, maxRetryCount) => {
    if (isIgnored(uri, ruleOptions.ignore)) {
      return
    }
    const URIRange = [index, index + uri.length]
    let newURI = uri
    let result = null

    if (isRelative(uri)) {
      // Check if there is just no protocol ahead
      if (checkProtocol(uri)) {
        newURI = `https:${uri}`
      } else {
        if (!ruleOptions.checkRelative) {
          return
        }

        // Input source may be a file, use the filePath as baseURI if ruleOptions.baseURI is not provided
        const base = ruleOptions.baseURI || getFilePath()
        if (!base) {
          const message = 'Unable to resolve the relative URI. Please check if the options.baseURI is correctly specified.'
          report(node, new RuleError(message, { padding: locator.range(URIRange) }))
          return
        }

        newURI = URL.resolve(base, uri)
      }
    }

    if (isLocal(newURI)) {
      result = await isAliveLocalFile(newURI)
    } else {
      // Ignore non http external link
      if (!isHttp(newURI)) {
        return
      }

      // Determine request method
      const method = ruleOptions.preferGET.includes(getURLOrigin(newURI)) ? 'GET' : 'HEAD'
      result = await memorizedIsAliveURI(newURI, method, maxRetryCount)
    }

    const { ok, redirected, redirectTo, message } = result
    // When ignoreRedirects is true, redirected should be ignored
    if (redirected && ruleOptions.ignoreRedirects) {
      return
    }
    if (!ok) {
      const lintMessage = `${uri} is dead. (${message})`
      report(node, new RuleError(lintMessage, { padding: locator.range(URIRange) }))
    } else if (redirected) {
      const lintMessage = `${uri} is redirected to ${redirectTo}. (${message})`
      // Replace the old URI with redirected URI
      const fix = redirectTo ? fixer.replaceTextRange(URIRange, redirectTo) : undefined
      report(node, new RuleError(lintMessage, { fix, padding: locator.range(URIRange) }))
    }
  }

  /**
   * URIs to be checked.
   */
  const URIs = []

  return {
    [Syntax.Str](node) {
      if (ruleOptions.ignoreStringLinks) {
        return
      }
      if (helper.isChildNode(node, [Syntax.BlockQuote])) {
        return
      }

      // prevent double checks
      if (helper.isChildNode(node, [Syntax.Link])) {
        return
      }

      // prevent double checks
      if (helper.isChildNode(node, [Syntax.Image])) {
        return
      }

      const text = getSource(node)

      // Use `String#replace` instead of `RegExp#exec` to allow us
      // perform RegExp matches in an iterate and immutable manner
      const matches = text.matchAll(URI_REGEXP)
      Array.from(matches).forEach((match) => {
        const url = match[0]
        if (url && match.input !== undefined && match.index !== undefined) {
          URIs.push({ node, uri: url, index: match.index })
        }
      })
    },

    [Syntax.Link](node) {
      if (helper.isChildNode(node, [Syntax.BlockQuote])) {
        return
      }

      // Ignore HTML5 place holder link.
      // Ex) <a>Placeholder Link</a>
      if (typeof node.url === 'undefined') {
        return
      }

      // [text](http://example.com)
      //       ^
      const index = node.raw.indexOf(node.url) || 0

      URIs.push({
        node,
        uri: node.url,
        index,
      })
    },

    [Syntax.Image](node) {
      if (helper.isChildNode(node, [Syntax.BlockQuote])) {
        return
      }

      // ![img](http://example.com)
      //       ^
      const index = node.raw.indexOf(node.url) || 0

      URIs.push({
        node,
        uri: node.url,
        index,
      })
    },

    // Reference links is markdown specific
    Definition: function (node) {
      if (!node.url) {
        return
      }

      // Some link text[1]
      //
      // [1]: https://foo.bar
      //      ^
      const indexOfUrl = node.raw.indexOf(node.url)
      const index = indexOfUrl !== -1 ? indexOfUrl : 0
      URIs.push({
        node,
        uri: node.url,
        index,
      })
    },

    [Syntax.DocumentExit]() {
      const queue = new PQueue({
        concurrency: ruleOptions.concurrency,
        intervalCap: ruleOptions.intervalCap,
        interval: ruleOptions.interval,
      })
      const linkTasks = URIs.map((item) => () => lint(item, ruleOptions.retry))
      return queue.addAll(linkTasks)
    },
  }
}
export default {
  linter: reporter,
  fixer: reporter,
}
