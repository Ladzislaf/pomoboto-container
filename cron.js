const { CronJob } = require('cron');
const http = require('http');

console.log(process.env.BACKEND_URL);

const job = new CronJob(
	'* */14 * * * *',
	function () {
		console.log('Restarting server...');

		http
			.get(process.env.BACKEND_URL, (res) => {
				if (res.statusCode === 200) {
					console.log('Server restarted');
				} else {
					console.error('Failed to restart server. StatusCode:', res.statusCode);
				}
			})
			.on('error', (err) => {
				console.error('Error during restart:', err.message);
			});
	},
	null,
	true
);

module.exports = {
	job,
};
