<script lang="ts">
	import type { Writable } from 'svelte/store';
	import { writable } from 'svelte/store';
	import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';

	type SelectAudio = 'tab' | 'mic';
	let audio: Writable<SelectAudio | undefined> = writable('tab');

	function setAudio(selection: string | undefined) {
		audio.set(selection as SelectAudio);
	}

	$: isTab = $audio == 'tab';
	$: isMic = $audio == 'mic';
</script>

<div class="flex items-center space-x-2">
	<ToggleGroup type="single" size="xs" value={$audio} onValueChange={(value) => setAudio(value)}>
		<ToggleGroupItem
			value="tab"
            disabled={isTab}
            class="px-2 py-0.5"
			aria-label="toggle tab audio">
            tab
        </ToggleGroupItem>
		<ToggleGroupItem 
            value="mic"
            disabled={isMic}
            class="px-2 py-0.5"
            aria-label="toggle mic audio">
            mic
        </ToggleGroupItem>
	</ToggleGroup>
</div>
