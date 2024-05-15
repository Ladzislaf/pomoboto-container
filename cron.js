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
			console.log(`[CronJob] User ${user.id}: todayStreak = ${todayStreak} | dayGoal = ${dayGoal}.`);
			if (todayStreak < dayGoal) {
				console.log(`[CronJob] User ${user.id}: todayStreak is less than dayGoal.`);
				const yesterday = new Date();
				yesterday.setDate(yesterday.getDate() - 1);
				console.log('[CronJob] Yesterday date to check streak:', yesterday.toUTCString());
				if (yesterday.getDay() === 6 || yesterday.getDay() === 0) {
					console.log(`[CronJob] Yesterday was weekend. yesterday.getDay(): ${yesterday.getDay()}. (0 or 6)`);
					if (includeWeekends) {
						console.log(`[CronJob] User ${user.id}: includeWeekends = true => reseting currentDayStreak.`);
						await db.updateUserSettings(user.id, 'currentDayStreak', 0);
					}
				} else {
					console.log(`[CronJob] Yesterday wasn't weekend. yesterday.getDay(): ${yesterday.getDay()}. (1-5)`);
					console.log(`[CronJob] User ${user.id}: reseting currentDayStreak.`);
					await db.updateUserSettings(user.id, 'currentDayStreak', 0);
				}
			}
		})
	},
);

export default cronJob;