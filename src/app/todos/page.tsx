import { prisma } from '@/lib/prisma'

export default async function TodosPage() {
  const todos = await prisma.todo.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return (
    <main style={{ padding: '2rem' }}>
      <h1>TODO 一覧({todos.length} 件)</h1>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            {todo.done ? '✅' : '⬜'} {todo.title}
          </li>
        ))}
      </ul>
    </main>
  )
}