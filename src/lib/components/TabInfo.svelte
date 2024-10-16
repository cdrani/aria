<script lang="ts">
	import { currentTab } from '$lib/stores';
	import { Input } from './ui/input';
    import { Label } from './ui/label'
</script>

<div class="space-y-2">
	<div class="flex w-full max-w-sm items-center gap-1.5">
        <Label for="url">Tab</Label>
		<Input id="url" class="truncate" value={$currentTab?.url || 'N/A'} disabled />
	</div>
</div>
