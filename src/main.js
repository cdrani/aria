import './style.css'
import './lib/wavesurfer.min.js'
import { setupUI } from './ui'
import { updateTabInfo } from './ui/tab'
import { initEncoderWorker } from './encoder'
import { initWavesurfer } from './recorder/ui'
import { toggleRecording } from './recorder/controls'

let originalTab = null

document.addEventListener('DOMContentLoaded', async () => {
    await setupUI()
    initEncoderWorker()
    initWavesurfer(WaveSurfer)

    chrome.runtime.sendMessage({ action: 'GET_ORIGINAL_TAB' }, tab => {
        originalTab = tab
        updateTabInfo(originalTab)
    })

    // Set up recording buttons
    const tabRecordButton = document.getElementById('recorder__tab__button')
    const micRecordButton = document.getElementById('recorder__microphone__button')

    tabRecordButton.addEventListener('click', () => toggleRecording('tab', originalTab))
    micRecordButton.addEventListener('click', () => toggleRecording('microphone', originalTab))
})
