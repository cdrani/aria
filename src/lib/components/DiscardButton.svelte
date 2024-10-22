<script lang="ts">
    import { Button } from '$lib/components/ui/button'
    import { recorderStore } from '$lib/stores/recorder'
    import { terminateEncoderWorker } from '$lib/encoder'

    export let id: string | undefined = undefined
    export let small: boolean = false

    function handleDiscardClick() {
        recorderStore.discard()
        terminateEncoderWorker()
    }
</script>

<Button
    {id}
    size="icon"
    variant="outline"
    on:click={handleDiscardClick}
    class="bg-foreground-muted rounded-full {small ? 'h-7 w-7' : ''}"
>
    <svg
        width={small ? '1rem' : '1.25rem'}
        height={small ? '1rem' : '1.25rem'}
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            class="fill-red-900 brightness-200"
            d="M12 4h3c.6 0 1 .4 1 1v1H3V5c0-.6.5-1 1-1h3c.2-1.1 1.3-2 2.5-2s2.3.9 2.5 2M8 4h3c-.2-.6-.9-1-1.5-1S8.2 3.4 8 4M4 7h11l-.9 10.1c0 .5-.5.9-1 .9H5.9c-.5 0-.9-.4-1-.9z"
        />
    </svg>
</Button>
