import { Scenes } from 'telegraf';
import { message } from 'telegraf/filters';
import db from '../db.js';

const SettingsConfig = {
	'focusPeriod': {
		'name': 'focus period',
		'min': 15,
		'max': 180,
	},
	'breakPeriod': {
		'name': 'break period',
		'min': 3,
		'max': 60,
	},
	'dayGoal': {
		'name': 'day goal',
		'min': 30,
		'max': 720,
	},
}

const textSettingScene = new Scenes.BaseScene('textSetting');

textSettingScene.enter(async (ctx) => {
	const userSettings = await db.getUserSettings(ctx.from.id);
	const settingToChange = userSettings[ctx.session.settingToChange];
	return ctx.reply(`Current ${SettingsConfig[ctx.session.settingToChange].name}: ${settingToChange} min. Send new value.`);
});

textSettingScene.on(message('text'), async (ctx) => {
	const newValue = Number(ctx.message.text);
	const settingName = SettingsConfig[ctx.session.settingToChange].name;
	const settingMin = SettingsConfig[ctx.session.settingToChange].min;
	const settingMax = SettingsConfig[ctx.session.settingToChange].max;

	if (newValue >= settingMin && newValue <= settingMax) {
		await db.updateUserSettings(ctx.from.id, ctx.session.settingToChange, newValue);
		await ctx.deleteMessage();
		await ctx.reply(`Success! New ${settingName}: ${newValue} min.`);
		return ctx.scene.leave();
	} else {
		await ctx.deleteMessage();
		return ctx.reply(`Incorrect message. Please, send new ${settingName} (${settingMin}-${settingMax} min)`);
	}
});

textSettingScene.on(message(), async (ctx) => {
	await ctx.deleteMessage();
	return ctx.reply('Incorrect message. Please, send number.');
});

export default textSettingScene;
