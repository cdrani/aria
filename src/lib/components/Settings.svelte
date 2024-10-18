<script lang="ts">
    import { settings } from '$lib/stores'
    import { recorderStore } from '$lib/stores/recorder'
    import Selector from './Selector.svelte'
    import ToggleMute from './ToggleMute.svelte'

    function updateSettings() {
        chrome.storage.sync.set({ settings: $settings })
    }

    type SelectValue = string | number | boolean

    function updateInput({ key, value }: { key: string; value: SelectValue }) {
        $settings[key] = value
        updateSettings()
        if (key === 'muted') {
            recorderStore.toggleMute()
        }
    }

    let isMuted = false
    const unsubscribe = recorderStore.subscribe((state) => {
        isMuted = state.isMuted
    })

    import { onDestroy } from 'svelte'
    onDestroy(unsubscribe)
</script>

<div class="space-y-4">
    <div class="flex w-full items-center justify-between space-x-2">
        <ToggleMute
            checked={isMuted}
            handleToggle={() => updateInput({ key: 'muted', value: !isMuted })}
        />

        <div class="space-between flex w-full space-x-2">
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
        </div>
    </div>
</div>
