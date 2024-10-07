import { setupUI } from './ui'
import { updateTabInfo } from './ui/tab'
import { initEncoderWorker } from './encoder'
import { toggleRecording } from './recorder/controls'

let originalTab = null

document.addEventListener('DOMContentLoaded', async () => {
    setupUI()
    initEncoderWorker()

    chrome.runtime.sendMessage({ action: 'GET_ORIGINAL_TAB' }, tab => {
        originalTab = tab
        updateTabInfo(originalTab)
    })

    // Set up format change listener
    const formatSelect = document.getElementById('formatSelect')
    formatSelect.addEventListener('change', updateSettings)

    // Set up recording buttons
    const tabRecordButton = document.getElementById('recorder__tab__button')
    const micRecordButton = document.getElementById('recorder__microphone__button')

    tabRecordButton.addEventListener('click', () => toggleRecording('tab', originalTab))
    micRecordButton.addEventListener('click', () => toggleRecording('microphone'))
})

function updateSettings() {
    const includeSystemAudio = document.getElementById('settingsCheckbox').checked
    const format = document.getElementById('formatSelect').value

    // Send updated settings to background script
    chrome.runtime.sendMessage({
        action: 'UPDATE_SETTINGS',
        data: { includeSystemAudio, format },
    })
}

// Other related functions and message handlers can be included here
// let originalTab = null
// let isRecording = false
// let recordingType = 'tab' // 'tab' or 'microphone'
// let audioStream = null
// let mediaRecorder = null
// let audioChunks = []
// let selectedFormat = 'webm' // Add this at the top of your file
// let recordedBlob = null
// let encoderWorker = null

// function initEncoderWorker() {
//     if (encoderWorker) return

//     const workerUrl = chrome.runtime.getURL('/src/worker.js')
//     const lameUrl = chrome.runtime.getURL('/lib/lamejs.min.js')
//     encoderWorker = new Worker(workerUrl)
//     encoderWorker.postMessage({ action: 'init', lameUrl })
//     encoderWorker.onmessage = handleWorkerMessage
// }

// function handleWorkerMessage(e) {
//     if (e.data.action === 'mp3Converted') {
//         const mp3Blob = new Blob(e.data.data, { type: 'audio/mpeg' })
//         updateDownloadLinkUI(mp3Blob, 'audio/mpeg')
//     }
// }

// document.addEventListener('DOMContentLoaded', () => {
//     const root = document.getElementById('root')
//     const extension = createExtension()
//     root.appendChild(extension)
//     initExtension()
// })

// function createExtension() {
//     const extension = document.createElement('div')
//     extension.className = 'extension'
//     extension.appendChild(createContent())
//     return extension
// }

// function createContent() {
//     const content = document.createElement('div')
//     content.className = 'content'
//     content.appendChild(createTabInfo())
//     content.appendChild(createSettings())
//     content.appendChild(createRecorder())
//     return content
// }

// function createTabInfo() {
//     const tabInfo = document.createElement('div')
//     tabInfo.className = 'tab-info'

//     const urlItem = createTabInfoItem('URL', 'url-content')
//     const titleItem = createTabInfoItem('Title', 'title-content')

//     tabInfo.appendChild(urlItem)
//     tabInfo.appendChild(titleItem)

//     return tabInfo
// }

// function createTabInfoItem(title, contentId) {
//     const item = document.createElement('div')
//     item.className = 'tab-info__item'

//     const titleSpan = document.createElement('span')
//     titleSpan.className = 'tab-info__item__title'
//     titleSpan.textContent = `${title}:`

//     const content = document.createElement('div')
//     content.className = 'tab-info__item__content'

//     if (contentId === 'title-content') {
//         const contentInput = document.createElement('input')
//         contentInput.id = contentId
//         contentInput.type = 'text'
//         contentInput.value = originalTab ? originalTab.title : ''
//         content.appendChild(contentInput)
//     } else {
//         const contentSpan = document.createElement('span')
//         contentSpan.id = contentId
//         content.appendChild(contentSpan)
//     }

//     item.appendChild(titleSpan)
//     item.appendChild(content)

//     return item
// }

// function createSettings() {
//     const settings = document.createElement('div')
//     settings.className = 'settings'

//     const systemAudioCheckbox = document.createElement('input')
//     systemAudioCheckbox.type = 'checkbox'
//     systemAudioCheckbox.id = 'checkbox'

//     const systemAudioLabel = document.createElement('label')
//     systemAudioLabel.htmlFor = 'checkbox'
//     systemAudioLabel.textContent = 'Include system audio'

//     const formatSelect = document.createElement('select')
//     formatSelect.id = 'formatSelect'
//     ;['webm', 'mp3', 'wav'].forEach(format => {
//         const option = document.createElement('option')
//         option.value = format
//         option.textContent = format.toUpperCase()
//         formatSelect.appendChild(option)
//     })

//     settings.appendChild(systemAudioCheckbox)
//     settings.appendChild(systemAudioLabel)
//     settings.appendChild(formatSelect)

//     return settings
// }

