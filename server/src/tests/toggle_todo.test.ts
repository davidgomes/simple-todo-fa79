
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type ToggleTodoInput } from '../schema';
import { toggleTodo } from '../handlers/toggle_todo';
import { eq } from 'drizzle-orm';

// Test input
const testInput: ToggleTodoInput = {
  id: 1
};

describe('toggleTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should toggle todo from false to true', async () => {
    // Create a todo that is not completed
    const insertResult = await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'A todo for testing',
        completed: false
      })
      .returning()
      .execute();

    const todoId = insertResult[0].id;

    const result = await toggleTodo({ id: todoId });

    // Should toggle completed to true
    expect(result.completed).toBe(true);
    expect(result.id).toEqual(todoId);
    expect(result.title).toEqual('Test Todo');
    expect(result.description).toEqual('A todo for testing');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should toggle todo from true to false', async () => {
    // Create a todo that is completed
    const insertResult = await db.insert(todosTable)
      .values({
        title: 'Completed Todo',
        description: 'A completed todo for testing',
        completed: true
      })
      .returning()
      .execute();

    const todoId = insertResult[0].id;

    const result = await toggleTodo({ id: todoId });

    // Should toggle completed to false
    expect(result.completed).toBe(false);
    expect(result.id).toEqual(todoId);
    expect(result.title).toEqual('Completed Todo');
    expect(result.description).toEqual('A completed todo for testing');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update the database record', async () => {
    // Create a todo
    const insertResult = await db.insert(todosTable)
      .values({
        title: 'Database Test Todo',
        completed: false
      })
      .returning()
      .execute();

    const todoId = insertResult[0].id;

    await toggleTodo({ id: todoId });

    // Verify the database was updated
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].completed).toBe(true);
    expect(todos[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent todo', async () => {
    await expect(toggleTodo({ id: 999 })).rejects.toThrow(/Todo with id 999 not found/i);
  });

  it('should update updated_at timestamp', async () => {
    // Create a todo
    const insertResult = await db.insert(todosTable)
      .values({
        title: 'Timestamp Test Todo',
        completed: false
      })
      .returning()
      .execute();

    const todoId = insertResult[0].id;
    const originalUpdatedAt = insertResult[0].updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const result = await toggleTodo({ id: todoId });

    // The updated_at should be different (newer)
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });
});
