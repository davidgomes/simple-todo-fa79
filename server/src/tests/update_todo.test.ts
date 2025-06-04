
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type CreateTodoInput, type UpdateTodoInput } from '../schema';
import { updateTodo } from '../handlers/update_todo';
import { eq } from 'drizzle-orm';

// Test inputs
const testTodo: CreateTodoInput = {
  title: 'Original Todo',
  description: 'Original description'
};

const updateInput: UpdateTodoInput = {
  id: 1,
  title: 'Updated Todo',
  description: 'Updated description',
  completed: true
};

describe('updateTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a todo with all fields', async () => {
    // Create a todo first
    const createResult = await db.insert(todosTable)
      .values({
        title: testTodo.title,
        description: testTodo.description,
        completed: false
      })
      .returning()
      .execute();

    const todoId = createResult[0].id;

    // Update the todo
    const result = await updateTodo({
      id: todoId,
      title: 'Updated Todo',
      description: 'Updated description',
      completed: true
    });

    // Verify updated fields
    expect(result.id).toEqual(todoId);
    expect(result.title).toEqual('Updated Todo');
    expect(result.description).toEqual('Updated description');
    expect(result.completed).toEqual(true);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    // Create a todo first
    const createResult = await db.insert(todosTable)
      .values({
        title: testTodo.title,
        description: testTodo.description,
        completed: false
      })
      .returning()
      .execute();

    const todoId = createResult[0].id;
    const originalCreatedAt = createResult[0].created_at;

    // Update only the title
    const result = await updateTodo({
      id: todoId,
      title: 'Only Title Updated'
    });

    // Verify only title was updated
    expect(result.title).toEqual('Only Title Updated');
    expect(result.description).toEqual(testTodo.description!); // Non-null assertion since we know it's defined
    expect(result.completed).toEqual(false); // Should remain unchanged
    expect(result.created_at).toEqual(originalCreatedAt); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated todo to database', async () => {
    // Create a todo first
    const createResult = await db.insert(todosTable)
      .values({
        title: testTodo.title,
        description: testTodo.description,
        completed: false
      })
      .returning()
      .execute();

    const todoId = createResult[0].id;

    // Update the todo
    await updateTodo({
      id: todoId,
      title: 'Database Updated Todo',
      completed: true
    });

    // Query database to verify changes
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].title).toEqual('Database Updated Todo');
    expect(todos[0].completed).toEqual(true);
    expect(todos[0].description).toEqual(testTodo.description!); // Non-null assertion since we know it's defined
  });

  it('should update completed status only', async () => {
    // Create a todo first
    const createResult = await db.insert(todosTable)
      .values({
        title: testTodo.title,
        description: testTodo.description,
        completed: false
      })
      .returning()
      .execute();

    const todoId = createResult[0].id;

    // Update only completion status
    const result = await updateTodo({
      id: todoId,
      completed: true
    });

    // Verify only completed status was updated
    expect(result.completed).toEqual(true);
    expect(result.title).toEqual(testTodo.title);
    expect(result.description).toEqual(testTodo.description!); // Non-null assertion since we know it's defined
  });

  it('should throw error for non-existent todo', async () => {
    // Try to update a non-existent todo
    expect(async () => {
      await updateTodo({
        id: 999,
        title: 'Non-existent Todo'
      });
    }).toThrow(/Todo with id 999 not found/);
  });

  it('should handle null description update', async () => {
    // Create a todo first
    const createResult = await db.insert(todosTable)
      .values({
        title: testTodo.title,
        description: testTodo.description,
        completed: false
      })
      .returning()
      .execute();

    const todoId = createResult[0].id;

    // Update description to null
    const result = await updateTodo({
      id: todoId,
      description: null
    });

    // Verify description is null
    expect(result.description).toBeNull();
    expect(result.title).toEqual(testTodo.title); // Should remain unchanged
  });
});
