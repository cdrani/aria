<script lang="ts">
    import { onMount, onDestroy } from 'svelte'
    import { Button } from './ui/button'
    import WaveSurfer from 'wavesurfer.js'
    import { Slider } from './ui/slider'
    import { Switch } from './ui/switch'
    import { Label } from './ui/label'
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
    let volume = 1
    let preservePitch = false
    let playbackRate = 1.0

    function createWaveSurfer() {
        if (!waveformContainer) return

        if (wavesurfer) wavesurfer.destroy()

        wavesurfer = WaveSurfer.create({
            container: waveformContainer,
            waveColor: 'rebeccapurple',
            progressColor: 'rebeccapurple',
            cursorColor: 'rebeccapurple',
            cursorWidth: 2,
            height: 56,
            barWidth: 2,
            normalize: true,
            barHeight: 1.5,
            minPxPerSec: 10
        })

        wavesurfer.on('play', () => (isPlaying = true))
        wavesurfer.on('pause', () => (isPlaying = false))
        wavesurfer.on('audioprocess', (time) => (currentTime = time))
        wavesurfer.on('ready', () => {
            duration = wavesurfer.getDuration()
            // wavesurfer.setVolume(volume)
            // wavesurfer.setPlaybackRate(playbackRate, preservePitch)
        })
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

    function formatTime(time: number): string {
        const hours = Math.floor(time / 3600)
        const minutes = Math.floor((time % 3600) / 60)
        const seconds = Math.floor(time % 60)

        const shortTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        if (hours > 0) {
            return `${hours < 9 ? hours : hours.toString().padStart(2, '0')}:${shortTime}`
        }
        return shortTime
    }

    function handleVolumeChange(value: number[]) {
        volume = value[0]
        if (wavesurfer) {
            wavesurfer.setVolume(volume)
        }
    }

    function handlePreservePitchToggle(checked: boolean) {
        preservePitch = checked
        if (wavesurfer) {
            wavesurfer.setPlaybackRate(playbackRate, preservePitch)
        }
    }

    function handlePlaybackRateChange(value: number[]) {
        playbackRate = value[0]
        if (wavesurfer) {
            wavesurfer.setPlaybackRate(playbackRate, preservePitch)
            wavesurfer.setOptions({
                audioRate: playbackRate
            })
        }
    }
</script>

<div class="w-full space-y-2 rounded-md border-2 border-secondary p-4">
    <div bind:this={waveformContainer} class="h-14 w-full rounded-md" />

    {#if isRecording}
        <p class="text-lg font-bold text-muted-foreground">{formatTime(duration)}</p>
    {/if}

    {#if isActive && audioUrl && !isRecording}
        <div class="flex items-center justify-between">
            <div class="flex-col">
                <p class="text-sm text-muted-foreground">{formatTime(currentTime)}</p>
                <hr class="my-0.5 border-muted-foreground" />
                <p class="text-sm text-muted-foreground">{formatTime(duration)}</p>
            </div>
            <div class="space-x-2">
                <Button on:click={skipBackward} class="h-8 w-8" variant="outline" size="icon">
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
                <Button on:click={togglePlayPause} class="h-8 w-8" variant="outline" size="icon">
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
                <Button on:click={skipForward} class="h-8 w-8" variant="outline" size="icon">
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
                <Button on:click={restart} class="h-8 w-8" variant="outline" size="icon">
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

        <div class="mt-4 grid grid-cols-5 space-y-3">
            <div class="col-span-5 flex items-center space-x-2">
                <span class="text-sm">Volume</span>
                <Slider
                    value={[volume]}
                    onValueChange={handleVolumeChange}
                    min={0}
                    max={1}
                    step={0.01}
                    class="w-full"
                />
                <span class="pl-1 text-sm">{(volume * 100).toFixed()}%</span>
            </div>

            <div class="col-span-1 grid items-center space-y-2">
                <Switch
                    id="preserve-pitch"
                    checked={preservePitch}
                    onCheckedChange={handlePreservePitchToggle}
                />
                <Label for="preserve-pitch" class="text-sm">Pitch</Label>
            </div>

            <div class="col-span-4 ml-1.5 grid items-center space-y-3">
                <div class="flex items-center space-x-3">
                    <Slider
                        value={[playbackRate]}
                        onValueChange={handlePlaybackRateChange}
                        min={0.25}
                        max={4}
                        step={0.01}
                        class="w-full"
                    />
                    <span class="text-sm">{playbackRate.toFixed(2).padEnd(1, '0')}x</span>
                </div>
                <span class="text-sm">Speed</span>
            </div>
        </div>
    {/if}
</div>
