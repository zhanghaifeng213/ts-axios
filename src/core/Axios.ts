import {
  AxiosRequestConfig,
  AxiosPromise,
  Method,
  AxiosResponse,
  ResolvedFn,
  RejectedFn
} from '../types'
import dispatchRequest, { transformURL } from './dispatchRequest'
import InterceptorManager from './InterceptorManager'
import mergeConfig from './mergeConfig'
interface Interceptors {
  request: InterceptorManager<AxiosRequestConfig>
  response: InterceptorManager<AxiosResponse>
}
interface PromiseChain<T> {
  resolved: ResolvedFn<T> | ((config: AxiosRequestConfig) => AxiosPromise)
  rejected?: RejectedFn
}
export default class Axios {
  defaults: AxiosRequestConfig
  interceptors: Interceptors
  constructor(initConfig: AxiosRequestConfig) {
    this.defaults = initConfig
    this.interceptors = {
      request: new InterceptorManager<AxiosRequestConfig>(),
      response: new InterceptorManager<AxiosResponse>()
    }
  }
  request(url: any, config?: any): AxiosPromise {
    if (typeof url === 'string') {
      if (!config) {
        config = {}
      }
      config.url = url
    } else {
      config = url
    }
    config = mergeConfig(this.defaults, config)
    const chain: PromiseChain<any>[] = [
      {
        resolved: dispatchRequest,
        rejected: undefined
      }
    ]
    this.interceptors.request.forEach(interceptor => {
      chain.unshift(interceptor)
    })
    this.interceptors.response.forEach(interceptor => {
      chain.push(interceptor)
    })
    let promise = Promise.resolve(config)

    while (chain.length) {
      const { resolved, rejected } = chain.shift()!
      promise = promise.then(resolved, rejected)
    }
    return promise
  }
  get(url: string, config?: AxiosRequestConfig): AxiosPromise {
    return this._requestMethodWidthoutData('get', url, config)
  }
  delete(url: string, config?: AxiosRequestConfig): AxiosPromise {
    return this._requestMethodWidthoutData('delete', url, config)
  }
  head(url: string, config?: AxiosRequestConfig): AxiosPromise {
    return this._requestMethodWidthoutData('head', url, config)
  }
  options(url: string, config?: AxiosRequestConfig): AxiosPromise {
    return this._requestMethodWidthoutData('options', url, config)
  }
  post(url: string, data?: any, config?: AxiosRequestConfig): AxiosPromise {
    return this._requestMethodWidthData('post', url, data, config)
  }
  put(url: string, data?: any, config?: AxiosRequestConfig): AxiosPromise {
    return this._requestMethodWidthData('put', url, data, config)
  }
  patch(url: string, data?: any, config?: AxiosRequestConfig): AxiosPromise {
    return this._requestMethodWidthData('patch', url, data, config)
  }
  getUri(config?: AxiosRequestConfig): string {
    config = mergeConfig(this.defaults, config)
    return transformURL(config)
  }
  _requestMethodWidthoutData(
    method: Method,
    url: string,
    config?: AxiosRequestConfig
  ): AxiosPromise {
    return this.request(
      Object.assign(config || {}, {
        method,
        url
      })
    )
  }
  _requestMethodWidthData(
    method: Method,
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): AxiosPromise {
    return this.request(
      Object.assign(config || {}, {
        method,
        url,
        data
      })
    )
  }
}
