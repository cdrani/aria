import { convertToMp3 } from '../encoder'
import { stopRecording } from './controls'

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
}

export function showRecordingResult(audioUrl, format) {
    const result = document.createElement('div')
    result.className = 'result'

    const audio = document.createElement('audio')
    audio.controls = true
    audio.src = audioUrl

    const downloadLink = document.createElement('a')
    downloadLink.href = audioUrl
    downloadLink.download = `recorded_audio.${format}`
    downloadLink.className = 'extension-button success'
    downloadLink.textContent = 'Download'

    result.appendChild(audio)
    result.appendChild(downloadLink)

    const recorder = document.querySelector('.recorder')
    recorder.innerHTML = ''
    recorder.appendChild(result)
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
    discardButton.onclick = () => toggleRecording(recordingType, null, true)

    recorder.appendChild(progressDiv)
    recorder.appendChild(stopButton)
    recorder.appendChild(discardButton)
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
