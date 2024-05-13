import { Scenes, Markup } from 'telegraf';
import { message } from 'telegraf/filters';
import db from './db.js';

export const changeFocusPeriodScene = new Scenes.BaseScene('changeFocusPeriod');
changeFocusPeriodScene.enter(async (ctx) => {
	const { focusPeriod } = await db.getUserSettings(ctx.from.id);
	return ctx.reply(`Current focus period: ${focusPeriod} minutes. Send new focus period... (15-120 minutes)`);
});
changeFocusPeriodScene.on(message('text'), async (ctx) => {
	const newFocusPeriod = Number(ctx.message.text);
	if (newFocusPeriod >= 15 && newFocusPeriod <= 120) {
		await db.updateUserSettings(ctx.from.id, 'focusPeriod', newFocusPeriod);
		await ctx.deleteMessage();
		await ctx.reply(`Success! New focus period: ${newFocusPeriod} minutes`);
		return ctx.scene.leave();
	} else {
		await ctx.deleteMessage();
		return ctx.reply('Incorrect message. Please, send new focus period (15-120 minutes)');
	}
});
changeFocusPeriodScene.on(message(), async (ctx) => {
	await ctx.deleteMessage();
	return ctx.reply('Incorrect message. Please, send new focus period (15-120 minutes)');
});

export const changeBreakPeriodScene = new Scenes.BaseScene('changeBreakPeriod');
changeBreakPeriodScene.enter(async (ctx) => {
	const { breakPeriod } = await db.getUserSettings(ctx.from.id);
	return ctx.reply(`Current break period: ${breakPeriod} minutes. Send new break period... (3-30 minutes)`);
});
changeBreakPeriodScene.on(message('text'), async (ctx) => {
	const newBreakPeriod = Number(ctx.message.text);
	if (newBreakPeriod >= 3 && newBreakPeriod <= 30) {
		await db.updateUserSettings(ctx.from.id, 'breakPeriod', newBreakPeriod);
		await ctx.deleteMessage();
		await ctx.reply(`Success! New break period: ${newBreakPeriod} minutes`);
		return ctx.scene.leave();
	} else {
		await ctx.deleteMessage();
		return ctx.reply('Incorrect message. Please, send new break period (3-30 minutes)');
	}
});
changeBreakPeriodScene.on(message(), async (ctx) => {
	await ctx.deleteMessage();
	return ctx.reply('Incorrect message. Please, send new break period (3-30 minutes)');
});

export const changeDayGoalScene = new Scenes.BaseScene('changeDayGoal');
changeDayGoalScene.enter(async (ctx) => {
	const { dayGoal } = await db.getUserSettings(ctx.from.id);
	return ctx.reply(`Current goal: ${dayGoal} minutes a day. Send new goal... (60-720 minutes)`);
});
changeDayGoalScene.on(message('text'), async (ctx) => {
	const newDayGoal = Number(ctx.message.text);
	if (newDayGoal >= 60 && newDayGoal <= 720) {
		await db.updateUserSettings(ctx.from.id, 'dayGoal', newDayGoal);
		await ctx.deleteMessage();
		await ctx.reply(`Success! New goal: ${newDayGoal} minutes a day`);
		return ctx.scene.leave();
	} else {
		await ctx.deleteMessage();
		return ctx.reply('Incorrect message. Please, send new goal (60-720 minutes)');
	}
});
changeDayGoalScene.on(message(), async (ctx) => {
	await ctx.deleteMessage();
	return ctx.reply('Incorrect message. Please, send new goal (60-720 minutes)');
});

export const includeWeekendsScene = new Scenes.BaseScene('weekends');
includeWeekendsScene.enter(async (ctx) => {
	const { includeWeekends } = await db.getUserSettings(ctx.from.id);
	const isWorkingOnWeekends = includeWeekends ? 'Yes, no day out' : 'No';
	return ctx.reply(`Working on weekends now?: ${isWorkingOnWeekends}.\nDo you want to work on weekends?`, Markup.inlineKeyboard([
		[Markup.button.callback('Yes', 'yesWeekends'), Markup.button.callback('No', 'noWeekends')],
	]));
});
includeWeekendsScene.action('yesWeekends', async (ctx) => {
	await ctx.deleteMessage();
	await db.updateUserSettings(ctx.from.id, 'includeWeekends', true);
	await ctx.reply('Done! Weekends will be counted. Stay hard!')
	await ctx.answerCbQuery('Yes weekends');
	return ctx.scene.leave();
})
includeWeekendsScene.action('noWeekends', async (ctx) => {
	await ctx.deleteMessage();
	await db.updateUserSettings(ctx.from.id, 'includeWeekends', false);
	await ctx.reply('Done! Weekends will not be counted.')
	await ctx.answerCbQuery('No weekends');
	return ctx.scene.leave();
})
includeWeekendsScene.on(message(), async (ctx) => {
	return ctx.reply('Incorrect message. Please, send new goal (60-720 minutes)');
});
