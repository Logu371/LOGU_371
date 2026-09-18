const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const mongoose = require('mongoose')

dotenv.config()

const app = express()
const port = process.env.PORT || 5000

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true)
    callback(new Error('Origin not allowed by CORS'))
  },
}))
app.use(express.json())

app.get('/', (request, response) => {
  response.json({
    name: 'Taskroom API',
    status: 'running',
    health: '/api/health',
    tasks: '/api/tasks',
  })
})

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    dueDate: { type: String, default: 'No due date' },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true },
)

const Task = mongoose.model('Task', taskSchema)

app.get('/api/health', (request, response) => {
  response.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  })
})

app.get('/api/tasks', async (request, response) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 })
    response.json(tasks)
  } catch (error) {
    response.status(500).json({ message: 'Unable to fetch tasks' })
  }
})

app.post('/api/tasks', async (request, response) => {
  try {
    const { title, priority, dueDate } = request.body
    if (!title || !title.trim()) {
      return response.status(400).json({ message: 'Task title is required' })
    }

    const task = await Task.create({
      title: title.trim(),
      priority,
      dueDate: dueDate || 'No due date',
    })
    response.status(201).json(task)
  } catch (error) {
    response.status(400).json({ message: 'Unable to create task' })
  }
})

app.patch('/api/tasks/:id', async (request, response) => {
  try {
    const task = await Task.findByIdAndUpdate(request.params.id, request.body, {
      new: true,
      runValidators: true,
    })
    if (!task) return response.status(404).json({ message: 'Task not found' })
    response.json(task)
  } catch (error) {
    response.status(400).json({ message: 'Unable to update task' })
  }
})

app.delete('/api/tasks/:id', async (request, response) => {
  try {
    const task = await Task.findByIdAndDelete(request.params.id)
    if (!task) return response.status(404).json({ message: 'Task not found' })
    response.status(204).send()
  } catch (error) {
    response.status(400).json({ message: 'Unable to delete task' })
  }
})

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})

mongoose.connect(process.env.MONGO_URI).catch((error) => {
  console.error('MongoDB connection failed:', error.message)
})