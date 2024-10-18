export class WavEncoder {
    private sampleRate: number
    private channels: number
    private samples: Float32Array | Float32Array[]

    constructor(
        audioData: Float32Array | Float32Array[],
        options: { sampleRate: number; channels: number }
    ) {
        this.sampleRate = options.sampleRate
        this.channels = options.channels
        this.samples = audioData
    }

    getData() {
        const dataLength = Array.isArray(this.samples)
            ? this.samples[0].length * this.channels
            : this.samples.length
        const buffer = new ArrayBuffer(44 + dataLength * 2)
        const view = new DataView(buffer)

        this.writeString(view, 0, 'RIFF')
        view.setUint32(4, 36 + dataLength * 2, true)
        this.writeString(view, 8, 'WAVE')
        this.writeString(view, 12, 'fmt ')
        view.setUint32(16, 16, true)
        view.setUint16(20, 1, true)
        view.setUint16(22, this.channels, true)
        view.setUint32(24, this.sampleRate, true)
        view.setUint32(28, this.sampleRate * this.channels * 2, true)
        view.setUint16(32, this.channels * 2, true)
        view.setUint16(34, 16, true)
        this.writeString(view, 36, 'data')
        view.setUint32(40, dataLength * 2, true)

        if (Array.isArray(this.samples)) {
            this.floatTo16BitPCMStereo(view, 44, this.samples[0], this.samples[1])
        } else {
            this.floatTo16BitPCMMono(view, 44, this.samples)
        }

        return buffer
    }

    private writeString(view: DataView, offset: number, string: string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i))
        }
    }

    private floatTo16BitPCMMono(output: DataView, offset: number, input: Float32Array) {
        for (let i = 0; i < input.length; i++, offset += 2) {
            const s = Math.max(-1, Math.min(1, input[i]))
            output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
        }
    }

    private floatTo16BitPCMStereo(
        output: DataView,
        offset: number,
        inputL: Float32Array,
        inputR: Float32Array
    ) {
        for (let i = 0; i < inputL.length; i++, offset += 4) {
            const sL = Math.max(-1, Math.min(1, inputL[i]))
            const sR = Math.max(-1, Math.min(1, inputR[i]))
            output.setInt16(offset, sL < 0 ? sL * 0x8000 : sL * 0x7fff, true)
            output.setInt16(offset + 2, sR < 0 ? sR * 0x8000 : sR * 0x7fff, true)
        }
    }
}
