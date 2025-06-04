
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2, Plus, Check, X } from 'lucide-react';
import type { Todo, CreateTodoInput, UpdateTodoInput } from '../../server/src/schema';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Form state for new todo
  const [newTodo, setNewTodo] = useState<CreateTodoInput>({
    title: '',
    description: null
  });

  // Form state for editing
  const [editForm, setEditForm] = useState<{
    title: string;
    description: string;
  }>({
    title: '',
    description: ''
  });

  const loadTodos = useCallback(async () => {
    try {
      const result = await trpc.getTodos.query();
      setTodos(result);
    } catch (error) {
      console.error('Failed to load todos:', error);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.title.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await trpc.createTodo.mutate(newTodo);
      setTodos((prev: Todo[]) => [...prev, response]);
      setNewTodo({ title: '', description: null });
    } catch (error) {
      console.error('Failed to create todo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTodo = async (id: number) => {
    try {
      const response = await trpc.toggleTodo.mutate({ id });
      setTodos((prev: Todo[]) => 
        prev.map((todo: Todo) => 
          todo.id === id ? response : todo
        )
      );
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  const handleStartEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditForm({
      title: todo.title,
      description: todo.description || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ title: '', description: '' });
  };

  const handleSaveEdit = async () => {
    if (!editForm.title.trim() || editingId === null) return;
    
    try {
      const updateData: UpdateTodoInput = {
        id: editingId,
        title: editForm.title,
        description: editForm.description || null
      };
      
      const response = await trpc.updateTodo.mutate(updateData);
      setTodos((prev: Todo[]) => 
        prev.map((todo: Todo) => 
          todo.id === editingId ? response : todo
        )
      );
      setEditingId(null);
      setEditForm({ title: '', description: '' });
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  };

  const handleDeleteTodo = async (id: number) => {
    try {
      await trpc.deleteTodo.mutate({ id });
      setTodos((prev: Todo[]) => prev.filter((todo: Todo) => todo.id !== id));
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const completedTodos = todos.filter((todo: Todo) => todo.completed);
  const incompleteTodos = todos.filter((todo: Todo) => !todo.completed);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-2xl p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-light text-gray-800 mb-2">Todo List</h1>
          <p className="text-gray-600">Keep track of your tasks</p>
        </div>

        {/* Add new todo form */}
        <Card className="mb-8 shadow-sm">
          <CardContent className="p-6">
            <form onSubmit={handleCreateTodo} className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a new task..."
                  value={newTodo.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewTodo((prev: CreateTodoInput) => ({ ...prev, title: e.target.value }))
                  }
                  className="flex-1"
                  required
                />
                <Button type="submit" disabled={isLoading} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                placeholder="Description (optional)"
                value={newTodo.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setNewTodo((prev: CreateTodoInput) => ({
                    ...prev,
                    description: e.target.value || null
                  }))
                }
                className="resize-none"
                rows={2}
              />
            </form>
          </CardContent>
        </Card>

        {/* Todo list */}
        <div className="space-y-6">
          {/* Incomplete todos */}
          {incompleteTodos.length > 0 && (
            <div>
              <h2 className="text-lg font-medium text-gray-700 mb-3">
                Tasks ({incompleteTodos.length})
              </h2>
              <div className="space-y-2">
                {incompleteTodos.map((todo: Todo) => (
                  <Card key={todo.id} className="shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      {editingId === todo.id ? (
                        <div className="space-y-3">
                          <Input
                            value={editForm.title}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setEditForm((prev) => ({ ...prev, title: e.target.value }))
                            }
                            className="font-medium"
                          />
                          <Textarea
                            value={editForm.description}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                              setEditForm((prev) => ({ ...prev, description: e.target.value }))
                            }
                            placeholder="Description (optional)"
                            className="resize-none text-sm"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <Button onClick={handleSaveEdit} size="sm" variant="default">
                              <Check className="h-3 w-3 mr-1" />
                              Save
                            </Button>
                            <Button onClick={handleCancelEdit} size="sm" variant="outline">
                              <X className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={todo.completed}
                            onCheckedChange={() => handleToggleTodo(todo.id)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-800 break-words">
                              {todo.title}
                            </h3>
                            {todo.description && (
                              <p className="text-sm text-gray-600 mt-1 break-words">
                                {todo.description}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-2">
                              Created {todo.created_at.toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              onClick={() => handleStartEdit(todo)}
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:text-red-700">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Task</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{todo.title}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteTodo(todo.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Completed todos */}
          {completedTodos.length > 0 && (
            <div>
              <h2 className="text-lg font-medium text-gray-700 mb-3">
                Completed ({completedTodos.length})
              </h2>
              <div className="space-y-2">
                {completedTodos.map((todo: Todo) => (
                  <Card key={todo.id} className="shadow-sm opacity-75">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={todo.completed}
                          onCheckedChange={() => handleToggleTodo(todo.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-600 line-through break-words">
                            {todo.title}
                          </h3>
                          {todo.description && (
                            <p className="text-sm text-gray-500 mt-1 line-through break-words">
                              {todo.description}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            Completed {todo.updated_at.toLocaleDateString()}
                          </p>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:text-red-700">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Task</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{todo.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteTodo(todo.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {todos.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-600 mb-1">No tasks yet</h3>
              <p className="text-gray-500">Add your first task above to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
