import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { subDays } from 'date-fns';
import jwt from 'jsonwebtoken';

import User from 'app/models/User';
import Token from 'app/models/Token';

type UserData = {
	email?: string;
}

export const login = async (email: string, password: string) => {
	// login logic
	const user = await User.findOne({ email }).lean().exec().catch(e => console.log(e));
	let session = null;
	let error = null;

	if (user && verifyHash(password, user.password)) {
		const { token, refreshToken } = await generateSession(email);
		session = {
			access_token: token,
			refresh_token: refreshToken
		}
	}
	else {
		error = {
			message: "Invalid credentials"
		}
	}

	return {
		session,
		error,
	};
};

export const logout = async (bearer?: string) => {
	// logout logic
	const active = await user(bearer || '');

	if (!active?.user?.email) {
		return {
			error: new Error("Invalid session")
		}
	}

	await Token.deleteMany({ email: active.user.email }).exec().catch(e => console.log(e));

	return {
		success: true
	};
};

type Verified = { email: string; } | null;

export const user = async (bearer: string): Promise<{ user: UserData | undefined }> => {
	let verified: Verified = null;
	// get auth bearer
	try {
		verified = jwt.verify(bearer, process.env.JWT_SECRET) as Verified;
	}
	catch (e) {
		// if (e instanceof Error) {
		// 	console.log('jwt error', e.message);
		// }
	}

	const active = await Token.exists({ token: bearer, email: verified?.email }).exec().catch(e => console.log(e));

	return {
		user: active ? { email: verified?.email } : undefined,
	};
};

type RegisterData = {
	email: string;
	name: string;
	password: string;
}

export const register = async ({ password, ...data }: RegisterData) => {
	// check if user exists
	const exists = await User.exists({ email: data.email });

	if (exists) {
		return {
			error: new Error("Email already taken.")
		}
	}

	// register logic
	const hash = hashPassword(password);

	const user = new User({
		...data,
		password: hash,
	});

	const saved = await user.save();

	return {
		data: { session: saved },
	};
}

/**
 * Hash password
 * 
 * Prepare password to be stored in database
 */
function hashPassword(value: string) {
	// hash password via nodejs
	const salt = bcrypt.genSaltSync(10);
	return bcrypt.hashSync(value, salt);
}

/**
 * Verify password
 * 
 * @param value Raw password retrieved from user form
 * @param hash Hashed password retrieved from database
 */
function verifyHash(value: string, hash: string) {
	return bcrypt.compareSync(value, hash);
}

/**
 * Generate jwt session
 */
async function generateSession(email: string) {
	// generate jwt token
	const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '30m' });

	const accessToken = new Token({
		token,
		email,
		type: 'access'
	});

	await accessToken.save();

	// generate refresh token
	const refreshToken = crypto.randomBytes(64).toString('hex');

	const tokenData = new Token({
		token: refreshToken,
		email,
	});

	await tokenData.save();

	return { token, refreshToken };
}

/**
 * Refresh jwt session
 */
async function refreshSession(oldRefreshToken: string, email: string) {
	// check token in database
	const savedToken = await Token.findOne({ token: oldRefreshToken, email, date: { $gte: subDays(new Date(), 1) } }).lean().exec();

	if (!savedToken) {
		return {
			error: "Invalid refresh token",
			token: null,
			refreshToken: null
		}
	}

	return generateSession(email);
}
