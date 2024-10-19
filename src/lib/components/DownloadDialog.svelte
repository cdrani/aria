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

    let filename: Writable<string> = writable($currentTab?.title || 'N/A')

    function updateFilename(event: Event) {
        const value = (event.target as HTMLInputElement).value
        filename.set(value)
    }

    function formatFilename(filename: string) {
        return `${filename}.${$settings.format}`
    }

    async function handleDownload() {
        initEncoderWorker()
        const fileName = formatFilename($filename)
        await recorderStore.download(fileName)
    }
</script>

<Dialog.Root>
    <Dialog.Trigger>
        <div class="grid max-w-sm place-items-center gap-2">
            <Button id="download" variant="outline" size="icon" class="rounded-full border-red-600">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="1.5rem"
                    height="1.5rem"
                    viewBox="0 0 24 24"
                >
                    <path
                        class="fill-red-600"
                        d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zM12 2L4 5v6h4v6l8-3v-6h-4z"
                    />
                </svg>
            </Button>
            <Label for="download">Save</Label>
        </div>
    </Dialog.Trigger>

    <Dialog.Content class="max-w-[90%] p-4">
        <Dialog.Header>
            <Dialog.Title class="text-left">Save Recording</Dialog.Title>
            <Dialog.Description class="text-left">
                Save recording to device. Set file name and format.
            </Dialog.Description>
        </Dialog.Header>
        <div class="space-y-2">
            <div class="grid w-full max-w-xs items-center gap-1.5">
                <Label for="url">name</Label>
                <Input id="url" class="truncate" value={$filename} on:input={updateFilename} />
            </div>
            <div class="pt-2">
                <DownloadSettings />
            </div>
        </div>
        <Dialog.Footer class="space-y-2">
            <div class="flex w-full justify-end gap-2">
                <Dialog.Close>
                    <Button variant="secondary">Close</Button>
                </Dialog.Close>
                <Button on:click={handleDownload}>Download</Button>
            </div>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
