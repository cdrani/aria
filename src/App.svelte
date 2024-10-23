<script lang="ts">
    import { onMount } from 'svelte'
    import { ModeWatcher } from 'mode-watcher'

    import { Label } from '$lib/components/ui/label'
    import { Input } from '$lib/components/ui/input'
    import type { RecorderState } from '$lib/types'
    import { settings, currentTab } from '$lib/stores'
    import { recorderStore } from '$lib/stores/recorder'
    import Recorder from '$lib/components/Recorder.svelte'
    import Progress from '$lib/components/Progress.svelte'

    let isActive = false
    let isRecording = false
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
            isRecording = state.isRecording
        })

        return () => {
            unsubscribe()
            recorderStore.cleanup()
        }
    })
</script>

<ModeWatcher />

<main class="mx-auto flex w-full max-w-sm flex-col space-y-3 p-3">
    <div class="grid w-full items-center gap-0.5">
        <Input
            disabled
            class="h-7 w-full truncate px-2 text-xs"
            value={$currentTab?.title ?? 'Cannot record audio from this tab'}
        />
    </div>
    {#if isActive}
        <Progress />
    {/if}
    {#if !isActive || (isActive && isRecording)}
        <Recorder />
    {/if}
</main>

<style>
    main {
        @apply flex h-[400px] w-[275px] flex-col items-center;
    }
</style>
