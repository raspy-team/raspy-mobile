// 타입이 붙은 API 호출. 주소·경로 변수·요청 본문·응답 모양을 백엔드 OpenAPI 문서(schema.d.ts)로 검사한다.
// 새 코드는 이걸 쓴다. 기존 api.get('...') 호출은 scripts/check-api.mjs가 주소만 검사한다.
//
//   const { data } = await GET('/api/games/{id}/detail', { path: { id: 3 } })
//   await POST('/api/reports', { body: { targetType: 'GAME', targetId: 3, reason: '...' } })
//
// 백엔드가 바뀌면 `npm run api:sync`로 문서와 타입을 다시 받는다.
import api from './api'
import type { paths } from './schema'

type Method = 'get' | 'post' | 'put' | 'patch' | 'delete'
type PathsWith<M extends Method> = {
  [P in keyof paths]: paths[P] extends Record<M, object> ? P : never
}[keyof paths]

type Op<P extends keyof paths, M extends Method> = paths[P] extends Record<M, infer O> ? O : never
type PathParams<O> = O extends { parameters: { path: infer T } } ? T : never
type QueryParams<O> = O extends { parameters: { query?: infer T } } ? T : never
type Body<O> = O extends { requestBody?: { content: { 'application/json': infer T } } } ? T : never
type Ok<O> = O extends { responses: { 200: { content: { '*/*': infer T } } } }
  ? T
  : O extends { responses: { 200: { content: { 'application/json': infer T } } } }
    ? T
    : unknown

type Options<O> = ([PathParams<O>] extends [never] ? { path?: never } : { path: PathParams<O> }) & {
  query?: QueryParams<O>
  body?: Body<O>
}

function toUrl(path: string, params?: Record<string, unknown>) {
  return path.replace(/\{(\w+)\}/g, (_, key) => encodeURIComponent(String(params?.[key])))
}

function call<M extends Method>(method: M) {
  return async <P extends PathsWith<M>>(path: P, options?: Options<Op<P, M>>): Promise<{ data: Ok<Op<P, M>> }> => {
    const opts = (options ?? {}) as { path?: Record<string, unknown>; query?: object; body?: unknown }
    const res = await api.request({
      method,
      url: toUrl(path as string, opts.path),
      params: opts.query,
      data: opts.body,
    })
    return { data: res.data }
  }
}

export const GET = call('get')
export const POST = call('post')
export const PUT = call('put')
export const PATCH = call('patch')
export const DELETE = call('delete')
