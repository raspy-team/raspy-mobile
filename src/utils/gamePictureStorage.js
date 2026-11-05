/**
 * 경기 사진 저장/조회를 위한 유틸리티
 * gameId별로 촬영한 사진들을 IndexedDB에 저장/관리 (대용량 동영상 지원)
 */

const DB_NAME = 'GameMediaDB'
const DB_VERSION = 1
const STORE_NAME = 'gameMedia'

// IndexedDB 초기화
let dbInstance = null

async function getDB() {
  if (dbInstance) return dbInstance

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      console.error('IndexedDB open error:', request.error)
      reject(request.error)
    }

    request.onsuccess = () => {
      dbInstance = request.result
      resolve(dbInstance)
    }

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        objectStore.createIndex('gameId', 'gameId', { unique: false })
        objectStore.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
  })
}

/**
 * 특정 경기의 사진/동영상 목록 조회
 * @param {string|number} gameId
 * @returns {Promise<Array<{id: string, dataUrl: string, timestamp: number, type: 'image'|'video', duration?: number}>>}
 */
export async function getGamePictures(gameId) {
  try {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const objectStore = transaction.objectStore(STORE_NAME)
      const index = objectStore.index('gameId')
      const request = index.getAll(String(gameId))

      request.onsuccess = () => {
        const results = request.result || []
        // timestamp 순으로 정렬
        results.sort((a, b) => a.timestamp - b.timestamp)
        resolve(results)
      }

      request.onerror = () => {
        console.error('Failed to get game pictures:', request.error)
        reject(request.error)
      }
    })
  } catch (error) {
    console.error('Failed to get game pictures:', error)
    return []
  }
}

/**
 * 특정 경기에 사진 추가
 * @param {string|number} gameId
 * @param {string} dataUrl - base64 이미지 데이터
 * @returns {Promise<Array<{id: string, dataUrl: string, timestamp: number, type: 'image'}>>} 업데이트된 사진 목록
 */
export async function addGamePicture(gameId, dataUrl) {
  try {
    const db = await getDB()
    const newPicture = {
      id: `pic_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      gameId: String(gameId),
      dataUrl,
      timestamp: Date.now(),
      type: 'image'
    }

    await new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const objectStore = transaction.objectStore(STORE_NAME)
      const request = objectStore.add(newPicture)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    return await getGamePictures(gameId)
  } catch (error) {
    console.error('Failed to add game picture:', error)
    if (error.name === 'QuotaExceededError') {
      throw new Error('QUOTA_EXCEEDED')
    }
    throw error
  }
}

/**
 * 특정 경기에 동영상 추가
 * @param {string|number} gameId
 * @param {string} dataUrl - base64 동영상 데이터
 * @param {number} duration - 동영상 길이 (초)
 * @returns {Promise<Array<{id: string, dataUrl: string, timestamp: number, type: 'video', duration: number}>>} 업데이트된 목록
 */
export async function addGameVideo(gameId, dataUrl, duration) {
  try {
    const db = await getDB()
    const newVideo = {
      id: `vid_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      gameId: String(gameId),
      dataUrl,
      timestamp: Date.now(),
      type: 'video',
      duration
    }

    await new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const objectStore = transaction.objectStore(STORE_NAME)
      const request = objectStore.add(newVideo)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    return await getGamePictures(gameId)
  } catch (error) {
    console.error('Failed to add game video:', error)
    if (error.name === 'QuotaExceededError') {
      throw new Error('QUOTA_EXCEEDED')
    }
    throw error
  }
}

/**
 * 특정 경기의 사진 삭제
 * @param {string|number} gameId
 * @param {string} pictureId
 * @returns {Promise<Array<{id: string, dataUrl: string, timestamp: number}>>} 업데이트된 사진 목록
 */
export async function removeGamePicture(gameId, pictureId) {
  try {
    const db = await getDB()
    await new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const objectStore = transaction.objectStore(STORE_NAME)
      const request = objectStore.delete(pictureId)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    return await getGamePictures(gameId)
  } catch (error) {
    console.error('Failed to remove game picture:', error)
    throw error
  }
}

/**
 * 동영상 압축 및 길이 제한 (최대 2분)
 * WebView 호환을 위해 단순하게 파일을 base64로 변환
 * @param {File} videoFile - 동영상 파일
 * @param {number} maxDuration - 최대 길이 (초, 기본 120)
 * @returns {Promise<{dataUrl: string, duration: number}>} base64 동영상과 길이
 */
export function compressVideo(videoFile, maxDuration = 120) {
  return new Promise((resolve, reject) => {
    // 파일 크기 체크 (50MB 제한)
    if (videoFile.size > 50 * 1024 * 1024) {
      reject(new Error('Video file too large (max 50MB)'))
      return
    }

    const video = document.createElement('video')
    video.preload = 'metadata'

    video.onloadedmetadata = () => {
      const duration = video.duration
      URL.revokeObjectURL(video.src)

      // 2분 초과 경고 (하지만 그대로 저장)
      if (duration > maxDuration) {
        console.warn(`Video duration (${duration}s) exceeds max duration (${maxDuration}s)`)
      }

      // 파일을 base64로 변환
      const reader = new FileReader()
      reader.onloadend = () => {
        resolve({
          dataUrl: reader.result,
          duration: Math.min(duration, maxDuration)
        })
      }
      reader.onerror = () => {
        reject(new Error('Failed to read video file'))
      }
      reader.readAsDataURL(videoFile)
    }

    video.onerror = () => {
      reject(new Error('Failed to load video metadata'))
    }

    video.src = URL.createObjectURL(videoFile)
  })
}
