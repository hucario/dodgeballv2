document.getElementById('consentButton').addEventListener('click', () => {
	fetch('/consent/trackme');
	console.log('test');
	document.body.removeChild(document.getElementById('consentQuestion'));
});
document.getElementById('closeConsent').addEventListener('click', () => {
	document.body.removeChild(document.getElementById('consentQuestion'));
});
