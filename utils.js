import { Markup } from 'telegraf';
import db, { redis } from './db.js';

export const botCommands = [
	{
		command: '/start',
		description: 'Open the bot menu',
	},
	{
		command: '/cancel',
		description: 'Cancel current focus session',
	},
	{
		command: '/skip',
		description: 'Skip the break timer',
	},
	{
		command: '/playlist',
		description: 'Spotify playlist',
	},
];

export function showMenuKeyboard(ctx) {
	return ctx.reply(
		'Menu:',
		Markup.inlineKeyboard([
			[Markup.button.callback('Start focus session', 'startFocus')],
			[
				Markup.button.callback('Show settings', 'showSettings'),
				Markup.button.callback('Useful days', 'showCompletedDays'),
			],
			[Markup.button.callback('Focus period', 'focusPeriod'), Markup.button.callback('Break period', 'breakPeriod')],
			[Markup.button.callback('Day goal', 'dayGoal'), Markup.button.callback('Weekends', 'weekends')],
			[Markup.button.callback('Close menu', 'closeMenu')],
		])
	);
}

export async function changeSettingAction(ctx, setting, scene) {
	ctx.session.settingToChange = setting;
	await ctx.scene.enter(scene);
	return ctx.answerCbQuery(setting);
}

export function setFocusInterval(ctx, focusPeriod, messageId) {
	let timerValue = focusPeriod;
	return setInterval(async () => {
		if (timerValue <= 0) {
			const focusInterval = await redis.get(`${ctx.from.id}:focusInterval`);
			console.log('[setFocusIntreval timerValue = 0] focusInterval from redis:', focusInterval);
			clearInterval(focusInterval);
			redis.del(`${ctx.from.id}:focusInterval`);
			return;
		}
		await ctx.editMessageText(`Focus started! (${--timerValue}/${focusPeriod} min)`, {
			message_id: messageId,
		});
	}, 60 * 1000);
}

export function setfocusTimeout(ctx, userSettings) {
	const { focusPeriod, breakPeriod, todayStreak, dayGoal, currentDayStreak, bestDayStreak } = userSettings;
	return setTimeout(async () => {
		redis.del(`${ctx.from.id}:focusTimeout`);
		await ctx.reply(`Focus finished! Have a break! (${breakPeriod}/${breakPeriod} min)`).then((data) => {
			let timerValue = breakPeriod;
			const interval = setInterval(async () => {
				if (timerValue <= 0) {
					const breakInterval = await redis.get(`${ctx.from.id}:breakInterval`);
					console.log('[setfocusTimeout timerValue = 0] breakInterval from redis:', breakInterval);
					clearInterval(breakInterval);
					redis.del(`${ctx.from.id}:breakInterval`);
					return;
				}
				await ctx.editMessageText(`Focus finished! Have a break! (${--timerValue}/${breakPeriod} min)`, {
					message_id: data.message_id,
				});
			}, 60 * 1000);
			redis.set(`${ctx.from.id}:breakInterval`, interval);
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
		const timeout = setTimeout(async () => {
			ctx.session.focusStarted = false;
			redis.del(`${ctx.from.id}:breakTimeout`);
			return ctx.reply(`Break finished! Start a new focus session from the menu now!`);
		}, breakPeriod * 60 * 1000);
		redis.set(`${ctx.from.id}:breakTimeout`, timeout);
	}, focusPeriod * 60 * 1000);
}
