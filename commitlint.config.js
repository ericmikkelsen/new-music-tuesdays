/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
	extends: ['@commitlint/config-conventional'],
	rules: {
		// URLs appended automatically (e.g. Agent-Logs-Url) can exceed 100 chars
		'body-max-line-length': [0, 'always', Infinity]
	}
};
