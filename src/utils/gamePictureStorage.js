/**
 * 게임 사진 저장/조회를 위한 유틸리티
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
 * 특정 게임의 사진/동영상 목록 조회
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
 * 특정 게임에 사진 추가
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
 * 특정 게임에 동영상 추가
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
 * 특정 게임의 사진 삭제
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
 * 특정 게임의 사진 순서 업데이트
 * @param {string|number} gameId
 * @param {Array<{id: string, dataUrl: string, timestamp: number}>} orderedPictures
 */
export async function updateGamePicturesOrder(gameId, orderedPictures) {
  try {
    const db = await getDB()
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const objectStore = transaction.objectStore(STORE_NAME)

    // timestamp를 새로운 순서에 맞게 업데이트
    const promises = orderedPictures.map((picture, index) => {
      return new Promise((resolve, reject) => {
        const updatedPicture = {
          ...picture,
          gameId: String(gameId),
          timestamp: Date.now() + index // 순서대로 timestamp 부여
        }
        const request = objectStore.put(updatedPicture)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    })

    await Promise.all(promises)
  } catch (error) {
    console.error('Failed to update pictures order:', error)
    throw error
  }
}

/**
 * 특정 게임의 모든 사진 삭제
 * @param {string|number} gameId
 */
export async function clearGamePictures(gameId) {
  try {
    const db = await getDB()
    const pictures = await getGamePictures(gameId)

    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const objectStore = transaction.objectStore(STORE_NAME)

    const promises = pictures.map((picture) => {
      return new Promise((resolve, reject) => {
        const request = objectStore.delete(picture.id)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    })

    await Promise.all(promises)
  } catch (error) {
    console.error('Failed to clear game pictures:', error)
    throw error
  }
}

/**
 * base64를 File 객체로 변환
 * @param {string} dataUrl
 * @param {string} filename
 * @returns {File}
 */
export function dataUrlToFile(dataUrl, filename = 'image.jpg') {
  const arr = dataUrl.split(',')
  const mime = arr[0].match(/:(.*?);/)[1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new File([u8arr], filename, { type: mime })
}

/**
 * 이미지 압축 (크기 최적화)
 * @param {string} dataUrl
 * @param {number} maxWidth - 최대 너비 (기본 800)
 * @param {number} quality - 품질 0~1 (기본 0.3)
 * @returns {Promise<string>} 압축된 base64 이미지
 */
export function compressImage(dataUrl, maxWidth = 800, quality = 0.3) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let width = img.width
      let height = img.height

      // 최대 너비 제한
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }

      // 최대 높이도 제한 (긴 세로 이미지 대응)
      const maxHeight = 800
      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }

      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = dataUrl
  })
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

/**
 * 동영상을 Blob으로 변환 (간단한 방식 - 실제로는 그냥 File을 base64로 변환)
 * @param {File} videoFile
 * @param {number} maxDuration - 최대 길이 (초)
 * @returns {Promise<{dataUrl: string, duration: number}>}
 */
export function convertVideoToBase64(videoFile, maxDuration = 120) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src)

      const actualDuration = Math.min(video.duration, maxDuration)

      // 동영상이 2분 이하면 그냥 변환
      if (video.duration <= maxDuration) {
        const reader = new FileReader()
        reader.onloadend = () => {
          resolve({
            dataUrl: reader.result,
            duration: actualDuration
          })
        }
        reader.onerror = reject
        reader.readAsDataURL(videoFile)
      } else {
        // 2분을 초과하면 압축 필요
        reject(new Error('Video exceeds maximum duration'))
      }
    }

    video.onerror = () => {
      reject(new Error('Failed to load video metadata'))
    }

    video.src = URL.createObjectURL(videoFile)
  })
}
