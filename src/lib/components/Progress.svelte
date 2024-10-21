<script lang="ts">
    import { onMount, onDestroy } from 'svelte'
    import { Button } from './ui/button'
    import WaveSurfer from 'wavesurfer.js'

    import type { RecorderState } from '$lib/types'
    import { recorderStore } from '$lib/stores/recorder'

    let waveformContainer: HTMLDivElement
    let wavesurfer: WaveSurfer
    let isPlaying = false
    let isActive = false
    let currentTime = 0
    let duration = 0
    let audioUrl: string | null = null
    let isRecording = false

    function createWaveSurfer() {
        if (!waveformContainer) return

        if (wavesurfer) wavesurfer.destroy()

        wavesurfer = WaveSurfer.create({
            container: waveformContainer,
            waveColor: 'rebeccapurple',
            progressColor: 'rebeccapurple',
            cursorColor: 'rebeccapurple',
            height: 50
        })

        wavesurfer.on('play', () => (isPlaying = true))
        wavesurfer.on('pause', () => (isPlaying = false))
        wavesurfer.on('audioprocess', (time) => (currentTime = time))
        wavesurfer.on('ready', () => (duration = wavesurfer.getDuration()))
        wavesurfer.on('destroy', () => console.log('WaveSurfer destroyed'))
    }

    onMount(() => {
        createWaveSurfer()

        const unsubscribe = recorderStore.subscribe((state: RecorderState) => {
            audioUrl = state.audioUrl
            isRecording = state.isRecording
            isActive = state.active
            if (isActive && audioUrl) {
                if (!wavesurfer) createWaveSurfer()
                wavesurfer.load(audioUrl)
            } else {
                if (audioUrl) URL.revokeObjectURL(audioUrl)
            }
        })

        return () => {
            unsubscribe()
            wavesurfer?.unAll()
            wavesurfer?.destroy()
        }
    })

    onDestroy(() => {
        if (wavesurfer) {
            wavesurfer.unAll()
            wavesurfer.destroy()
        }
        if (audioUrl) URL.revokeObjectURL(audioUrl)
    })

    function togglePlayPause() {
        wavesurfer.playPause()
    }

    function restart() {
        wavesurfer.stop()
        wavesurfer.play()
    }

    function skipForward() {
        wavesurfer.skip(5)
    }

    function skipBackward() {
        wavesurfer.skip(-5)
    }

    function formatTime(time: number, includeHours: boolean = false): string {
        const hours = Math.floor(time / 3600)
        const minutes = Math.floor((time % 3600) / 60)
        const seconds = Math.floor(time % 60)
        if (includeHours) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        }
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
</script>

<div class="mb-4 w-full rounded-md bg-secondary p-4">
    <div bind:this={waveformContainer} class="h-16 w-full rounded-md" />

    {#if isRecording}
        <p class="text-xl font-bold text-muted-foreground">{formatTime(duration, true)}</p>
    {/if}

    {#if isActive && audioUrl && !isRecording}
        <div class="flex items-center justify-between">
            <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
            <div class="space-x-2">
                <Button on:click={skipBackward} variant="outline" size="icon">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        ><polygon points="19 20 9 12 19 4 19 20"></polygon><line
                            x1="5"
                            y1="19"
                            x2="5"
                            y2="5"
                        ></line></svg
                    >
                </Button>
                <Button on:click={togglePlayPause} variant="outline" size="icon">
                    {#if isPlaying}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            ><rect x="6" y="4" width="4" height="16"></rect><rect
                                x="14"
                                y="4"
                                width="4"
                                height="16"
                            ></rect></svg
                        >
                    {:else}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            ><polygon points="5 3 19 12 5 21 5 3"></polygon></svg
                        >
                    {/if}
                </Button>
                <Button on:click={skipForward} variant="outline" size="icon">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        ><polygon points="5 4 15 12 5 20 5 4"></polygon><line
                            x1="19"
                            y1="5"
                            x2="19"
                            y2="19"
                        ></line></svg
                    >
                </Button>
                <Button on:click={restart} variant="outline" size="icon">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        ><path d="M3 2v6h6"></path><path d="M3 13a9 9 0 1 0 3-7.7L3 8"></path></svg
                    >
                </Button>
            </div>
        </div>
    {/if}
</div>
