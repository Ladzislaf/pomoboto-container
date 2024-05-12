import { CronJob } from 'cron';
import db from './db.js';

const cronJob = new CronJob(
	'0 0 * * *',
	async function () {
		console.log(`CronJob started.`);
		const users = await db.getAllUsers();
		users.forEach(async (user) => {
			const { todayStreak, dayGoal, includeWeekends } = user;
			await db.updateUserSettings(user.id, 'todayStreak', 0);
			if (todayStreak < dayGoal) {
				const yesterday = new Date();
				yesterday.setDate(yesterday.getDate() - 1);
				console.log('CronJob yesterday date:', yesterday.toUTCString());
				if (yesterday.getDay() === 6 || yesterday.getDay() === 0) {
					if (includeWeekends) {
						await db.updateUserSettings(user.id, 'dayStreak', 0);
					}
				} else {
					await db.updateUserSettings(user.id, 'dayStreak', 0);
				}
			}
		})
	},
);

export default cronJob;