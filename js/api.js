function hello(r) {
    r.headersOut['Content-Type'] = 'application/json';
    r.return(200, JSON.stringify({ message: "Hello from Nginx njs API" }));
}

function echo(r) {
    let body = "";
    r.on('upload', chunk => body += chunk);
    r.on('uploadend', () => {
        try {
            let data = JSON.parse(body);
            r.headersOut['Content-Type'] = 'application/json';
            r.return(200, JSON.stringify({ received: data, status: "ok" }));
        } catch (e) {
            r.headersOut['Content-Type'] = 'application/json';
            r.return(400, JSON.stringify({ error: "Invalid JSON" }));
        }
    });
}

export default { hello, echo };