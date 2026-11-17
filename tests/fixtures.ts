import { test as base } from '@playwright/test';
import { TodoPage } from '../pages/TodoPage';

type Fixtures = {
  /** Página da lista já aberta e vazia. Cada teste recebe um contexto novo, então não há estado vazando entre testes. */
  todo: TodoPage;
};

export const test = base.extend<Fixtures>({
  todo: async ({ page }, use) => {
    const todo = new TodoPage(page);
    await todo.abrir();
    await use(todo);
  },
});

export { expect } from '@playwright/test';
