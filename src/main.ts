import App from './App.svelte';

async function render() {
	new App({
		target: document.getElementById('root') as HTMLElement
	});
}

document.addEventListener('DOMContentLoaded', render);
