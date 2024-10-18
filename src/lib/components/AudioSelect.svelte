<script lang="ts">
    import { audioType } from '$lib/stores'
    import type { AudioType } from '$lib/types'
    import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group'

    function setAudio(selection: string | undefined) {
        audioType.set(selection as AudioType)
    }

    $: isTab = $audioType == 'tab'
    $: isMic = $audioType == 'mic'
</script>

<div class="flex items-center space-x-2">
    <ToggleGroup
        type="single"
        size="xs"
        value={$audioType}
        onValueChange={(value) => setAudio(value)}
    >
        <ToggleGroupItem
            value="tab"
            disabled={isTab}
            class="px-2 py-0.5"
            aria-label="toggle tab audio"
        >
            tab
        </ToggleGroupItem>
        <ToggleGroupItem
            value="mic"
            disabled={isMic}
            class="px-2 py-0.5"
            aria-label="toggle mic audio"
        >
            mic
        </ToggleGroupItem>
    </ToggleGroup>
</div>
