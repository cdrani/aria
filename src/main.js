import './style.css'
import './lib/wavesurfer.min.js'
import { setupUI } from './ui/index.js'
import { updateTabInfo } from './ui/tab.js'
import { initWavesurfer } from './recorder/ui.js'
import { initEncoderWorker } from './encoder/index.js'
import { toggleRecording } from './recorder/controls.js'

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
    micRecordButton.addEventListener('click', () => toggleRecording('microphone'))
})
