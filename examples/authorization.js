// A small example application that returns a set of preset Todos
// and then adds authorization with a simple user that is set by setting the ?user=<username> query parameter.
// Also post-processes the Todos and adds the username to each Todo
var feathers = require('feathers');
var hooks = require('../lib/hooks');

var app = feathers()
	.configure(feathers.rest())
	.configure(hooks())
	.use(function(req, res, next) {
		// Just some dummy user. In the real-world, for example using
		// PassportJS you'd probably want to set
		// req.feathers.user = req.user;
		// Here we just take the user query parameter if it is set
		if(req.query.user) {
			req.feathers.user = {
				name: req.query.user
			};
		}

		next();
	})
	// A service that returns some todos
	.use('/todos', {
		todos: [{
			id: 0,
			description: 'You have to do dishes'
		}, {
			id: 1,
			description: 'Learn Feathers'
		}, {
			id: 2,
			description: 'Conquer the world'
		}],

		// Return all todos from this service
		find: function(params, callback) {
			callback(null, this.todos);
		}
	})
	// Add an error handler that prints our error as JSON
	.use(function(err, req, res, next) {
		res.status(500);
		res.json({ message: err.message });
	});

//Get the wrapped service object (which will have the .before() and .after() methods)
var todoService = app.service('todos');

// This `before` hook checks if a user is set
todoService.before({
	find: function(hook) {
		// If no user is set, throw an error
		if(!hook.params.user) {
			throw new Error('You are not authorized. Set the ?user=username parameter.');
		}
	}
});

// This `after` hook sets the username for each Todo
todoService.after({
	find: function(hook) {
		hook.result.forEach(function(todo) {
			todo.user = hook.params.user.name;
		});
	}
});

app.listen(8080);

console.log('App listening on 127.0.0.1:8080');
