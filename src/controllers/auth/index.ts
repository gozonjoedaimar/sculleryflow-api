import { ob_null } from 'app/helpers/object';
import { Auth } from 'app/providers';

const apiInfo = {
	name: 'auth',
	version: '1.0.0'
};

type FormInput = {
	email: string,
	password: string,
}

/**
 * Login
 */
export const login: RouteHandler<FormInput> = async (req, res) => {
	const { email, password } = req.body;
	const auth = await Auth();

	// login
	const { session, error } = await auth.login(email, password);

	// get session
	const { user, ...session_data } = session || {};

	res.json({
		session: ob_null(session_data),
		error: error?.message
	});
}

/**
 * Logout
 */
export const logout: RouteHandler = async (req, res) => {
	const auth = await Auth();

	// get auth bearer
	const bearer = req.headers.authorization?.split(" ")[1];

	// logout
	const { error } = await auth.logout(bearer);

	res.json({
		error: error?.message,
		success: !error ? "Successfully logged out" : undefined
	});
}

/**
 * Get user
 * TODO: remove this test route
 */
export const getUser: RouteHandler = async (req, res) => {
	const apiSpec = {
		...apiInfo,
		path: 'getUser'
	}
	const auth = await Auth();

	// get auth bearer
	const bearer = req.headers.authorization?.split(" ")[1];

	const { user } = await auth.user(bearer);

	if (!user) {
		return res.status(401).json({
			error: {
				messasge: "Not authorized"
			},
		});
	}

	return res.status(200).json({
		user,
		api: apiSpec,
	});
}

type RegisterData = {
	email: string;
	password: string;
}

/**
 * Register
 */
export const register: RouteHandler<RegisterData> = async (req, res) => {
	const auth = await Auth();
	const { email, password } = req.body;
	const { error } = await auth.register({ email, password });
	res.json({
		error: error?.message,
		success: !error ? "Successfully registered" : undefined
	})
}
