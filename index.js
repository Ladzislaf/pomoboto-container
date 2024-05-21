import { Telegraf, Scenes, session } from 'telegraf';
import streakJob from './cron.js';
import dotenv from 'dotenv';
import db from './db.js';
import textSettingScene from './scenes/textSettingScene.js';
import weekendsScene from './scenes/weekendsScene.js';
import { botCommands, showMenuKeyboard, setFocusInterval, setfocusTimeout, changeSettingAction } from './utils.js';

dotenv.config();
streakJob.start();

const bot = new Telegraf(process.env.BOT_TOKEN);
const stage = new Scenes.Stage([textSettingScene, weekendsScene]);

bot.use(session());
bot.use(stage.middleware());

bot.telegram.setMyCommands(botCommands);

bot.start(async (ctx) => {
	console.log('[Start] first name:', ctx.from.first_name);
	console.log('[Start] last name:', ctx.from.last_name);
	console.log('[Start] username:', ctx.from.username);
	await ctx.deleteMessage();
	await showMenuKeyboard(ctx);
	return db.createNewUser(ctx.from.id);
});

bot.command('cancel', async (ctx) => {
	await ctx.deleteMessage();
	if (ctx.session.focusTimeout && ctx.session.focusInterval) {
		clearTimeout(ctx.session.focusTimeout);
		clearInterval(ctx.session.focusInterval);
		delete ctx.session.focusTimeout;
		delete ctx.session.focusInterval;
		delete ctx.session.focusStarted;
		return ctx.reply('Focus canceled.');
	} else {
		return ctx.reply('The focus has not started yet.');
	}
});

bot.command('skip', async (ctx) => {
	await ctx.deleteMessage();
	if (ctx.session.breakTimeout && ctx.session.breakInterval) {
		clearTimeout(ctx.session.breakTimeout);
		clearInterval(ctx.session.breakInterval);
		delete ctx.session.breakTimeout;
		delete ctx.session.breakInterval;
		delete ctx.session.focusStarted;
		return ctx.reply('Break skiped.');
	} else {
		return ctx.reply('The break has not started yet.');
	}
});

bot.command('playlist', async (ctx) => {
	await ctx.deleteMessage();
	return ctx.reply(
		'To focus better, you can use a spotify [Playlist](https://open.spotify.com/playlist/0vvXsWCC9xrXsKd4FyS8kM?si=83d9e98fa29a48cd)',
		{
			parse_mode: 'MarkdownV2',
		}
	);
});

bot.action('startFocus', async (ctx) => {
	await db.createNewUser(ctx.from.id);
	if (ctx.session.focusStarted) {
		return ctx.answerCbQuery('Already started.');
	}
	ctx.session.focusStarted = true;
	const userSettings = await db.getUserSettings(ctx.from.id);
	await ctx.answerCbQuery('Focus!');
	await ctx.reply(`Focus started! (${userSettings.focusPeriod}/${userSettings.focusPeriod} min)`).then((data) => {
		ctx.session.focusInterval = setFocusInterval(ctx, userSettings.focusPeriod, data.message_id);
	});
	ctx.session.focusTimeout = setfocusTimeout(ctx, userSettings);
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
	const { focusPeriod, breakPeriod, todayStreak, dayGoal, currentDayStreak, bestDayStreak, includeWeekends } =
		await db.getUserSettings(ctx.from.id);
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

if (process.env.LOCAL_MODE === 'on') {
	bot.launch(() => console.log('Pomoboto bot is running locally.'));
} else {
	bot.launch(
		{
			webhook: {
				domain: process.env.DOMAIN,
				port: process.env.PORT || 443,
			},
		},
		() => console.log('Pomoboto bot is running on webhook.')
	);
}

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
