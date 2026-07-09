/**
 * Reads an image file, downsizes it to fit within maxDimension x maxDimension,
 * and returns a compressed JPEG data URL. Keeps avatar uploads small enough
 * to store as base64 in the database/localStorage without hitting size limits.
 */
export function compressImage(file, { maxDimension = 320, quality = 0.85 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file (JPG, PNG, etc.)'))
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      reject(new Error('Image is too large. Please choose a file under 8MB.'))
      return
    }

    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the selected file'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Could not load the selected image'))
      img.onload = () => {
        let { width, height } = img
        if (width > height && width > maxDimension) {
          height = Math.round((height * maxDimension) / width)
          width = maxDimension
        } else if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height)
          height = maxDimension
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}
