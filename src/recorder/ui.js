import { convertToWav } from './converters'
import { stopRecording, toggleRecording } from './controls'
import { convertToMp3, cleanupResources } from '../encoder'

let wavesurfer
let originalRecordedBlob = null

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

export function updateWavesurfer(audioUrl) {
    wavesurfer.load(audioUrl)
}

export function resetRecordButton(type) {
    const button = document.getElementById(`recorder__${type}__button`)
    if (!button) return
    button.textContent = 'Record'
    button.classList.remove('danger')
    button.classList.add('primary')
}

export function updateDownloadLinkUI(blob, format) {
    const audioUrl = URL.createObjectURL(blob)
    setDownloadLink(audioUrl, format)
}

export async function updateDownloadLink(recordedBlob) {
    if (recordedBlob) {
        originalRecordedBlob = recordedBlob
    }

    if (!originalRecordedBlob) return

    const { format, quality } = await new Promise(resolve =>
        chrome.runtime.sendMessage({ action: 'GET_SETTINGS' }, resolve)
    )

    let finalBlob = originalRecordedBlob

    switch (format) {
        case 'mp3':
            return convertToMp3(originalRecordedBlob, quality)
        case 'wav':
            finalBlob = await convertToWav(originalRecordedBlob)
            break
    }

    updateDownloadLinkUI(finalBlob, format)
}

export function setDownloadLink(audioUrl, format) {
    const downloadLink = document.getElementById('downloadLink') || document.createElement('a')
    downloadLink.id = 'downloadLink'

    downloadLink.href = audioUrl
    downloadLink.className = 'extension-button success'
    downloadLink.textContent = 'Download'

    downloadLink.addEventListener(
        'click',
        () => {
            const title = document.getElementById('title-content').value || 'recorded_audio'
            downloadLink.download = `${title}.${format}`

            setTimeout(cleanupResources, 1000)
        },
        { once: false }
    )
    return downloadLink
}

export function showRecordingResult(audioUrl, format) {
    const result = document.createElement('div')
    result.className = 'result'

    const downloadLink = setDownloadLink(audioUrl, format)

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

    wavesurfer.load(audioUrl)
    wavesurfer.on('finish', () => (playButton.textContent = 'Play'))
}

export function showRecordingProgress() {
    const progressContainer = document.getElementById('progress')
    const progressUI = document.createElement('div')
    progressUI.id = 'progress-ui'

    const progressDiv = document.createElement('div')
    progressDiv.id = 'recordingProgress'
    progressDiv.textContent = 'Recording in progress...'
    progressDiv.style.color = 'white'

    const progressGroup = document.createElement('div')
    progressGroup.className = 'progress-group'

    const stopButton = document.createElement('button')
    stopButton.textContent = 'Stop'
    stopButton.className = 'extension-button danger'
    stopButton.onclick = stopRecording

    const discardButton = document.createElement('button')
    discardButton.textContent = 'Discard'
    discardButton.className = 'extension-button warning'
    discardButton.onclick = () => toggleRecording(null, null, true)

    progressGroup.appendChild(stopButton)
    progressGroup.appendChild(discardButton)

    progressUI.appendChild(progressDiv)
    progressUI.appendChild(progressGroup)

    progressContainer.appendChild(progressUI)

    showWaveform()
}

export function updateRecordingProgress(duration) {
    const progressDiv = document.getElementById('recordingProgress')
    if (progressDiv) {
        const formattedDuration = formatDuration(duration)
        progressDiv.textContent = `Recording Length: ${formattedDuration}`
    }
}

function formatDuration(durationInSeconds) {
    const hours = Math.floor(durationInSeconds / 3600)
    const minutes = Math.floor((durationInSeconds % 3600) / 60)
    const seconds = Math.floor(durationInSeconds % 60)

    return hours > 0
        ? `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
              .toString()
              .padStart(2, '0')}`
        : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export function updateRecordingButtonState({ isRecording, isPaused, type }) {
    const button = document.getElementById(`recorder__${type}__button`)
    if (!button) return

    button.textContent = !isRecording ? 'Record' : isPaused ? 'Resume' : 'Pause'
    const classesToRemove = !isRecording
        ? ['danger', 'warning']
        : isPaused
        ? ['danger', 'primary']
        : ['primary', 'warning']
    button.classList.remove(...classesToRemove)
    const classToAdd = !isRecording ? 'primary' : isPaused ? 'warning' : 'danger'
    button.classList.add(classToAdd)
}

export function hideWaveform() {
    const waveformContainer = document.getElementById('waveform')
    if (waveformContainer) waveformContainer.style.display = 'none'
}

export function showWaveform() {
    const waveformContainer = document.getElementById('waveform')
    if (waveformContainer) waveformContainer.style.display = 'block'
}

export function setOriginalRecordedBlob(blob) {
    originalRecordedBlob = blob
}

export function getOriginalRecordedBlob() {
    return originalRecordedBlob
}

export function resetOriginalRecordedBlob() {
    originalRecordedBlob = null
}
