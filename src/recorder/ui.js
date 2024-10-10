import { convertToMp3 } from '../encoder'
import { stopRecording, toggleRecording } from './controls'

let wavesurfer

export function initWavesurfer(WaveSurfer) {
    wavesurfer = WaveSurfer.create({
        container: '#waveform',
        waveColor: 'violet',
        progressColor: 'purple',
        cursorColor: 'navy',
        height: 100,
        responsive: true,
    })
    hideWaveform()
}

export function updateWavesurfer(audioBlob) {
    const audioUrl = URL.createObjectURL(audioBlob)
    wavesurfer.load(audioUrl)
    showWaveform()
}

export function resetRecordButton(type) {
    const button = document.getElementById(`recorder__${type}__button`)
    button.textContent = 'Record'
    button.classList.remove('danger')
    button.classList.add('primary')
}

export function updateDownloadLinkUI(blob, mimeType) {
    const audioUrl = URL.createObjectURL(blob)
    showRecordingResult(audioUrl, mimeType.split('/')[1])
}

export async function updateDownloadLink(recordedBlob) {
    let finalBlob = recordedBlob
    let mimeType = 'audio/webm'

    switch (document.getElementById('formatSelect').value) {
        case 'mp3':
            return convertToMp3(finalBlob)
        case 'wav':
            finalBlob = await convertToWav(recordedBlob)
            mimeType = 'audio/wav'
            break
        default:
            mimeType = 'audio/webm'
    }

    updateDownloadLinkUI(finalBlob, mimeType)
    updateWavesurfer(finalBlob)
}

export function showRecordingResult(audioUrl, format) {
    const result = document.createElement('div')
    result.className = 'result'

    const downloadLink = document.createElement('a')
    downloadLink.href = audioUrl
    downloadLink.download = `recorded_audio.${format}`
    downloadLink.className = 'extension-button success'
    downloadLink.textContent = 'Download'

    const playButton = document.createElement('button')
    playButton.textContent = 'Play'
    playButton.className = 'extension-button primary'
    playButton.onclick = () => {
        if (wavesurfer.isPlaying()) {
            wavesurfer.pause()
            playButton.textContent = 'Play'
        } else {
            wavesurfer.play()
            playButton.textContent = 'Pause'
        }
    }

    const stopButton = document.createElement('button')
    stopButton.textContent = 'Stop'
    stopButton.className = 'extension-button danger'
    stopButton.onclick = () => {
        wavesurfer.stop()
        playButton.textContent = 'Play'
    }

    result.appendChild(downloadLink)
    result.appendChild(playButton)
    result.appendChild(stopButton)

    const recorder = document.querySelector('.recorder')
    recorder.innerHTML = ''
    recorder.appendChild(result)

    console.log('loading wavesurfer url: ', audioUrl)
    // Update Wavesurfer
    wavesurfer.load(audioUrl)

    // Update play button text when playback ends
    wavesurfer.on('finish', () => {
        playButton.textContent = 'Play'
    })

    console.log('show waveform')
    showWaveform()
}

export function showRecordingProgress() {
    const recorder = document.querySelector('.recorder')
    const progressDiv = document.createElement('div')
    progressDiv.id = 'recordingProgress'
    progressDiv.textContent = 'Recording in progress...'

    const stopButton = document.createElement('button')
    stopButton.textContent = 'Stop Recording'
    stopButton.className = 'extension-button danger'
    stopButton.onclick = stopRecording

    const discardButton = document.createElement('button')
    discardButton.textContent = 'Discard Recording'
    discardButton.className = 'extension-button warning'
    discardButton.onclick = () => toggleRecording(null, null, true)

    recorder.appendChild(progressDiv)
    recorder.appendChild(stopButton)
    recorder.appendChild(discardButton)

    showWaveform()
}

export function updateRecordingProgress(chunksCount) {
    const progressDiv = document.getElementById('recordingProgress')
    if (progressDiv) {
        progressDiv.textContent = `Recording in progress: ${chunksCount} chunks`
    }
}

export function updateRecordingButtonState(isRecording, isPaused, type) {
    const button = document.getElementById(`recorder__${type}__button`)
    if (!isRecording) {
        button.textContent = 'Record'
        button.classList.remove('danger', 'warning')
        button.classList.add('primary')
        return
    }
    if (isPaused) {
        button.textContent = 'Resume'
        button.classList.remove('danger', 'primary')
        button.classList.add('warning')
        return
    }
    button.textContent = 'Pause'
    button.classList.remove('primary', 'warning')
    button.classList.add('danger')
}

export function hideWaveform() {
    const waveformContainer = document.getElementById('progress')
    waveformContainer.style.display = 'none'
}

export function showWaveform() {
    const waveformContainer = document.getElementById('progress')
    waveformContainer.style.display = 'block'
}
