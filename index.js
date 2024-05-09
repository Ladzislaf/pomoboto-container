require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { CronJob } = require ('cron');

const PomoBoto = new TelegramBot(process.env.API_KEY, { polling: true });

class UserSettings {
	constructor() {
		this.focusPeriod = 2; // mins
		this.breakPeriod = 1; // mins
		this.todayStreak = 0; // mins
		this.dayGoal = 3; // hours
		this.daysStreak = 0; // days
	}
}

const Users = {};

const showMenuKeyboard = (chatId) => {
	return PomoBoto.sendMessage(chatId, `Bot menu:`, {
		reply_markup: {
			inline_keyboard: [
				[{ text: 'Start focus session', callback_data: 'startFocus' }],
				[
					{ text: 'Focus period', callback_data: 'focusPeriod' },
					{ text: 'Break period', callback_data: 'breakPeriod' },
				],
				[
					{ text: 'Day goal', callback_data: 'dayGoal' },
					{ text: 'Show settings', callback_data: 'showSettings' },
				],
				[{ text: 'Close menu', callback_data: 'closeMenu' }],
			],
		},
	});
};

const startFocus = async (userId, chatId) => {
	const focusPeriod = Users[userId].focusPeriod;
	const breakPeriod = Users[userId].breakPeriod;
	await PomoBoto.sendMessage(chatId, `Focus session started! (${focusPeriod} mins)`);

	setTimeout(async () => {
		await PomoBoto.sendMessage(chatId, `Focus session finished! Have a break! (${breakPeriod} mins)`);
		Users[userId].todayStreak += focusPeriod;
		if (Users[userId].todayStreak >= Users[userId].dayGoal) {
			Users[userId].daysStreak++;
		}

		setTimeout(async () => {
			return PomoBoto.sendMessage(chatId, `Break finished! Start focus session from the menu now!`);
		}, breakPeriod * 15 * 1000);
	}, focusPeriod * 15 * 1000);
};

const startPomoBoto = () => {
	PomoBoto.setMyCommands([
		{ command: '/menu', description: 'Display bot menu' },
		{ command: '/playlist', description: 'Spotify playlist' },
		{ command: '/help', description: 'Help' },
	]);

	PomoBoto.on('message', async (msg) => {
		const message = msg.text;
		const chatId = msg.chat.id;
		const userId = msg.from.id;

		try {
			if (message === '/start') {
				if (!Users[userId]) {
					Users[userId] = new UserSettings();
				}
				new CronJob(
					'0 0 * * * *',
					function () {
						if (Users[userId].todayStreak < Users[userId].dayGoal) {
							Users[userId].daysStreak = 0;
						}
					},
					null,
					true
				);
				return showMenuKeyboard(chatId);
			} else if (message === '/playlist') {
				return PomoBoto.sendMessage(
					chatId,
					'To focus better, you can use a spotify [Playlist](https://open.spotify.com/playlist/0vvXsWCC9xrXsKd4FyS8kM?si=83d9e98fa29a48cd)',
					{
						parse_mode: 'MarkdownV2',
					}
				);
			} else if (message === '/menu') {
				return showMenuKeyboard(chatId);
			} else if (message === 'Start focus session') {
				return PomoBoto.sendMessage(chatId, 'Starting...');
			} else if (message === 'Close menu') {
				return PomoBoto.sendMessage(chatId, 'Menu closed', {
					reply_markup: { remove_keyboard: true },
				});
			} else if (message === 'help') {
				return PomoBoto.sendMessage(chatId, "Command's description here... [In development]");
			}

			// return PomoBoto.sendMessage(chatId, "I don't understand what you mean");
		} catch (error) {
			console.log(error);
		}
	});

	PomoBoto.on('callback_query', async (ctx) => {
		const chatId = ctx.message.chat.id;
		const userId = ctx.from.id;

		try {
			if (ctx.data === 'startFocus') {
				await startFocus(userId, chatId);
			} else if (ctx.data === 'focusPeriod') {
				await PomoBoto.sendMessage(chatId, `Current focus period: ${Users[userId].focusPeriod} minutes. Send new focus period... (15-120 minutes)`, {
					reply_markup: { force_reply: true },
				}).then((setGoalMsg) => {
					PomoBoto.onReplyToMessage(chatId, setGoalMsg.message_id, async (msg) => {
						await PomoBoto.deleteMessage(chatId, msg.message_id);
						await PomoBoto.deleteMessage(chatId, msg.message_id - 1);
						if (msg.text >= 15 && msg.text <= 120) {
							Users[userId].focusPeriod = msg.text;
							return PomoBoto.sendMessage(chatId, `Success! New focus period: ${msg.text} minutes`);
						} else {
							return PomoBoto.sendMessage(chatId, 'Incorrect message. Please, send focus period (15-120 minutes)');
						}
					});
				});
			} else if (ctx.data === 'breakPeriod') {
				await PomoBoto.sendMessage(chatId, `Current break period: ${Users[userId].breakPeriod} minutes. Send new break period... (3-30 minutes)`, {
					reply_markup: { force_reply: true },
				}).then((setGoalMsg) => {
					PomoBoto.onReplyToMessage(chatId, setGoalMsg.message_id, async (msg) => {
						await PomoBoto.deleteMessage(chatId, msg.message_id);
						await PomoBoto.deleteMessage(chatId, msg.message_id - 1);
						if (msg.text >= 3 && msg.text <= 30) {
							Users[userId].breakPeriod = msg.text;
							return PomoBoto.sendMessage(chatId, `Success! New break period: ${msg.text} minutes`);
						} else {
							return PomoBoto.sendMessage(chatId, 'Incorrect message. Please, send break period (3-30 minutes)');
						}
					});
				});
			} else if (ctx.data === 'dayGoal') {
				await PomoBoto.sendMessage(chatId, `Current goal: ${Users[userId].dayGoal} hours a day. Send new goal here... (1-12 hours)`, {
					reply_markup: { force_reply: true },
				}).then((setGoalMsg) => {
					PomoBoto.onReplyToMessage(chatId, setGoalMsg.message_id, async (msg) => {
						await PomoBoto.deleteMessage(chatId, msg.message_id);
						await PomoBoto.deleteMessage(chatId, msg.message_id - 1);
						if (msg.text >= 1 && msg.text <= 12) {
							Users[userId].dayGoal = msg.text;
							return PomoBoto.sendMessage(chatId, `Success! New goal: ${msg.text} hours`);
						} else {
							return PomoBoto.sendMessage(chatId, 'Incorrect message. Please, send amount of hours (1-12)');
						}
					});
				});
			} else if (ctx.data === 'showSettings') {
				// TODO show all user stats
				return
			} else if (ctx.data === 'closeMenu') {
				await PomoBoto.deleteMessage(chatId, ctx.message.message_id);
				return PomoBoto.deleteMessage(chatId, ctx.message.message_id - 1);
			}
		} catch (error) {
			console.log(error);
		}
	});
};

startPomoBoto();
