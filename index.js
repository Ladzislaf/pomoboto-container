import { Telegraf, Markup, Scenes, session } from 'telegraf';
import streakJob from './cron.js';
import dotenv from 'dotenv';
import db from './db.js';
import textSettingScene from './scenes/textSettingScene.js';
import weekendsScene from './scenes/weekendsScene.js';

dotenv.config();
streakJob.start();

const bot = new Telegraf(process.env.BOT_TOKEN);
const stage = new Scenes.Stage([textSettingScene, weekendsScene]);

bot.use(session());
bot.use(stage.middleware());

bot.telegram.setMyCommands([
	{
		command: '/start',
		description: 'Open the bot menu',
	},
	{
		command: '/playlist',
		description: 'Spotify playlist',
	},
]);

bot.start(async (ctx) => {
	await ctx.deleteMessage();
	await showMenuKeyboard(ctx);
	await db.createNewUser(ctx.from.id);
});

bot.command('playlist', async (ctx) => {
	await ctx.deleteMessage();
	return ctx.reply('To focus better, you can use a spotify [Playlist](https://open.spotify.com/playlist/0vvXsWCC9xrXsKd4FyS8kM?si=83d9e98fa29a48cd)', {
		parse_mode: 'MarkdownV2',
	});
});

bot.action('startFocus', async (ctx) => {
	if (ctx.session.focusState === 'busy') {
		return ctx.answerCbQuery('Already started.');
	}
	ctx.session.focusState = 'busy';
	const { focusPeriod, breakPeriod, todayStreak, dayGoal, currentDayStreak, bestDayStreak } = await db.getUserSettings(ctx.from.id);
	await ctx.reply(`Focus started! (${focusPeriod}/${focusPeriod} min)`).then((data) => {
		let timerValue = focusPeriod;
		const timer = setInterval(async () => {
			if (timerValue === 0) {
				clearInterval(timer);
				return;
			}
			await ctx.editMessageText(`Focus started! (${--timerValue}/${focusPeriod} min)`, { message_id: data.message_id });
		}, 60 * 1000);
	});
	await ctx.answerCbQuery('Focus!');

	setTimeout(async () => {
		await ctx.reply(`Focus finished! Have a break! (${breakPeriod}/${breakPeriod} min)`).then((data) => {
			let timerValue = breakPeriod;
			const timer = setInterval(async () => {
				if (timerValue === 0) {
					clearInterval(timer);
					return;
				}
				await ctx.editMessageText(`Focus finished! Have a break! (${--timerValue}/${breakPeriod} min)`, {
					message_id: data.message_id,
				});
			}, 60 * 1000);
		});
		await db.updateUserSettings(ctx.from.id, 'todayStreak', todayStreak + focusPeriod);
		if (todayStreak + focusPeriod >= dayGoal) {
			if (await db.completeDay(ctx.from.id)) {
				await db.updateUserSettings(ctx.from.id, 'currentDayStreak', currentDayStreak + 1);
				if (currentDayStreak + 1 > bestDayStreak) {
					await db.updateUserSettings(ctx.from.id, 'bestDayStreak', currentDayStreak + 1);
				}
			}
		}
		setTimeout(async () => {
            delete ctx.session.focusState;
			return ctx.reply(`Break finished! Start a new focus session from the menu now!`);
		}, breakPeriod * 60 * 1000);
	}, focusPeriod * 60 * 1000);
});

bot.action('focusPeriod', async (ctx) => {
	return changeSettingAction(ctx, 'focusPeriod', 'textSetting');
});

bot.action('breakPeriod', async (ctx) => {
	return changeSettingAction(ctx, 'breakPeriod', 'textSetting');
});

bot.action('dayGoal', async (ctx) => {
	return changeSettingAction(ctx, 'dayGoal', 'textSetting');
});

bot.action('weekends', async (ctx) => {
	return changeSettingAction(ctx, 'includeWeekends', 'weekends');
});

bot.action('showSettings', async (ctx) => {
	const { focusPeriod, breakPeriod, todayStreak, dayGoal, currentDayStreak, bestDayStreak, includeWeekends } = await db.getUserSettings(ctx.from.id);
	const isWorkingOnWeekends = includeWeekends ? 'Yes, no day out' : 'No';
	await ctx.reply(
		`Focus period | ${focusPeriod} [min]\n` +
			`Break period | ${breakPeriod} [min]\n` +
			`Today done | ${todayStreak} [min]\n` +
			`Day goal | ${dayGoal} [min]\n` +
			`Current day streak | ${currentDayStreak} [day]\n` +
			`Best day streak | ${bestDayStreak} [day]\n` +
			`Work on weekends | ${isWorkingOnWeekends}\n`
	);
	return ctx.answerCbQuery('Settings.');
});

bot.action('showCompletedDays', async (ctx) => {
	const completedDays = await db.getCompletedDays(ctx.from.id);
	let daysCounter = 0;
	let message = '';
	while (daysCounter < 10 && completedDays[daysCounter]) {
		message += `${completedDays[daysCounter].day.toDateString()}\n`;
		daysCounter++;
	}
	if (completedDays.length > 10) {
		message += `... [${completedDays.length - daysCounter} more]`;
	}
	await ctx.reply(message ? 'Useful days:\n' + message : 'There is no useful days yet.');
	await ctx.answerCbQuery('Useful days.');
});

bot.action('closeMenu', async (ctx) => {
	await ctx.deleteMessage();
	await ctx.answerCbQuery('Menu closed!');
});

function showMenuKeyboard(ctx) {
	return ctx.reply(
		'Menu:',
		Markup.inlineKeyboard([
			[Markup.button.callback('Start focus session', 'startFocus')],
			[Markup.button.callback('Show settings', 'showSettings'), Markup.button.callback('Useful days', 'showCompletedDays')],
			[Markup.button.callback('Focus period', 'focusPeriod'), Markup.button.callback('Break period', 'breakPeriod')],
			[Markup.button.callback('Day goal', 'dayGoal'), Markup.button.callback('Weekends', 'weekends')],
			[Markup.button.callback('Close menu', 'closeMenu')],
		])
	);
}

async function changeSettingAction(ctx, setting, scene) {
	ctx.session.settingToChange = setting;
	await ctx.scene.enter(scene);
	return ctx.answerCbQuery(setting);
}

bot.launch().then(() => console.log('Bot is running.'));
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
