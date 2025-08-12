// Наш "мини-фреймворк"
function router(r) {
    const routes = {
        "GET /app": home,
        "GET /app/hello": hello,
        "GET /app/user": getUser,
        "POST /app/echo": echo
    };

    const key = `${r.method} ${r.uri.split("?")[0]}`;
    if (routes[key]) {
        routes[key](r);
    } else {
        r.headersOut['Content-Type'] = 'application/json';
        r.return(404, JSON.stringify({ error: "Not Found" }));
    }
}

// Главная страница
function home(r) {
    r.headersOut['Content-Type'] = 'application/json';
    r.return(200, JSON.stringify({ message: "Welcome to Nginx njs API" }));
}

// Приветствие
function hello(r) {
    const name = r.args.name || "Guest";
    r.headersOut['Content-Type'] = 'application/json';
    r.return(200, JSON.stringify({ message: `Hello, ${name}!` }));
}

// Получить пользователя по ID (?id=123)
function getUser(r) {
    const id = r.args.id;
    if (!id) {
        r.return(400, JSON.stringify({ error: "Missing 'id' parameter" }));
        return;
    }
    r.headersOut['Content-Type'] = 'application/json';
    r.return(200, JSON.stringify({ id: id, name: "User " + id }));
}

// Эхо POST JSON
function echo(r) {
    let body = "";
    r.on('upload', chunk => body += chunk);
    r.on('uploadend', () => {
        try {
            const data = JSON.parse(body);
            r.headersOut['Content-Type'] = 'application/json';
            r.return(200, JSON.stringify({ received: data, status: "ok" }));
        } catch (e) {
            r.headersOut['Content-Type'] = 'application/json';
            r.return(400, JSON.stringify({ error: "Invalid JSON" }));
        }
    });
}

export default { router };