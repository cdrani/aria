import { cleanupResources } from '../encoder'
import { toggleMute } from '../recorder/controls'
import { updateDownloadLink, getOriginalRecordedBlob } from '../recorder/ui'

export function createSettings(state) {
    const settings = document.createElement('div')
    settings.className = 'settings'

    const muteToggle = createMuteToggle(state.muted)
    const formatSelect = createFormatSelect(state.format)
    const qualitySelect = createQualitySelect(state.quality)
    const microphoneSelect = createMicrophoneSelect(state.microphoneId)

    settings.appendChild(muteToggle)
    settings.appendChild(formatSelect)
    settings.appendChild(qualitySelect)
    settings.appendChild(microphoneSelect)

    return settings
}

function createMuteToggle(isMuted) {
    const toggleContainer = document.createElement('div')
    toggleContainer.className = 'toggle-container'

    const label = document.createElement('label')
    label.className = 'switch'

    const input = document.createElement('input')
    input.type = 'checkbox'
    input.id = 'muteToggle'
    input.checked = isMuted
    label.htmlFor = 'muteToggle'

    const slider = document.createElement('span')
    slider.className = 'slider round'

    label.appendChild(input)
    label.appendChild(slider)

    const text = document.createElement('span')
    text.textContent = 'Mute System Audio'

    toggleContainer.appendChild(label)
    toggleContainer.appendChild(text)

    setupMuteToggle(input)

    return toggleContainer
}

function setupMuteToggle(muteToggle) {
    muteToggle.addEventListener('change', event => {
        const isMuted = event.target.checked
        toggleMute(isMuted)
        updateSettings({ muted: isMuted })
    })
}

function createFormatSelect(format) {
    const formatSelect = document.createElement('select')
    formatSelect.id = 'formatSelect'
    ;['webm', 'mp3', 'wav'].forEach(format => {
        const option = document.createElement('option')
        option.value = format
        option.textContent = format.toUpperCase()
        formatSelect.appendChild(option)
    })

    formatSelect.addEventListener('change', async event => {
        const newSettings = { format: event.target.value }
        updateSettings(newSettings)
        const originalBlob = getOriginalRecordedBlob()
        if (event.target.value !== 'mp3') cleanupResources()
        if (originalBlob) await updateDownloadLink(originalBlob)
    })

    formatSelect.value = format

    return formatSelect
}

function createQualitySelect(quality) {
    const qualitySelect = document.createElement('select')
    qualitySelect.id = 'qualitySelect'

    const qualities = [128, 192, 256, 320]
    qualities.forEach(quality => {
        const option = document.createElement('option')
        option.value = quality
        option.textContent = `${quality} kbps`
        qualitySelect.appendChild(option)
    })

    qualitySelect.addEventListener('change', async event => {
        const newSettings = { quality: parseInt(event.target.value, 10) }
        updateSettings(newSettings)
        const originalBlob = getOriginalRecordedBlob()
        if (originalBlob) await updateDownloadLink(originalBlob)
    })

    qualitySelect.value = quality

    return qualitySelect
}

function createMicrophoneSelect(microphoneId) {
    const microphoneSelect = document.createElement('select')
    microphoneSelect.id = 'microphoneSelect'

    // Populate microphone options
    navigator.mediaDevices
        .enumerateDevices()
        .then(devices => {
            const audioInputDevices = devices.filter(device => device.kind === 'audioinput')
            audioInputDevices.forEach(device => {
                const option = document.createElement('option')
                option.value = device.deviceId
                option.textContent =
                    device.label || `Microphone ${microphoneSelect.options.length + 1}`
                microphoneSelect.appendChild(option)
            })
        })
        .catch(err => console.error('Error enumerating devices', err))

    microphoneSelect.value = microphoneId

    microphoneSelect.addEventListener('change', event => {
        updateSettings({ microphoneId: event.target.value })
    })

    return microphoneSelect
}

function updateSettings(newSettings) {
    chrome.runtime.sendMessage({ action: 'UPDATE_SETTINGS', data: newSettings }, response => {
        const error = chrome.runtime?.lastError || response?.error
        if (error) console.error('Error updating settings:', error)
    })
}
