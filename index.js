import { Telegraf, Markup, Scenes, session } from 'telegraf';
import streakJob from './cron.js';
import dotenv from 'dotenv';
import server from './server.js';
import db from './db.js';
import { changeFocusPeriodScene, changeBreakPeriodScene, changeDayGoalScene, includeWeekendsScene } from './scenes.js';

dotenv.config();
server.start();
streakJob.start();

const bot = new Telegraf(process.env.BOT_TOKEN);
const stage = new Scenes.Stage([changeFocusPeriodScene, changeBreakPeriodScene, changeDayGoalScene, includeWeekendsScene]);

bot.use(session());
bot.use(stage.middleware());

bot.start(async (ctx) => {
	await showMenuKeyboard(ctx);
	await db.createNewUser(ctx.from.id);
});

bot.telegram.setMyCommands([
	{ command: '/start', description: 'Restart bot' },
	{ command: '/menu', description: 'Display bot menu' },
	{ command: '/playlist', description: 'Spotify playlist' },
	{ command: '/help', description: 'Help' },
]);

bot.command('menu', (ctx) => {
	return showMenuKeyboard(ctx);
});

bot.command('playlist', (ctx) => {
	return ctx.reply('To focus better, you can use a spotify [Playlist](https://open.spotify.com/playlist/0vvXsWCC9xrXsKd4FyS8kM?si=83d9e98fa29a48cd)', {
		parse_mode: 'MarkdownV2',
	});
});

bot.command('help', (ctx) => {
	return ctx.reply("Command's description here... [In development]");
});

bot.command('menu', (ctx) => {
	return showMenuKeyboard(ctx);
});

bot.action('startFocus', async (ctx) => {
	const { focusPeriod, breakPeriod, todayStreak, dayGoal, dayStreak } = await db.getUserSettings(ctx.from.id);
	await ctx.reply(`Focus session started! (${focusPeriod} mins)`);
	await ctx.answerCbQuery('Focus!');

	setTimeout(async () => {
		await ctx.reply(`Focus session finished! Have a break! (${breakPeriod} mins)`);
		await db.updateUserSettings(ctx.from.id, 'todayStreak', todayStreak + focusPeriod);
		if (todayStreak + focusPeriod >= dayGoal) {
			Users[userId].daysStreak++;
			await db.updateUserSettings(ctx.from.id, 'dayStreak', dayStreak + 1);
		}
		setTimeout(async () => {
			return ctx.reply(`Break finished! Start a new focus session from the menu now!`);
		}, breakPeriod * 60 * 1000);
	}, focusPeriod * 60 * 1000);
});

bot.action('focusPeriod', async (ctx) => {
	await ctx.scene.enter('changeFocusPeriod');
	return ctx.answerCbQuery('Focus period.');
});

bot.action('breakPeriod', async (ctx) => {
	await ctx.scene.enter('changeBreakPeriod');
	return ctx.answerCbQuery('Break period.');
});

bot.action('dayGoal', async (ctx) => {
	await ctx.scene.enter('changeDayGoal');
	return ctx.answerCbQuery('Day goal.');
});

bot.action('weekends', async (ctx) => {
	await ctx.scene.enter('weekends');
	return ctx.answerCbQuery('Weekends.');
});

bot.action('showSettings', async (ctx) => {
	const { focusPeriod, breakPeriod, todayStreak, dayGoal, dayStreak, includeWeekends } = await db.getUserSettings(ctx.from.id);
	const isWorkingOnWeekends = includeWeekends ? 'Yes, no day out' : 'No';
	await ctx.reply(
		`Focus period: ${focusPeriod} min\nBreak period: ${breakPeriod} min\nToday done: ${todayStreak} min\nDay goal: ${dayGoal} min\nDay streak: ${dayStreak} days\nWork on weekends?: ${isWorkingOnWeekends}\n`
	);
	return ctx.answerCbQuery('Settings');
});

bot.action('closeMenu', async (ctx) => {
	await ctx.editMessageReplyMarkup();
	await ctx.deleteMessage();
	await ctx.answerCbQuery('Menu closed!');
});

function showMenuKeyboard(ctx) {
	return ctx.reply(
		'Menu:',
		Markup.inlineKeyboard([
			[Markup.button.callback('Start focus session', 'startFocus')],
			[Markup.button.callback('Show settings', 'showSettings')],
			[Markup.button.callback('Focus period', 'focusPeriod'), Markup.button.callback('Break period', 'breakPeriod')],
			[Markup.button.callback('Day goal', 'dayGoal'), Markup.button.callback('Weekends', 'weekends')],
			[Markup.button.callback('Close menu', 'closeMenu')],
		])
	);
}

bot.launch();
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
