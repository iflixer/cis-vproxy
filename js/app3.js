// Подключаем модуль файловой системы njs
var fs = require('fs');


/*

curl -X POST https://nginx.cis-vproxy.orb.local/app3/items \
     -H "Content-Type: application/json" \
     -d '{"name":"Apple"}'

*/

// Файл для хранения данных
const DATA_FILE = '/data/items.json';

// Читаем данные при старте
let items = [];
let nextId = 1;

function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            var raw = fs.readFileSync(DATA_FILE, 'utf8');
            items = JSON.parse(raw) || [];
            if (items.length > 0) {
                // Вместо Math.max(...array)
                nextId = Math.max.apply(null, items.map(function(i) { return i.id; })) + 1;
            }
        }
    } catch (e) {
        items = [];
        nextId = 1;
    }
}

// Сохраняем данные в файл
function saveData() {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2));
    } catch (e) {
        // Игнорируем ошибки записи
    }
}

// Роутер
function router(r) {
    const routes = {
        "GET /app3/items": getItems,
        "POST /app3/items": createItem,
        "PUT /app3/items": updateItem,
        "DELETE /app3/items": deleteItem
    };

    const key = `${r.method} ${r.uri.split("?")[0]}`;
    if (routes[key]) {
        routes[key](r);
    } else {
        r.headersOut['Content-Type'] = 'application/json';
        r.return(404, JSON.stringify({ error: "Not Found" }));
    }
}

// Получить элементы
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
    try {
        var data = JSON.parse(r.requestBody);
        r.log("bbb ",r.requestBody);
        if (!data.name) {
            r.return(400, JSON.stringify({ error: "Missing 'name'" }));
            return;
        }
        var id = Date.now();
        var item = { id: id, name: data.name };

        // Тут вместо Redis — просто тестовый массив
        items.push(item);

        r.headersOut['Content-Type'] = 'application/json';
        r.return(201, JSON.stringify(item));
    } catch (e) {
        r.return(400, JSON.stringify({ error: "Invalid JSON: " + e.message }));
    }
}

// Обновить элемент
function updateItem(r) {
    if (!r.args.id) {
        r.return(400, JSON.stringify({ error: "Missing 'id'" }));
        return;
    }
    try {
        var data = JSON.parse(r.requestBody);
        var idx = items.findIndex(function(i) { return i.id == r.args.id; });
        if (idx === -1) {
            r.return(404, JSON.stringify({ error: "Item not found" }));
            return;
        }
        if (data.name) {
            items[idx].name = data.name;
        }
        r.headersOut['Content-Type'] = 'application/json';
        r.return(200, JSON.stringify(items[idx]));
    } catch (e) {
        r.return(400, JSON.stringify({ error: "Invalid JSON" }));
    }
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
    saveData();
    r.headersOut['Content-Type'] = 'application/json';
    r.return(200, JSON.stringify(deleted[0]));
}

// Загружаем данные при старте контейнера
loadData();

export default { router };