// function createRecorder() {
//     const recorder = document.createElement('div')
//     recorder.className = 'recorder'

//     const tabRecorder = createRecorderSection('Tab Audio', 'tab')
//     const micRecorder = createRecorderSection('Microphone', 'microphone')

//     recorder.appendChild(tabRecorder)
//     recorder.appendChild(micRecorder)

//     return recorder
// }

// function createRecorderSection(title, type) {
//     const section = document.createElement('div')
//     section.className = `recorder__content`
//     section.id = `recorder__${type}`

//     const titleElem = document.createElement('p')
//     titleElem.textContent = title

//     const button = document.createElement('button')
//     button.id = `recorder__${type}__button`
//     button.className = 'extension-button primary'
//     button.textContent = 'Record'
//     button.addEventListener('click', () => toggleRecording(type))

//     section.appendChild(titleElem)
//     section.appendChild(button)

//     return section
// }

// function initExtension() {
//     chrome.runtime.sendMessage({ action: 'GET_ORIGINAL_TAB' }, tab => {
//         originalTab = tab
//         updateTabInfo()
//     })

//     const formatSelect = document.getElementById('formatSelect')
//     formatSelect.addEventListener('change', event => {
//         selectedFormat = event.target.value
//         if (recordedBlob) {
//             updateDownloadLink()
//         }
//     })

//     document.getElementById('formatSelect').addEventListener('change', updateSettings)

//     const tabRecordButton = document.getElementById('recorder__tab__button')
//     const micRecordButton = document.getElementById('recorder__microphone__button')

//     tabRecordButton.addEventListener('click', () => toggleRecording('tab'))
//     micRecordButton.addEventListener('click', () => toggleRecording('microphone'))
// }

// function updateSettings() {
//     const includeSystemAudio = document.getElementById('settingsCheckbox').checked
//     const format = document.getElementById('formatSelect').value
//     chrome.runtime.sendMessage({
//         action: 'UPDATE_SETTINGS',
//         data: { includeSystemAudio, format },
//     })
// }

// function updateTabInfo() {
//     if (originalTab) {
//         document.getElementById('url-content').textContent = originalTab.url
//         document.getElementById('title-content').value = originalTab.title
//     }
// }

// async function toggleRecording(type) {
//     isRecording = !isRecording
//     recordingType = type

//     const button = document.getElementById(`recorder__${type}__button`)

//     if (isRecording) {
//         button.textContent = 'Stop'
//         button.classList.remove('primary')
//         button.classList.add('danger')
//         await startRecording()
//         return
//     }

//     button.textContent = 'Start'
//     button.classList.remove('danger')
//     button.classList.add('primary')
//     stopRecording()
// }

// async function startRecording() {
//     try {
//         if (recordingType === 'tab') {
//             const streamId = await new Promise((resolve, reject) => {
//                 chrome.tabCapture.getMediaStreamId({ targetTabId: originalTab.id }, streamId => {
//                     if (chrome.runtime.lastError) {
//                         reject(chrome.runtime.lastError)
//                     } else {
//                         resolve(streamId)
//                     }
//                 })
//             })

//             audioStream = await navigator.mediaDevices.getUserMedia({
//                 audio: {
//                     mandatory: {
//                         chromeMediaSource: 'tab',
//                         chromeMediaSourceId: streamId,
//                     },
//                 },
//                 video: false,
//             })
//         } else if (recordingType === 'microphone') {
//             audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
//         }

//         // Create an audio context and connect it to the output
//         const audioContext = new AudioContext()
//         const source = audioContext.createMediaStreamSource(audioStream)
//         source.connect(audioContext.destination)

//         initMediaRecorder()
//         isRecording = true
//     } catch (error) {
//         console.error('Error starting recording:', error)
//         isRecording = false
//         const button = document.getElementById(`recorder__${recordingType}__button`)
//         button.textContent = 'Start'
//         button.classList.remove('danger')
//         button.classList.add('primary')
//     }
// }

// function initMediaRecorder() {
//     mediaRecorder = new MediaRecorder(audioStream)
//     audioChunks = []

//     mediaRecorder.ondataavailable = event => {
//         audioChunks.push(event.data)
//         updateRecordingProgress(audioChunks.length)
//     }

//     mediaRecorder.onstop = () => {
//         audioStream.getTracks().forEach(track => track.stop())
//         const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
//         const audioUrl = URL.createObjectURL(audioBlob)
//         showRecordingResult(audioUrl, 'webm')
//     }

//     mediaRecorder.start(1000)
//     showRecordingProgress()
// }

// function stopRecording() {
//     if (mediaRecorder && mediaRecorder.state !== 'inactive') {
//         mediaRecorder.stop()
//         mediaRecorder.onstop = async () => {
//             audioStream.getTracks().forEach(track => track.stop())
//             recordedBlob = new Blob(audioChunks, { type: 'audio/webm' })
//             await updateDownloadLink()
//         }
//     }
// }

// async function updateDownloadLink() {
//     let finalBlob
//     let mimeType

