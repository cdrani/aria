export function createSettings() {
    const settings = document.createElement('div')
    settings.className = 'settings'

    const muteToggle = createMuteToggle()
    const formatSelect = createFormatSelect()
    const qualitySelect = createQualitySelect()
    const microphoneSelect = createMicrophoneSelect()

    settings.appendChild(muteToggle)
    settings.appendChild(formatSelect)
    settings.appendChild(qualitySelect)
    settings.appendChild(microphoneSelect)

    return settings
}

function createMuteToggle() {
    const muteToggle = document.createElement('button')
    muteToggle.id = 'muteToggle'
    muteToggle.textContent = 'Mute Tab'
    muteToggle.className = 'extension-button primary'

    muteToggle.addEventListener('click', () => {
        const isMuted = muteToggle.textContent === 'Unmute Tab'
        muteToggle.textContent = isMuted ? 'Mute Tab' : 'Unmute Tab'
        muteToggle.classList.toggle('danger', !isMuted)
        muteToggle.classList.toggle('primary', isMuted)
        toggleTabMute(!isMuted)
    })

    return muteToggle
}

function createFormatSelect() {
    const formatSelect = document.createElement('select')
    formatSelect.id = 'formatSelect'
    ;['webm', 'mp3', 'wav'].forEach(format => {
        const option = document.createElement('option')
        option.value = format
        option.textContent = format.toUpperCase()
        formatSelect.appendChild(option)
    })

    return formatSelect
}

function createQualitySelect() {
    const qualitySelect = document.createElement('select')
    qualitySelect.id = 'qualitySelect'

    const qualities = [128, 192, 256, 320]
    qualities.forEach(quality => {
        const option = document.createElement('option')
        option.value = quality
        option.textContent = `${quality} kbps`
        qualitySelect.appendChild(option)
    })

    qualitySelect.addEventListener('change', event => {
        updateSettings({ quality: event.target.value })
    })

    return qualitySelect
}

function createMicrophoneSelect() {
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

    microphoneSelect.addEventListener('change', event => {
        updateSettings({ microphoneId: event.target.value })
    })

    return microphoneSelect
}

function updateSettings(newSettings) {
    chrome.runtime.sendMessage({ action: 'UPDATE_SETTINGS', settings: newSettings }, response => {
        const error = chrome.runtime?.lastError || response?.error
        if (error) console.error('Error updating settings:', error)
    })
}

function toggleTabMute(mute) {
    chrome.runtime.sendMessage({ mute, action: 'TOGGLE_TAB_MUTE' }, response => {
        const error = chrome.runtime?.lastError || response?.error
        if (error) console.error('Error toggling tab mute:', error)
    })
}
