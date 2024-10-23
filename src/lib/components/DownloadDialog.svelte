<script lang="ts">
    import { Label } from './ui/label'
    import { Button } from './ui/button'
    import { Input } from './ui/input'
    import * as Dialog from './ui/dialog'
    import { currentTab } from '$lib/stores'
    import { writable } from 'svelte/store'
    import type { Writable } from 'svelte/store'
    import { settings } from '$lib/stores'
    import DownloadSettings from './DownloadSettings.svelte'
    import { initEncoderWorker } from '$lib/encoder'
    import { recorderStore } from '$lib/stores/recorder'

    export let small: boolean = false

    let isLoading: Writable<boolean> = writable(false)
    let filename: Writable<string> = writable($currentTab?.title || 'N/A')

    function updateFilename(event: Event) {
        const value = (event.target as HTMLInputElement).value
        filename.set(value)
    }

    function formatFilename(filename: string) {
        return `${filename}.${$settings.format}`
    }

    async function handleDownload() {
        isLoading.set(true)
        initEncoderWorker()
        const fileName = formatFilename($filename)
        try {
            await recorderStore.download(fileName)
        } catch (error) {
            console.error(`Download failed: ${error}`)
        } finally {
            isLoading.set(false)
        }
    }
</script>

<Dialog.Root>
    <Dialog.Trigger>
        <div class="grid max-w-sm place-items-center gap-2">
            <Button
                id="download"
                variant="outline"
                size="icon"
                class="rounded-full {small ? 'h-7 w-7' : ''}"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={small ? '1rem' : '1.5rem'}
                    height={small ? '1rem' : '1.5rem'}
                    viewBox="0 0 24 24"
                >
                    <path
                        class="fill-red-900 brightness-200"
                        d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zM12 2L4 5v6h4v6l8-3v-6h-4z"
                    />
                </svg>
            </Button>
            {#if !small}
                <Label for="download">Save</Label>
            {/if}
        </div>
    </Dialog.Trigger>

    <Dialog.Content class="max-w-[90%] p-3">
        <Dialog.Header>
            <Dialog.Title class="text-left">Save Recording</Dialog.Title>
            <Dialog.Description class="text-left">
                Save recording to device. Set file name and select format.
            </Dialog.Description>
        </Dialog.Header>
        <div class="space-y-2">
            <div class="grid w-full max-w-xs items-center gap-1.5">
                <Label for="url">name</Label>
                <Input
                    id="url"
                    value={$filename}
                    on:input={updateFilename}
                    class="h-7 truncate px-2 text-xs"
                />
            </div>
            <div class="pt-2">
                <DownloadSettings />
            </div>
        </div>
        <Dialog.Footer class="space-y-2">
            <div class="flex w-full justify-end gap-2">
                <Dialog.Close>
                    <Button variant="secondary" size="sm">Close</Button>
                </Dialog.Close>
                <Button on:click={handleDownload} disabled={$isLoading} size="sm">
                    {#if $isLoading}
                        <svg
                            class="-ml-1 mr-3 h-5 w-5 animate-spin"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                class="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                stroke-width="4"
                            ></circle>
                            <path
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                        </svg>
                    {/if}
                    Download
                </Button>
            </div>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
