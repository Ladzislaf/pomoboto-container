import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class DataBase {
	constructor() {
		this.userSettings = {
			focusPeriod: 'focusPeriod',
			breakPeriod: 'breakPeriod',
			dayGoal: 'dayGoal',
			todayStreak: 'todayStreak',
			dayStreak: 'dayStreak',
			includeWeekends: 'includeWeekends',
		};
	}

	async createNewUser(userId) {
		const isUserExists = await this.isUserExists(userId);
		if (!isUserExists) {
			try {
				await prisma.pomoUser.create({
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
				await prisma.pomoUser.update({
					where: {
						id: `${userId}`,
					},
					data: {
						[fieldToUpdate]: (fieldToUpdate === 'includeWeekends') ? Boolean(newValue) : +newValue,
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
				await prisma.pomoUser.delete({
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
		const findUser = await prisma.pomoUser.findUnique({ where: { id: `${userId}` } });
		return Boolean(findUser);
	}

	async getUserSettings(userId) {
		const isUserExists = await this.isUserExists(userId);
		if (isUserExists) {
			try {
				const foundUser = await prisma.pomoUser.findUnique({
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
			const allUsers = await prisma.pomoUser.findMany();
			return allUsers;
		} catch (error) {
			console.error(error);
		}
	}
}

export default new DataBase();
