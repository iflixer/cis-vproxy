// Хранилище данных в памяти
let items = [];
let nextId = 1;

// Роутер
function router(r) {
    const routes = {
        "GET /app2/items": getItems,
        "POST /app2/items": createItem,
        "PUT /app2/items": updateItem,
        "DELETE /app2/items": deleteItem
    };

    const key = `${r.method} ${r.uri.split("?")[0]}`;
    if (routes[key]) {
        routes[key](r);
    } else {
        r.headersOut['Content-Type'] = 'application/json';
        r.return(404, JSON.stringify({ error: "Not Found" }));
    }
}

// Получить все или один элемент
function getItems(r) {
    r.headersOut['Content-Type'] = 'application/json';
    if (r.args.id) {
        const item = items.find(i => i.id == r.args.id);
        if (item) {
            r.return(200, JSON.stringify(item));
        } else {
            r.return(404, JSON.stringify({ error: "Item not found" }));
        }
    } else {
        r.return(200, JSON.stringify(items));
    }
}

// Создать элемент
function createItem(r) {
    let body = "";
    r.on('upload', chunk => body += chunk);
    r.on('uploadend', () => {
        try {
            const data = JSON.parse(body);
            if (!data.name) {
                r.return(400, JSON.stringify({ error: "Missing 'name'" }));
                return;
            }
            const item = { id: nextId++, name: data.name };
            items.push(item);
            r.headersOut['Content-Type'] = 'application/json';
            r.return(201, JSON.stringify(item));
        } catch (e) {
            r.return(400, JSON.stringify({ error: "Invalid JSON" }));
        }
    });
}

// Обновить элемент
function updateItem(r) {
    if (!r.args.id) {
        r.return(400, JSON.stringify({ error: "Missing 'id'" }));
        return;
    }
    let body = "";
    r.on('upload', chunk => body += chunk);
    r.on('uploadend', () => {
        try {
            const data = JSON.parse(body);
            const idx = items.findIndex(i => i.id == r.args.id);
            if (idx === -1) {
                r.return(404, JSON.stringify({ error: "Item not found" }));
                return;
            }
            if (data.name) items[idx].name = data.name;
            r.headersOut['Content-Type'] = 'application/json';
            r.return(200, JSON.stringify(items[idx]));
        } catch (e) {
            r.return(400, JSON.stringify({ error: "Invalid JSON" }));
        }
    });
}

// Удалить элемент
function deleteItem(r) {
    if (!r.args.id) {
        r.return(400, JSON.stringify({ error: "Missing 'id'" }));
        return;
    }
    const idx = items.findIndex(i => i.id == r.args.id);
    if (idx === -1) {
        r.return(404, JSON.stringify({ error: "Item not found" }));
        return;
    }
    const deleted = items.splice(idx, 1);
    r.headersOut['Content-Type'] = 'application/json';
    r.return(200, JSON.stringify(deleted[0]));
}

export default { router };