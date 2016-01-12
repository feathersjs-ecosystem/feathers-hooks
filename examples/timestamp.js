// Example that adds a hook which adds a createdAt and updatedAt property to
// a new or updated Todo
var feathers = require('feathers');
var hooks = require('../lib/hooks');
var _ = require('lodash');

var app = feathers()
	.configure(feathers.rest())
	.configure(hooks())
	.use('/todos', {
		id: 0,
		todos: {},

		get: function(id, params, callback) {
			if(!this.todos[id]) {
				return callback(new Error('Todo not found'));
			}

			return callback(null, this.todos[id]);
		},

		// Return all todos from this service
		find: function(params, callback) {
			callback(null, _.values(this.todos));
		},

		// Create a new Todo with the given data
		create: function(data, params, callback) {
			data.id = ++this.id;
			this.todos[data.id] = data;

			callback(null, data);
		},

		// Update (extend) an existing Todo
		update: function(id, data, params, callback) {
			if(!this.todos[id]) {
				return callback(new Error('Todo not found'));
			}

			_.extend(this.todos[id], data);

			callback(null, this.todos[id]);
		}
	});

app.listen(8080);
console.log('App listening on 127.0.0.1:8080');

// Get the wrapped service object which will be used in the other exapmles
var todoService = app.service('todos');

// Register a hook that adds a createdAt and updatedAt timestamp
todoService.before({
	create: function(hook) {
		hook.data.createdAt = new Date();
	},

	update: function(hook) {
		hook.data.updatedAt = new Date();
	}
});

// Create a Todo already so that it doesn't look so empty
todoService.create({
	description: 'Do something :)'
}, {}, function() {});
