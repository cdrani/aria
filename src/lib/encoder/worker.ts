self.onmessage = (e) => {
    const { audioData, sampleRate, numberOfChannels, format, quality } = e.data
    if (e.data?.action == 'setup') {
        try {
            importScripts(e.data.lamejsUrl)
        } catch (error) {
            self.postMessage({ error: `Error importing lamejs: ${(error as Error).message}` })
        }
    } else {
        switch (format) {
            case 'mp3':
                encodeMp3(audioData, sampleRate, numberOfChannels, quality)
                break
            case 'wav':
                encodeWav(audioData, sampleRate, numberOfChannels)
                break
            default:
                self.postMessage({ error: 'Unsupported format' })
        }
    }
}

function encodeMp3(
    audioData: Float32Array[],
    sampleRate: number,
    numberOfChannels: number,
    quality: number
) {
    try {
        const mp3encoder = new lamejs.Mp3Encoder(numberOfChannels, sampleRate, quality)
        const mp3Data = []

        const sampleBlockSize = 1152
        const leftChannel = new Int16Array(audioData[0].length)
        const rightChannel = numberOfChannels > 1 ? new Int16Array(audioData[1].length) : null

        for (let i = 0; i < leftChannel.length; i++) {
            const leftSample = Math.max(-1, Math.min(1, audioData[0][i])) * 0x7fff
            leftChannel[i] = Math.max(-32768, Math.min(32767, leftSample))
            if (rightChannel) {
                const rightSample = Math.max(-1, Math.min(1, audioData[1][i])) * 0x7fff
                rightChannel[i] = Math.max(-32768, Math.min(32767, rightSample))
            }
        }

        for (let i = 0; i < leftChannel.length; i += sampleBlockSize) {
            const leftChunk = leftChannel.subarray(i, i + sampleBlockSize)
            const mp3buf = rightChannel
                ? mp3encoder.encodeBuffer(leftChunk, rightChannel.subarray(i, i + sampleBlockSize))
                : mp3encoder.encodeBuffer(leftChunk)

            if (mp3buf.length > 0) {
                mp3Data.push(mp3buf)
            }
        }

        const mp3buf = mp3encoder.flush()
        if (mp3buf.length > 0) mp3Data.push(mp3buf)

        const blob = new Blob(mp3Data, { type: 'audio/mp3' })
        self.postMessage({ blob })
    } catch (error) {
        self.postMessage({ error: `Error encoding MP3: ${(error as Error).message}` })
    }
}

function encodeWav(audioData: Float32Array[], sampleRate: number, numberOfChannels: number) {
    try {
        const length = audioData[0].length
        const buffer = new ArrayBuffer(44 + length * numberOfChannels * 2)
        const view = new DataView(buffer)

        // Write WAV header
        writeString(view, 0, 'RIFF')
        view.setUint32(4, 36 + length * numberOfChannels * 2, true)
        writeString(view, 8, 'WAVE')
        writeString(view, 12, 'fmt ')
        view.setUint32(16, 16, true)
        view.setUint16(20, 1, true)
        view.setUint16(22, numberOfChannels, true)
        view.setUint32(24, sampleRate, true)
        view.setUint32(28, sampleRate * numberOfChannels * 2, true)
        view.setUint16(32, numberOfChannels * 2, true)
        view.setUint16(34, 16, true)
        writeString(view, 36, 'data')
        view.setUint32(40, length * numberOfChannels * 2, true)

        // Write audio data
        floatTo16BitPCM(view, 44, audioData)

        const blob = new Blob([buffer], { type: 'audio/wav' })
        self.postMessage({ blob })
    } catch (error) {
        self.postMessage({ error: `Error encoding WAV: ${(error as Error).message}` })
    }
}

function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
    }
}

function floatTo16BitPCM(output: DataView, offset: number, input: Float32Array[]) {
    for (let i = 0; i < input[0].length; i++) {
        for (const element of input) {
            const sample = Math.max(-1, Math.min(1, element[i]))
            output.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
            offset += 2
        }
    }
}
