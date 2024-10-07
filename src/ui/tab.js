export function updateTabInfo(originalTab) {
    if (originalTab) {
        document.getElementById('url-content').textContent = originalTab.url
        document.getElementById('title-content').value = originalTab.title
    }
}

export function createTabInfo() {
    const tabInfo = document.createElement('div')
    tabInfo.className = 'tab-info'

    const urlItem = createTabInfoItem('URL', 'url-content')
    const titleItem = createTabInfoItem('Title', 'title-content')

    tabInfo.appendChild(urlItem)
    tabInfo.appendChild(titleItem)

    return tabInfo
}

function createTabInfoItem(title, contentId) {
    const item = document.createElement('div')
    item.className = 'tab-info__item'

    const titleSpan = document.createElement('span')
    titleSpan.className = 'tab-info__item__title'
    titleSpan.textContent = `${title}:`

    const content = document.createElement('div')
    content.className = 'tab-info__item__content'

    if (contentId === 'title-content') {
        const contentInput = document.createElement('input')
        contentInput.id = contentId
        contentInput.type = 'text'
        contentInput.value = '' // Value will be updated later
        content.appendChild(contentInput)
    } else {
        const contentSpan = document.createElement('span')
        contentSpan.id = contentId
        content.appendChild(contentSpan)
    }

    item.appendChild(titleSpan)
    item.appendChild(content)

    return item
}
