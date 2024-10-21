<script lang="ts">
    import { onMount } from 'svelte'
    import { Input } from '$lib/components/ui/input'
    import { ModeWatcher } from 'mode-watcher'
    import type { RecorderState } from '$lib/types'
    import { settings, currentTab } from '$lib/stores'
    import { recorderStore } from '$lib/stores/recorder'
    import Recorder from '$lib/components/Recorder.svelte'
    import Progress from '$lib/components/Progress.svelte'

    let isActive = false
    let audioUrl: string | null = null

    async function setUp() {
        const storedSettings = await chrome.storage.sync.get('settings')
        if (storedSettings.settings) {
            settings.set(storedSettings.settings)
        }

        const tab = await chrome.runtime.sendMessage({ action: 'GET_CURRENT_TAB' })
        if (tab) currentTab.set(tab)

        chrome.runtime.onMessage.addListener((message) => {
            if (message.action === 'TAB_UPDATED') {
                currentTab.set(message.data)
            }
        })
    }

    onMount(() => {
        setUp()

        const unsubscribe = recorderStore.subscribe((state: RecorderState) => {
            isActive = state.active
            audioUrl = state.audioUrl
        })

        return () => {
            unsubscribe()
        }
    })
</script>

<ModeWatcher />

<main class="container mx-auto max-w-sm space-y-4 p-4">
    <Input
        placeholder="Tab name"
        value={$currentTab?.title ?? 'Cannot record audio from this tab'}
    />
    {#if audioUrl && isActive}
        <Progress />
    {/if}
    <Recorder />
</main>

<style>
    :global(body) {
        width: 325px;
        height: 385px;
    }
</style>
