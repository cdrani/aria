export function createRecorder() {
    const recorder = document.createElement('div')
    recorder.className = 'recorder'

    const tabRecorder = createRecorderSection('Tab Audio', 'tab')
    const micRecorder = createRecorderSection('Microphone', 'microphone')

    recorder.appendChild(tabRecorder)
    recorder.appendChild(micRecorder)

    return recorder
}

export function createRecorderSection(title, type) {
    const section = document.createElement('div')
    section.className = `recorder__content`
    section.id = `recorder__${type}`

    const titleElem = document.createElement('p')
    titleElem.textContent = title

    const button = document.createElement('button')
    button.id = `recorder__${type}__button`
    button.className = 'extension-button primary'
    button.textContent = 'Record'

    section.appendChild(titleElem)
    section.appendChild(button)

    return section
}
