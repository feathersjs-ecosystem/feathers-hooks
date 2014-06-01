var _ = require('lodash');
var assert = require('assert');

var utils = require('../lib/utils');

function hookMaker(name) {
	return function() {
		return utils.hookObject(name, arguments);
	};
}

describe('hook utilities', function () {
	it('.hookObject', function() {
		// find
		assert.deepEqual(hookMaker('find')({ some: 'thing' }, _.noop), {
			params: { some: 'thing' },
			method: 'find',
			callback: _.noop
		});

		// get
		assert.deepEqual(hookMaker('get')(1, { some: 'thing' }, _.noop), {
			id: 1,
			params: { some: 'thing' },
			method: 'get',
			callback: _.noop
		});

		// remove
		assert.deepEqual(hookMaker('remove')(1, { some: 'thing' }, _.noop), {
			id: 1,
			params: { some: 'thing' },
			method: 'remove',
			callback: _.noop
		});

		// create
		assert.deepEqual(hookMaker('create')({ my: 'data' }, { some: 'thing' }, _.noop), {
			data: { my: 'data' },
			params: { some: 'thing' },
			method: 'create',
			callback: _.noop
		});

		// update
		assert.deepEqual(hookMaker('update')(2, { my: 'data' }, { some: 'thing' }, _.noop), {
			id: 2,
			data: { my: 'data' },
			params: { some: 'thing' },
			method: 'update',
			callback: _.noop
		});

		// patch
		assert.deepEqual(hookMaker('patch')(2, { my: 'data' }, { some: 'thing' }, _.noop), {
			id: 2,
			data: { my: 'data' },
			params: { some: 'thing' },
			method: 'patch',
			callback: _.noop
		});
	});

	it('.makeArguments', function() {
		var args = utils.makeArguments({
			id: 2,
			data: { my: 'data' },
			params: { some: 'thing' },
			method: 'update',
			callback: _.noop
		});

		assert.deepEqual(args, [2, { my: 'data' }, { some: 'thing' }, _.noop]);

		args = utils.makeArguments({
			params: { some: 'thing' },
			method: 'find',
			callback: _.noop
		});

		assert.deepEqual(args, [{ some: 'thing' }, _.noop]);
	});
});
