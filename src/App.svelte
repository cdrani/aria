<script lang="ts">
    import { onMount } from 'svelte'
    import { ModeWatcher } from 'mode-watcher'
    import { settings, currentTab } from '$lib/stores'
    import Recorder from '$lib/components/Recorder.svelte'
    import Progress from '$lib/components/Progress.svelte'

    let isActive = false
    let audioUrl: string | null = null

    async function setUp() {
        const storedSettings = await chrome.storage.sync.get('settings')
        if (storedSettings.settings) {
            settings.set(storedSettings.settings)
        }

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        currentTab.set(tab)
    })
</script>

<ModeWatcher />

<main class="container mx-auto space-y-4 p-4">
    {#if audioUrl && isActive}
        <Progress />
    {/if}
    <Recorder />
</main>

<style>
    :global(body) {
        width: 350px;
        height: 400px;
    }
</style>
