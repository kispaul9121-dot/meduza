# Medusa MCP Connection Report

Дата: 2026-07-13
Проект: `D:\Meduza site`

## Что подключено

Добавлен Medusa MCP remote server:

- Codex config: `C:\Users\kampo\.codex\config.toml`
- VS Code workspace config: `.vscode/mcp.json`
- MCP URL: `https://docs.medusajs.com/mcp`

Codex config section:

```toml
[mcp_servers.medusa]
url = "https://docs.medusajs.com/mcp"
```

VS Code config:

```json
{
  "servers": {
    "medusa": {
      "type": "http",
      "url": "https://docs.medusajs.com/mcp"
    }
  }
}
```

## Проверка подключения

Проверено:

- `config.toml` содержит `[mcp_servers.medusa]`: yes.
- `config.toml` содержит `https://docs.medusajs.com/mcp`: yes.
- `.vscode/mcp.json` создан: yes.
- Endpoint `https://docs.medusajs.com/mcp` отвечает как MCP endpoint: yes, обычный GET возвращает `No sessionId`.

## Ограничение текущей сессии

Текущий Codex session не подхватил новый MCP сразу: `tool_search` не показал Medusa tools после изменения config.

Это означает, что для фактического вызова Medusa MCP tools нужно:

1. Перезапустить/обновить Codex session.
2. Пройти OAuth авторизацию Medusa Cloud, когда Codex или VS Code попросит authenticate.

По официальной документации Medusa MCP доступен только для Medusa Cloud users и требует OAuth или Personal Access Key.

## Проверка проекта по Medusa MCP/docs patterns

Проверено локально:

- В `apps/backend/src/api/admin/server-configurator` нет новых `PUT/PATCH` handlers.
- Storefront использует Medusa SDK custom route call: `sdk.client.fetch`.
- Admin UI использует Medusa SDK: `sdk.client.fetch` и `sdk.admin.product.retrieve`.
- API route files в `server-configurator` не превышают 150 строк.
- Admin React files в `server-configurator` не превышают 250 строк.
- Store API остается backend-driven: `/options` использует DB + `specs_json.applicability`.

Найденный архитектурный долг:

- Admin mutation routes пока вызывают module service напрямую.
- По строгому Medusa pattern следующий этап должен вынести create/update/delete/duplicate/applicability mutations в workflows:
  `Module -> Workflow -> API Route -> Admin UI`.
- Также нужен Zod validation middleware для Admin API bodies.

## Вывод

Medusa MCP подключен в конфигурации Codex и VS Code, endpoint проверен. Полная проверка через callable MCP tools станет доступна после reload/auth текущей среды. До этого проект проверен по официальным Medusa MCP/docs patterns и локальным skills.
