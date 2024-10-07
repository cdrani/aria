import { 
    updateDownloadLink,
    resetRecordButton, showRecordingResult,
    updateRecordingProgress, showRecordingProgress
} from './ui'

let isRecording = false
let audioStream = null
let mediaRecorder = null
let audioChunks = []
let recordedBlob = null
let recordingType = 'tab'

export async function toggleRecording(type, originalTab) {
    isRecording = !isRecording
    recordingType = type

    const button = document.getElementById(`recorder__${type}__button`)
    button.textContent = isRecording ? 'Stop' : 'Record'
    button.classList.remove(isRecording ? 'primary' : 'danger')
    button.classList.add(isRecording ? 'danger' : 'primary')

    isRecording && await startRecording(type, originalTab)
    !isRecording && stopRecording
}

async function getTabAudioStream(originalTab) {
    const streamId = await new Promise((resolve, reject) => {
        chrome.tabCapture.getMediaStreamId({ targetTabId: originalTab.id }, streamId => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(streamId);
            }
        });
    });

    return await navigator.mediaDevices.getUserMedia({
        audio: {
            mandatory: {
                chromeMediaSource: 'tab',
                chromeMediaSourceId: streamId,
            },
        },
        video: false,
    });
}

function initMediaRecorder() {
    mediaRecorder = new MediaRecorder(audioStream);
    audioChunks = [];

    mediaRecorder.ondataavailable = event => {
        audioChunks.push(event.data);
        updateRecordingProgress(audioChunks.length);
    };

    mediaRecorder.onstop = () => {
        audioStream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        showRecordingResult(audioBlob, 'webm');
    };

    mediaRecorder.start(1000);
    showRecordingProgress();
}

export const startRecording = async (type, originalTab) => {
    try {
        audioStream = await (type == 'tab'
        ? getTabAudioStream(originalTab)
        : navigator.mediaDevices.getUserMedia({ audio: true }))

        initMediaRecorder()
        isRecording = true
    } catch (error) {
        console.error('Error starting recording:', error)
        isRecording = false
        resetRecordButton(type)
    }
}

export const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop()
        mediaRecorder.onstop = async () => {
            audioStream.getTracks().forEach(track => track.stop())
            recordedBlob = new Blob(audioChunks, { type: 'audio/webm' })
            await updateDownloadLink(recordedBlob)
        }
    }
}
