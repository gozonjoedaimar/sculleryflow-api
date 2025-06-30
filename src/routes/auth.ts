import { Router } from 'express';
const router = Router();

import { login, logout, getUser, register } from 'app/controllers/auth';

import registerRoute from 'app/helpers/routes';

/**
 * Auth Routes
 */
const routes = {
	// NOTE: format => name: 'path'
	login: "login",
	logout: "logout",
	user: "user",
	register: "register",
};

export const route = registerRoute(routes, "auth");

/*****************
 * Expres routes *
 *****************/

// POST /auth/login
router.post(route('login').path(), login);

// POST /auth/logout
router.post(route('logout').path(), logout);

// GET /auth/user
router.get(route('user').path(), getUser);

// POST /auth/register
router.post(route('register').path(), register);

export default router;
