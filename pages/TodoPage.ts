import { expect, type Locator, type Page } from '@playwright/test';

export type Filtro = 'All' | 'Active' | 'Completed';

/**
 * Page object da lista de tarefas.
 * Os métodos descrevem o que o usuário faz; as verificações ficam nos testes.
 */
export class TodoPage {
  readonly campoNovaTarefa: Locator;
  readonly itens: Locator;
  readonly titulos: Locator;
  readonly contador: Locator;
  readonly marcarTodas: Locator;
  readonly limparConcluidas: Locator;

  constructor(readonly page: Page) {
    this.campoNovaTarefa = page.getByPlaceholder('What needs to be done?');
    this.itens = page.getByTestId('todo-item');
    this.titulos = page.getByTestId('todo-title');
    this.contador = page.getByTestId('todo-count');
    this.marcarTodas = page.getByLabel('Mark all as complete');
    this.limparConcluidas = page.getByRole('button', { name: 'Clear completed' });
  }

  async abrir() {
    await this.page.goto('/todomvc/');
    await expect(this.campoNovaTarefa).toBeVisible();
  }

  async adicionar(...tarefas: string[]) {
    for (const tarefa of tarefas) {
      await this.campoNovaTarefa.fill(tarefa);
      await this.campoNovaTarefa.press('Enter');
    }
  }

  item(texto: string): Locator {
    return this.itens.filter({ hasText: texto });
  }

  async concluir(texto: string) {
    await this.item(texto).getByRole('checkbox').check();
  }

  async editar(textoAtual: string, novoTexto: string, tecla: 'Enter' | 'Escape' = 'Enter') {
    await this.item(textoAtual).dblclick();
    const campo = this.itens.getByRole('textbox', { name: 'Edit' });
    await campo.fill(novoTexto);
    await campo.press(tecla);
  }

  async excluir(texto: string) {
    const item = this.item(texto);
    await item.hover();
    await item.getByRole('button', { name: 'Delete' }).click();
  }

  async filtrar(filtro: Filtro) {
    await this.page.getByRole('link', { name: filtro }).click();
  }

  /** Lê o que o app gravou no navegador, para conferir a persistência sem depender da tela. */
  async tarefasSalvas(): Promise<{ title: string; completed: boolean }[]> {
    return this.page.evaluate(() => JSON.parse(localStorage.getItem('react-todos') ?? '[]'));
  }
}
