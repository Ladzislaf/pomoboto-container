import { Scenes, Markup } from 'telegraf';
import { message } from 'telegraf/filters';
import db from '../db.js';

const weekendsScene = new Scenes.BaseScene('weekends');

weekendsScene.enter(async (ctx) => {
	const { includeWeekends } = await db.getUserSettings(ctx.from.id);
	const isWorkingOnWeekends = includeWeekends ? 'Yes, no day out' : 'No';
	return ctx.reply(`Working on weekends now?: ${isWorkingOnWeekends}.\nDo you want to work on weekends?`, Markup.inlineKeyboard([
		[Markup.button.callback('Yes', 'yesWeekends'), Markup.button.callback('No', 'noWeekends')],
	]));
});

weekendsScene.action('yesWeekends', async (ctx) => {
	await ctx.deleteMessage();
	await db.updateUserSettings(ctx.from.id, 'includeWeekends', true);
	await ctx.reply('Done! Weekends will be counted. Stay hard!')
	await ctx.answerCbQuery('Yes weekends.');
	return ctx.scene.leave();
})

weekendsScene.action('noWeekends', async (ctx) => {
	await ctx.deleteMessage();
	await db.updateUserSettings(ctx.from.id, 'includeWeekends', false);
	await ctx.reply('Done! Weekends will not be counted.')
	await ctx.answerCbQuery('No weekends.');
	return ctx.scene.leave();
})

weekendsScene.on(message(), async (ctx) => {
	await ctx.deleteMessage();
	return ctx.reply('Please, click Yes or No.');
});

export default weekendsScene;
