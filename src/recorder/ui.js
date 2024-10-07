import { convertToMp3 } from '../encoder'

export function resetRecordButton(type) {
    const button = document.getElementById(`recorder__${type}__button`);
    button.textContent = 'Record';
    button.classList.remove('danger');
    button.classList.add('primary');
}

export function updateDownloadLinkUI(blob, mimeType) {
    const audioUrl = URL.createObjectURL(blob)
    showRecordingResult(audioUrl, mimeType.split('/')[1])
}

export async function updateDownloadLink(recordedBlob) {
    let finalBlob = recordedBlob
    let mimeType = 'audio/webm'

    // Handle format conversion if needed (mp3, wav, etc.)
    switch (document.getElementById('formatSelect').value) {
        case 'mp3':
            return await convertToMp3(finalBlob)
            // Mp3 conversion is handled async via worker
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
    recorder.appendChild(progressDiv)
}

export function updateRecordingProgress(chunksCount) {
    const progressDiv = document.getElementById('recordingProgress')
    if (progressDiv) {
        progressDiv.textContent = `Recording in progress: ${chunksCount} chunks`
    }
}
