<script lang="ts">
    import { settings } from '$lib/stores'
    import Selector from './Selector.svelte'
    import type { SelectValue } from '$lib/types'

    function updateSettings() {
        chrome.storage.sync.set({ settings: $settings })
    }

    function updateInput({
        key,
        data
    }: {
        key: string
        data: { value: SelectValue; label: string | undefined }
    }) {
        $settings[key] = data.value
        updateSettings()
    }
</script>

<div class="columns-2">
    <Selector
        label="format"
        placeholder="format"
        handleChange={updateInput}
        data={[
            { label: 'webm', value: 'webm' },
            { label: 'mp3', value: 'mp3' },
            { label: 'wav', value: 'wav' }
        ]}
        selected={{ value: $settings.format, label: $settings.format }}
    />

    {#if $settings.format === 'mp3'}
        <Selector
            label="quality"
            placeholder="quality"
            handleChange={updateInput}
            data={[
                { label: '128', value: 128 },
                { label: '192', value: 192 },
                { label: '256', value: 256 },
                { label: '320', value: 320 }
            ]}
            selected={{ value: $settings.quality, label: `${$settings.quality} kbps` }}
        />
    {/if}
</div>
