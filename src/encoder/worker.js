self.onmessage = e => {
    switch (e.data.action) {
        case 'init':
            try {
                importScripts(e.data.lameUrl)
            } catch (err) {
                self.postMessage({
                    action: 'error',
                    message: `Failed to import LAME.js: ${err.message}`,
                })
            }
            break

        case 'convertToMp3': {
            const { sampleRate, leftChannelData, rightChannelData, bitrate } = e.data
            const mp3encoder = new lamejs.Mp3Encoder(rightChannelData ? 2 : 1, sampleRate, bitrate)
            const mp3Data = []
            const sampleBlockSize = 1152

            // Convert Float32Array to Int16Array
            const leftChannel = new Int16Array(leftChannelData.length)
            const rightChannel = rightChannelData ? new Int16Array(rightChannelData.length) : null

            for (let i = 0; i < leftChannelData.length; i++) {
                // Convert float to int16
                leftChannel[i] = Math.max(
                    -32_768,
                    Math.min(32_767, Math.round(leftChannelData[i] * 32_768))
                )
                if (rightChannelData) {
                    rightChannel[i] = Math.max(
                        -32_768,
                        Math.min(32_767, Math.round(rightChannelData[i] * 32_768))
                    )
                }
            }

            for (let i = 0; i < leftChannel.length; i += sampleBlockSize) {
                const leftChunk = leftChannel.subarray(i, i + sampleBlockSize)
                const mp3buf = rightChannel
                    ? mp3encoder.encodeBuffer(
                          leftChunk,
                          rightChannel.subarray(i, i + sampleBlockSize)
                      )
                    : mp3encoder.encodeBuffer(leftChunk)

                if (mp3buf.length > 0) {
                    mp3Data.push(mp3buf)
                }
            }

            const mp3buf = mp3encoder.flush()
            if (mp3buf.length > 0) mp3Data.push(mp3buf)

            self.postMessage(
                { action: 'mp3Converted', data: mp3Data },
                mp3Data.map(buffer => buffer.buffer)
            )

            mp3encoder.close?.()
            cleanWorkerMemory(leftChannelData, rightChannelData)
            break
        }

        default:
            self.postMessage({ action: 'error', message: 'Unknown action received' })
            break
    }
}

// Helper function to clear buffers and free memory in worker
function cleanWorkerMemory(leftChannelData, rightChannelData) {
    leftChannelData = null
    if (rightChannelData) rightChannelData = null
}
