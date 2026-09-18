import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type Priority = 'low' | 'medium' | 'high'
type Filter = 'all' | 'active' | 'completed'
type Task = { _id: string; title: string; priority: Priority; dueDate: string; completed: boolean }

function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [dueDate, setDueDate] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('http://localhost:5000/api/tasks')
      .then((response) => {
        if (!response.ok) throw new Error('Unable to load tasks')
        return response.json()
      })
      .then(setTasks)
      .catch(() => setTasks([]))
  }, [])

  const activeCount = tasks.filter((task) => !task.completed).length
  const completedCount = tasks.length - activeCount
  const visibleTasks = useMemo(() => tasks.filter((task) => {
    const matchesFilter = filter === 'all' || (filter === 'active' && !task.completed) || (filter === 'completed' && task.completed)
    return matchesFilter && (!search.trim() || task.title.toLowerCase().includes(search.trim().toLowerCase()))
  }), [filter, search, tasks])

  async function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!title.trim()) return
    setError('')
    try {
      const response = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), priority, dueDate }),
      })
      if (!response.ok) throw new Error('Unable to save task')
      const newTask = await response.json()
      setTasks((currentTasks) => [newTask, ...currentTasks])
      setTitle('')
      setDueDate('')
      setPriority('medium')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to save task')
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar"><a className="brand" href="/">taskroom<span>.</span></a><div className="date-label">Wednesday, September 17</div><div className="avatar">JD</div></header>
      <section className="intro"><div><p className="eyebrow">MY WORKSPACE</p><h1>A little more done.</h1><p className="subtitle">Keep the important things moving, one task at a time.</p></div><div className="progress-card"><span>Today&apos;s progress</span><strong>{completedCount} <small>of {tasks.length} done</small></strong><div className="progress-track"><div style={{ width: `${tasks.length ? (completedCount / tasks.length) * 100 : 0}%` }} /></div></div></section>
      <form className="task-form" onSubmit={addTask}><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What needs to be done?" aria-label="Task title" /><select value={priority} onChange={(event) => setPriority(event.target.value as Priority)} aria-label="Task priority"><option value="high">High priority</option><option value="medium">Medium priority</option><option value="low">Low priority</option></select><input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} aria-label="Due date" /><button type="submit">Add task <span>+</span></button></form>{error && <p role="alert">{error}</p>}
      <section className="task-panel"><div className="panel-toolbar"><div className="filters" role="tablist">{(['all', 'active', 'completed'] as Filter[]).map((option) => <button key={option} className={filter === option ? 'filter active' : 'filter'} onClick={() => setFilter(option)} type="button">{option[0].toUpperCase() + option.slice(1)} <span>{option === 'all' ? tasks.length : option === 'active' ? activeCount : completedCount}</span></button>)}</div><input className="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks" aria-label="Search tasks" /></div><div className="task-list">{visibleTasks.length === 0 ? <div className="empty-state"><strong>No tasks found</strong><span>Try a different filter or add something new.</span></div> : visibleTasks.map((task) => <article className={task.completed ? 'task completed' : 'task'} key={task._id}><button className="check" onClick={async () => { const response = await fetch(`http://localhost:5000/api/tasks/${task._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ completed: !task.completed }) }); if (response.ok) setTasks(tasks.map((item) => item._id === task._id ? { ...item, completed: !item.completed } : item)) }} type="button" aria-label="Toggle task">{task.completed ? '✓' : ''}</button><div className="task-copy"><strong>{task.title}</strong><span>{task.dueDate}</span></div><span className={`priority ${task.priority}`}>{task.priority}</span><button className="delete" onClick={async () => { const response = await fetch(`http://localhost:5000/api/tasks/${task._id}`, { method: 'DELETE' }); if (response.ok) setTasks(tasks.filter((item) => item._id !== task._id)) }} type="button">Delete</button></article>)}</div></section>
      <footer><span>{activeCount} tasks remaining</span><span>Saved in MongoDB</span></footer>
    </main>
  )
}

export default App