//     switch (selectedFormat) {
//         case 'mp3':
//             initEncoderWorker()
//             const audioContext = new AudioContext()
//             const arrayBuffer = await recordedBlob.arrayBuffer()
//             const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

//             // Send raw audio data to worker
//             encoderWorker.postMessage({
//                 action: 'convertToMp3',
//                 sampleRate: audioBuffer.sampleRate,
//                 channelData: audioBuffer.getChannelData(0),
//             })
//             return // We'll update the link when we receive the converted data
//         case 'wav':
//             finalBlob = await convertToWav(recordedBlob)
//             mimeType = 'audio/wav'
//             break
//         default:
//             finalBlob = recordedBlob
//             mimeType = 'audio/webm'
//     }

//     updateDownloadLinkUI(finalBlob, mimeType)
// }

// async function convertToWav(blob) {
//     const audioContext = new AudioContext()
//     const arrayBuffer = await blob.arrayBuffer()
//     const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
//     const wavBuffer = audioBufferToWav(audioBuffer)
//     return new Blob([wavBuffer], { type: 'audio/wav' })
// }

// function audioBufferToWav(buffer) {
//     const numChannels = buffer.numberOfChannels
//     const sampleRate = buffer.sampleRate
//     const length = buffer.length * numChannels * 2
//     const arrayBuffer = new ArrayBuffer(44 + length)
//     const view = new DataView(arrayBuffer)

//     // Write WAV header
//     writeString(view, 0, 'RIFF')
//     view.setUint32(4, 36 + length, true)
//     writeString(view, 8, 'WAVE')
//     writeString(view, 12, 'fmt ')
//     view.setUint32(16, 16, true)
//     view.setUint16(20, 1, true)
//     view.setUint16(22, numChannels, true)
//     view.setUint32(24, sampleRate, true)
//     view.setUint32(28, sampleRate * numChannels * 2, true)
//     view.setUint16(32, numChannels * 2, true)
//     view.setUint16(34, 16, true)
//     writeString(view, 36, 'data')
//     view.setUint32(40, length, true)

//     // Write audio data
//     const offset = 44
//     for (let i = 0; i < buffer.length; i++) {
//         for (let channel = 0; channel < numChannels; channel++) {
//             const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]))
//             view.setInt16(
//                 offset + (i * numChannels + channel) * 2,
//                 sample < 0 ? sample * 0x8000 : sample * 0x7fff,
//                 true
//             )
//         }
//     }

//     return new Blob([view], { type: 'audio/wav' })
// }

// // Helper function to write strings to the DataView
// function writeString(view, offset, string) {
//     for (let i = 0; i < string.length; i++) {
//         view.setUint8(offset + i, string.charCodeAt(i))
//     }
// }

// function updateDownloadLinkUI(blob, mimeType) {
//     const audioUrl = URL.createObjectURL(blob)
//     showRecordingResult(audioUrl, selectedFormat)
// }

// function showRecordingResult(audioUrl, format) {
//     const result = document.createElement('div')
//     result.className = 'result'

//     const audio = document.createElement('audio')
//     audio.controls = true
//     audio.src = audioUrl

//     const downloadLink = document.createElement('a')
//     downloadLink.href = audioUrl
//     const titleInput = document.getElementById('title-content')
//     const title = titleInput.value.trim() || 'recorded_audio'
//     const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase()
//     downloadLink.download = `${sanitizedTitle}.${format}`
//     downloadLink.className = 'extension-button success'
//     downloadLink.textContent = 'Download'

//     // Add event listener to update filename when title changes
//     titleInput.addEventListener('input', () => {
//         const newTitle = titleInput.value.trim() || 'recorded_audio'
//         const newSanitizedTitle = newTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()
//         downloadLink.download = `${newSanitizedTitle}.${selectedFormat}`
//     })

//     result.appendChild(audio)
//     result.appendChild(downloadLink)

//     const recorder = document.querySelector('.recorder')
//     recorder.innerHTML = ''
//     recorder.appendChild(result)
// }

// function showRecordingProgress() {
//     const recorder = document.querySelector('.recorder')
//     const progressDiv = document.createElement('div')
//     progressDiv.id = 'recordingProgress'
//     progressDiv.textContent = 'Recording in progress...'
//     recorder.appendChild(progressDiv)
// }

// function updateRecordingProgress(chunksCount) {
//     const progressDiv = document.getElementById('recordingProgress')
//     if (progressDiv) {
//         progressDiv.textContent = `Recording in progress: ${chunksCount} chunks`
//     }
// }

// function updateEncodingProgress(progress) {
//     const progressDiv = document.getElementById('recordingProgress')
//     if (progressDiv) {
//         progressDiv.textContent = `Encoding in progress: ${progress}%`
//     }
// }
// // Listen for messages from the background script
// chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
//     if (request.action === 'RECORDING_PROGRESS') {
//         updateRecordingProgress(request.data.progress)
//     } else if (request.action === 'ENCODING_PROGRESS') {
//         updateEncodingProgress(request.data.progress)
//     }
// })
