import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class DataBase {
	constructor() {
		this.userSettings = {
			focusPeriod: 'focusPeriod',
			breakPeriod: 'breakPeriod',
			dayGoal: 'dayGoal',
			todayStreak: 'todayStreak',
			currentDayStreak: 'currentDayStreak',
			bestDayStreak: 'bestDayStreak',
			includeWeekends: 'includeWeekends',
		};
	}

	async createNewUser(userId) {
		const isUserExists = await this.isUserExists(userId);
		if (!isUserExists) {
			try {
				await prisma.user.create({
					data: {
						id: `${userId}`,
					},
				});
			} catch (error) {
				console.error(error);
			}
		} else {
			console.log(`User with id: ${userId} is already exists.[createNewUser]`);
		}
	}

	async updateUserSettings(userId, fieldToUpdate, newValue) {
		if (!(fieldToUpdate in this.userSettings)) {
			console.log(`User setting: ${fieldToUpdate} was not found.[updateUserSettings]`);
		}
		const isUserExists = await this.isUserExists(userId);
		if (isUserExists) {
			try {
				await prisma.user.update({
					where: {
						id: `${userId}`,
					},
					data: {
						[fieldToUpdate]: fieldToUpdate === 'includeWeekends' ? Boolean(newValue) : +newValue,
					},
				});
			} catch (error) {
				console.error(error);
			}
		} else {
			console.log(`User with id: ${userId} was not found.[updateUserSettings]`);
		}
	}

	async deleteUser(userId) {
		const isUserExists = await this.isUserExists(userId);
		if (isUserExists) {
			try {
				await prisma.user.delete({
					where: {
						id: `${userId}`,
					},
				});
			} catch (error) {
				console.error(error);
			}
		} else {
			console.log(`User with id: ${userId} was not found.[deleteUser]`);
		}
	}

	async isUserExists(userId) {
		try {
			const findUser = await prisma.user.findUnique({ where: { id: `${userId}` } });
			return Boolean(findUser);
		} catch (error) {
			console.error(error);
		}
	}

	async getUserSettings(userId) {
		const isUserExists = await this.isUserExists(userId);
		if (isUserExists) {
			try {
				const foundUser = await prisma.user.findUnique({
					where: {
						id: `${userId}`,
					},
				});
				return foundUser;
			} catch (error) {
				console.error(error);
			}
		} else {
			console.log(`User with id: ${userId} was not found.[getUserSettings]`);
		}
	}

	async getAllUsers() {
		try {
			const allUsers = await prisma.user.findMany();
			return allUsers;
		} catch (error) {
			console.error(error);
		}
	}

	async isCompletedToday(userId) {
		const isUserExists = await this.isUserExists(userId);
		if (isUserExists) {
			const foundCompletedDay = await prisma.completedDays.findFirst({
				where: {
					userId: `${userId}`,
					day: new Date(),
				},
			});
			if (foundCompletedDay) {
				console.log(`User with id: ${userId} is already completed today.[isTodayCompleted]`);
				return true;
			} else {
				return false;
			}
		} else {
			console.log(`User with id: ${userId} was not found.[isTodayCompleted]`);
			return false;
		}
	}

	// :true - successfully added today completion
	// :false - user is already completed today
	async completeDay(userId) {
		const isUserExists = await this.isUserExists(userId);
		if (isUserExists) {
			const isUserCompletedToday = await this.isCompletedToday(userId);
			if (!isUserCompletedToday) {
				await prisma.completedDays.create({
					data: {
						userId: `${userId}`,
					},
				});
				return true;
			} else {
				return false;
			}
		} else {
			console.log(`User with id: ${userId} was not found.[completeDay]`);
			return false;
		}
	}

	async getCompletedDays(userId) {
		const isUserExists = await this.isUserExists(userId);
		if (isUserExists) {
			try {
				const foundDays = await prisma.completedDays.findMany({
					where: {
						userId: `${userId}`,
					},
					orderBy: {
						day: 'desc',
					},
				});
				return foundDays;
			} catch (error) {
				console.error(error);
			}
		} else {
			console.log(`User with id: ${userId} was not found.[getCompletedDays]`);
		}
	}
}

export default new DataBase();
