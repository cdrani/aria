<script lang="ts">
    import { onDestroy, onMount } from 'svelte'
    import { audioType } from '$lib/stores'
    import type { RecorderState } from '$lib/types'
    import { recorderStore } from '$lib/stores/recorder'
    import { terminateEncoderWorker } from '$lib/encoder'

    import { Label } from './ui/label'
    import { Button } from './ui/button'
    import MicSelect from './MicSelect.svelte'
    import ToggleMute from './ToggleMute.svelte'
    import AudioSelect from './AudioSelect.svelte'
    import DownloadDialog from './DownloadDialog.svelte'

    let isActive = false
    let isRecording = false
    let isPaused = false
    let audioUrl: string | null = null

    const unsubscribe = recorderStore.subscribe((state: RecorderState) => {
        isActive = state.active
        isRecording = state.isRecording
        isPaused = state.isPaused
        audioUrl = state.audioUrl
    })

    async function handleRecordClick() {
        if (!isRecording) {
            await recorderStore.initialize()
            recorderStore.start()
        } else if (isPaused) {
            recorderStore.resume()
        } else {
            recorderStore.pause()
        }
    }

    function handleDiscardClick() {
        recorderStore.discard()
        terminateEncoderWorker()
    }

    async function handleStopClick() {
        if (isRecording) recorderStore.stop()
    }

    onDestroy(() => {
        unsubscribe()
        recorderStore.cleanup()
    })
</script>

<div class="flex flex-col space-y-4 rounded-md border-2 border-secondary p-4">
    <div class="flex items-center justify-between">
        <AudioSelect />

        <ToggleMute />
    </div>

    {#if $audioType === 'mic'}
        <MicSelect />
    {/if}

    <div class="flex items-center justify-between">
        <div class="grid max-w-sm place-items-center gap-2">
            {#if !isActive || isRecording}
                <Button
                    size="icon"
                    id="left-button"
                    variant="outline"
                    class="rounded-full border-2 border-red-600"
                    on:click={handleStopClick}
                >
                    <svg
                        class="fill-red-600"
                        xmlns="http://www.w3.org/2000/svg"
                        width="1rem"
                        height="1rem"
                        viewBox="0 0 20 20"
                    >
                        <rect width="16" height="16" x="2" y="2" rx="1" class="fill-red-600" />
                    </svg>
                </Button>
                <Label for="left-button">Stop</Label>
            {:else}
                <DownloadDialog />
            {/if}
        </div>

        <div class="grid max-w-sm place-items-center gap-2">
            <Button
                size="lg"
                variant="outline"
                id="middle-button"
                class="rounded-full border-2 border-red-600"
                on:click={handleRecordClick}
            >
                {#if isRecording && !isPaused}
                    <!-- pause icon -->
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="1.125rem"
                        height="1.125rem"
                        viewBox="0 0 36 36"
                    >
                        <rect
                            width="11"
                            height="28"
                            x="3.95"
                            y="4"
                            fill="black"
                            class="clr-i-solid clr-i-solid-path-1 fill-red-600"
                            rx="2.07"
                            ry="2.07"
                        />
                        <rect
                            width="11"
                            height="28"
                            x="20.95"
                            y="4"
                            fill="black"
                            class="clr-i-solid clr-i-solid-path-2 fill-red-600"
                            rx="2.07"
                            ry="2.07"
                        />
                        <path fill="none" d="M0 0h36v36H0z" />
                    </svg>
                {:else if isPaused}
                    <!-- play icon -->
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="1rem"
                        height="1rem"
                        viewBox="0 0 36 36"
                    >
                        <path
                            class="fill-red-600"
                            d="M32.16 16.08L8.94 4.47A2.07 2.07 0 0 0 6 6.32v23.21a2.06 2.06 0 0 0 3 1.85l23.16-11.61a2.07 2.07 0 0 0 0-3.7Z"
                        />
                        <path fill="none" d="M0 0h36v36H0z" />
                    </svg>
                {:else}
                    <!-- record icon -->
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="1.5rem"
                        height="1.5rem"
                        viewBox="0 0 24 24"
                    >
                        <path
                            class="fill-red-600"
                            d="M19 12c0 3.86-3.14 7-7 7s-7-3.14-7-7s3.14-7 7-7s7 3.14 7 7"
                        />
                    </svg>
                {/if}
            </Button>
            <Label for="middle-button"
                >{isRecording ? (isPaused ? 'Resume' : 'Pause') : 'Record'}</Label
            >
        </div>

        <div class="grid max-w-sm place-items-center gap-2">
            <Button
                size="icon"
                variant="outline"
                id="right-button"
                class="rounded-full border-2 border-red-600"
                on:click={handleDiscardClick}
            >
                <svg
                    width="1.25rem"
                    height="1.25rem"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        class="fill-red-600"
                        d="M12 4h3c.6 0 1 .4 1 1v1H3V5c0-.6.5-1 1-1h3c.2-1.1 1.3-2 2.5-2s2.3.9 2.5 2M8 4h3c-.2-.6-.9-1-1.5-1S8.2 3.4 8 4M4 7h11l-.9 10.1c0 .5-.5.9-1 .9H5.9c-.5 0-.9-.4-1-.9z"
                    />
                </svg>
            </Button>
            <Label for="right-button">Discard</Label>
        </div>
    </div>
</div>
