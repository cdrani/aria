self.onmessage = e => {
    if (e.data.action === 'init') {
        importScripts(e.data.lameUrl)
        lamejs = self.lamejs // Store the lamejs object globally in the worker
    } else if (e.data.action === 'convertToMp3') {
        convertToMp3(e.data.sampleRate, e.data.channelData)
    }
}

function convertToMp3(sampleRate, channelData) {
    const mp3Encoder = new lamejs.Mp3Encoder(1, sampleRate, 128)
    const mp3Data = []

    const sampleBlockSize = 1152
    const samples = new Int16Array(sampleBlockSize)

    for (let i = 0; i < channelData.length; i += sampleBlockSize) {
        for (let j = 0; j < sampleBlockSize && i + j < channelData.length; j++) {
            const sample = Math.max(-1, Math.min(1, channelData[i + j]))
            samples[j] = sample < 0 ? sample * 0x80_00 : sample * 0x7f_ff
        }
        const mp3buf = mp3Encoder.encodeBuffer(samples)
        if (mp3buf.length > 0) {
            mp3Data.push(new Int8Array(mp3buf))
        }
    }

    const mp3buf = mp3Encoder.flush()
    if (mp3buf.length > 0) {
        mp3Data.push(new Int8Array(mp3buf))
    }

    self.postMessage({ action: 'mp3Converted', data: mp3Data })
}
