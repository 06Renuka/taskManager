const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const port = 3000;
app.use(bodyParser.json()); 

// app.use(express.json());
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// In-memory storage
let tasks = [];
let currentId = 1;
for (let i = 0; i < 5; i++) {
    tasks.push({ id: currentId++, title: `Task ${i + 1}`, description: `Description for task ${i + 1}` });
}

//authentication
const token = 'secret';

// Middleware for authentication
function authenticate(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (authHeader === `Bearer ${token}`) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
}
app.get('/protected', authenticate, (req, res) => {
    res.json({ message: 'This is a protected endpoint' });
});


// GET /tasks: Retrieve a list of all tasks with pagination, sorting, and filtering
app.get('/tasks',authenticate, (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    let filteredTasks = tasks;

    // Filtering by title if query parameter 'title' exists
    if (req.query.title) {
        filteredTasks = filteredTasks.filter(task =>
            task.title.toLowerCase().includes(req.query.title.toLowerCase())
        );
    }

    // Sorting by title if query parameter 'sort' exists
    if (req.query.sort === 'title') {
        filteredTasks.sort((a, b) => a.title.localeCompare(b.title));
    }

    const paginatedTasks = filteredTasks.slice(startIndex, endIndex);

    res.json({
        page,
        limit,
        totalTasks: filteredTasks.length,
        totalPages: Math.ceil(filteredTasks.length / limit),
        tasks: paginatedTasks
    });
});



// GET /tasks/:id: Retrieve a specific task by ID
app.get('/tasks/:id',authenticate, (req, res) => {
    const task = tasks.find(t => t.id === parseInt(req.params.id));
    if (!task) {
        return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
});

// POST /tasks: Create a new task
app.post('/tasks', authenticate, (req, res) => {
    const { title, description } = req.body;
    if (!title || !description) {
        return res.status(400).json({ error: 'Title and description are required' });
    }
    const newTask = { id: currentId++, title, description };
    tasks.push(newTask);
    res.status(201).json(newTask);
});

// PUT /tasks/:id: Update an existing task by ID
app.put('/tasks/:id',authenticate, (req, res) => {
    const { title, description } = req.body;
    if (!title || !description) {
        return res.status(400).json({ error: 'Title and description are required' });
    }
    const task = tasks.find(t => t.id === parseInt(req.params.id));
    if (!task) {
        return res.status(404).json({ error: 'Task not found' });
    }
    task.title = title;
    task.description = description;
    res.json(task);
});

// DELETE /tasks/:id: Delete a task by ID
app.delete('/tasks/:id',authenticate, (req, res) => {
    const taskIndex = tasks.findIndex(t => t.id === parseInt(req.params.id));
    if (taskIndex === -1) {
        return res.status(404).json({ error: 'Task not found' });
    }
    tasks.splice(taskIndex, 1);
    res.status(204).send();
});

// Start the server
app.listen(port, () => {
    console.log(`Task Manager API running at http://localhost:${port}`);
});
