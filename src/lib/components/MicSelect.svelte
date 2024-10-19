<script lang="ts">
    import { onMount } from 'svelte'
    import Selector from './Selector.svelte'
    import { settings } from '$lib/stores'
    import type { SelectValue } from '$lib/types'

    let microphones: MediaDeviceInfo[] = []

    onMount(async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices()
            microphones = devices.filter((device) => device.kind === 'audioinput' && device.label)
        } catch (error) {
            console.error('Error fetching microphones:', error)
        }
    })

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
        $settings[key] = { id: data.value, label: data.label }
        updateSettings()
    }
</script>

<Selector
    label="microphone"
    placeholder="Select a microphone"
    handleChange={updateInput}
    data={microphones.map((mic) => ({
        value: mic.deviceId,
        label: mic.label || 'Unknown Microphone'
    }))}
    selected={{ value: $settings.microphone.id, label: $settings.microphone.label }}
/>
