<script lang="ts">
    import * as Select from './ui/select'
    import type { Writable } from 'svelte/store'
    import { writable } from 'svelte/store'
    import type { Selection, SelectValue } from '$lib/types'

    export let label: string
    export let selected: Selection
    export let placeholder: string = 'Select a value'
    export let data: Array<{ label: string; value: number | string | boolean }> = []
    export let handleChange: ({
        key,
        data
    }: {
        key: string
        data: { value: SelectValue; label: string | undefined }
    }) => void = () => {}

    let selection: Writable<Selection> = writable(selected)

    $: if (selected !== $selection) {
        selection.set(selected)
    }
</script>

<Select.Root
    selected={$selection}
    preventScroll={false}
    onSelectedChange={(select) =>
        handleChange({ key: label, data: { value: select?.value, label: select?.label } })}
>
    <Select.Trigger class="w-180px">
        <Select.Value {placeholder} />
    </Select.Trigger>
    <Select.Content class="max-h-[120px] overflow-y-scroll">
        <Select.Group>
            <Select.Label class="capitalize">{label}</Select.Label>
            {#each data as item, index}
                <Select.Item value={item.value} label={item.label}>
                    {item.label}
                </Select.Item>
                {#if index !== data.length - 1}
                    <Select.Separator />
                {/if}
            {/each}
        </Select.Group>
    </Select.Content>
    <Select.Input name={label.toLowerCase()} />
</Select.Root>
