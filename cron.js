const { CronJob } = require('cron');
const https = require('https');

const job = new CronJob(
	'* */14 * * * *',
	function () {
		console.log('Restarting server...');

		https
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
