import { test, expect } from './fixtures';

test.describe('Cadastro', () => {
  test('adiciona tarefas na ordem em que foram digitadas', async ({ todo }) => {
    await todo.adicionar('Revisar plano de teste', 'Rodar regressão', 'Publicar relatório');

    await expect(todo.titulos).toHaveText(['Revisar plano de teste', 'Rodar regressão', 'Publicar relatório']);
    await expect(todo.contador).toHaveText('3 items left');
  });

  test('limpa o campo depois de adicionar', async ({ todo }) => {
    await todo.adicionar('Conferir evidência');

    await expect(todo.campoNovaTarefa).toBeEmpty();
  });

  test('não cadastra tarefa só com espaços', async ({ todo }) => {
    await todo.adicionar('   ');

    await expect(todo.itens).toHaveCount(0);
  });

  test('remove espaços nas pontas do texto', async ({ todo }) => {
    await todo.adicionar('   Validar migração   ');

    await expect(todo.titulos).toHaveText(['Validar migração']);
  });
});

test.describe('Conclusão', () => {
  test.beforeEach(async ({ todo }) => {
    await todo.adicionar('Revisar plano de teste', 'Rodar regressão', 'Publicar relatório');
  });

  test('concluir uma tarefa atualiza o item e o contador', async ({ todo }) => {
    await todo.concluir('Rodar regressão');

    await expect(todo.item('Rodar regressão')).toHaveClass(/completed/);
    await expect(todo.contador).toHaveText('2 items left');
  });

  test('marcar todas e desmarcar todas', async ({ todo }) => {
    await todo.marcarTodas.check();
    await expect(todo.itens).toHaveClass([/completed/, /completed/, /completed/]);
    await expect(todo.contador).toHaveText('0 items left');

    await todo.marcarTodas.uncheck();
    await expect(todo.itens).toHaveClass([/^(?!.*completed)/, /^(?!.*completed)/, /^(?!.*completed)/]);
  });

  test('limpar concluídas remove só as concluídas', async ({ todo }) => {
    await todo.concluir('Revisar plano de teste');
    await todo.limparConcluidas.click();

    await expect(todo.titulos).toHaveText(['Rodar regressão', 'Publicar relatório']);
    await expect(todo.limparConcluidas).toBeHidden();
  });
});

test.describe('Filtros', () => {
  // Os três filtros têm a mesma estrutura de teste; muda só a entrada e o esperado.
  const casos = [
    { filtro: 'All', esperado: ['Revisar plano de teste', 'Rodar regressão', 'Publicar relatório'] },
    { filtro: 'Active', esperado: ['Revisar plano de teste', 'Publicar relatório'] },
    { filtro: 'Completed', esperado: ['Rodar regressão'] },
  ] as const;

  for (const { filtro, esperado } of casos) {
    test(`filtro ${filtro} mostra só o que deveria`, async ({ todo }) => {
      await todo.adicionar('Revisar plano de teste', 'Rodar regressão', 'Publicar relatório');
      await todo.concluir('Rodar regressão');

      await todo.filtrar(filtro);

      await expect(todo.titulos).toHaveText([...esperado]);
      await expect(todo.page).toHaveURL(new RegExp(`#/${filtro === 'All' ? '$' : filtro.toLowerCase()}`));
    });
  }
});

test.describe('Edição', () => {
  test.beforeEach(async ({ todo }) => {
    await todo.adicionar('Rodar regressão');
  });

  test('Enter salva o texto novo', async ({ todo }) => {
    await todo.editar('Rodar regressão', 'Rodar regressão completa');

    await expect(todo.titulos).toHaveText(['Rodar regressão completa']);
  });

  test('Escape cancela a edição', async ({ todo }) => {
    await todo.editar('Rodar regressão', 'texto que não deve ficar', 'Escape');

    await expect(todo.titulos).toHaveText(['Rodar regressão']);
  });

  test('apagar todo o texto exclui a tarefa', async ({ todo }) => {
    await todo.editar('Rodar regressão', '');

    await expect(todo.itens).toHaveCount(0);
  });
});

test.describe('Persistência', () => {
  test('tarefas e estado continuam lá depois de recarregar', async ({ todo }) => {
    await todo.adicionar('Revisar plano de teste', 'Rodar regressão');
    await todo.concluir('Revisar plano de teste');

    // Confere o dado gravado, não só a tela.
    await expect.poll(() => todo.tarefasSalvas()).toEqual([
      expect.objectContaining({ title: 'Revisar plano de teste', completed: true }),
      expect.objectContaining({ title: 'Rodar regressão', completed: false }),
    ]);

    await todo.page.reload();

    await expect(todo.titulos).toHaveText(['Revisar plano de teste', 'Rodar regressão']);
    await expect(todo.item('Revisar plano de teste')).toHaveClass(/completed/);
  });

  test('excluir uma tarefa remove também do armazenamento', async ({ todo }) => {
    await todo.adicionar('Revisar plano de teste', 'Rodar regressão');
    await todo.excluir('Revisar plano de teste');

    await expect(todo.titulos).toHaveText(['Rodar regressão']);
    await expect.poll(async () => (await todo.tarefasSalvas()).map((t) => t.title)).toEqual(['Rodar regressão']);
  });
});
