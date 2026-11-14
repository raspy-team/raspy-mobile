// 실패의 까닭: 서버가 말해 준 까닭(해요체로 다듬어 온다)이 있으면 그것을, 없으면(연결 끊김 등) 화면이 준비한 말을 쓴다 (quality-rules B-3)
export const why = (e: unknown, fallback: string): string =>
  (e as { response?: { data?: { message?: string } } } | null)?.response?.data?.message || fallback
