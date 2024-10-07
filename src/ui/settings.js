export const createSettings = () => {
    const settings = document.createElement('div')
    settings.className = 'settings'

    const systemAudioCheckbox = document.createElement('input')
    systemAudioCheckbox.type = 'checkbox'
    systemAudioCheckbox.id = 'checkbox'

    const systemAudioLabel = document.createElement('label')
    systemAudioLabel.htmlFor = 'checkbox'
    systemAudioLabel.textContent = 'Include system audio'

    const formatSelect = document.createElement('select')
    formatSelect.id = 'formatSelect'
    ['webm', 'mp3', 'wav'].forEach(format => {
        const option = document.createElement('option')
        option.value = format
        option.textContent = format.toUpperCase()
        formatSelect.appendChild(option)
    })

    settings.appendChild(systemAudioCheckbox)
    settings.appendChild(systemAudioLabel)
    settings.appendChild(formatSelect)

    return settings
}
