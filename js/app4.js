/*

curl -X POST "https://nginx.cis-vproxy.orb.local/app4/set?key=mytest" \
     -H "Content-Type: application/json" \
     -d '{"value":"Hello from Nginx njs111!"}'


*/


// Роутер
function router(r) {
    //r.log("app4 router! ",r);
    const routes = {
        "GET /app4/get": get,
        "GET /app4/set": set,
        "GET /app4/testlog": testlog,
    };

    const key = `${r.method} ${r.uri.split("?")[0]}`;
    if (routes[key]) {
        routes[key](r);
    } else {
        r.headersOut['Content-Type'] = 'application/json';
        r.return(404, JSON.stringify({ error: "Not Found" }));
    }
}

async function set(r) {
    var envVars = ngx.env || {}; // если undefined, создаём пустой объект
    var host = envVars.WEBDIS_HOST || "webdis";
    var port = envVars.WEBDIS_PORT || "7379";
    var key = r.args.key;
    var value = r.args.value;
    if (!key || !value) {
        r.return(400, JSON.stringify({ error: "Missing 'key' or 'value'" }));
        return;
    }
    r.log("ENV:", ngx.env)
    r.log("ENV:WEBDIS_HOST", host)
    r.log("ENV:WEBDIS_PORT", port)
    var resp = await ngx.fetch("http://"+host+":"+port+"/SET/" + key + "/" + encodeURIComponent(value));
    var body = await resp.text();
    r.headersOut["Content-Type"] = "application/json";
    r.return(resp.status, body || JSON.stringify({ error: "Empty body" }));
}

async function get(r) {
    var envVars = ngx.env || {}; // если undefined, создаём пустой объект
    var host = envVars.WEBDIS_HOST || "webdis";
    var port = envVars.WEBDIS_PORT || "7379";
    var key = r.args.key;
    if (!key) {
        r.return(400, JSON.stringify({ error: "Missing 'key'" }));
        return;
    }
    var resp = await ngx.fetch("http://"+host+":"+port+"/GET/" + key);
    var body = await resp.text();
    r.headersOut["Content-Type"] = "application/json";
    r.return(resp.status, body || JSON.stringify({ error: "Empty body" }));

}

async function testlog(r) {
    redisCommand("INCR/counter").then((result) => {
        rLog(r, ngx.INFO, "redisCommand ok:", result);
    }).catch((err) => {
        rLog(r, ngx.ERR, "Error in redisCommand:", err);
    });
    rLog(r, ngx.INFO, `[${r.method} ${r.uri}] Привет из ngx.log()`);
    rLog(r, ngx.INFO, "Привет из ngx.log() — видно в docker logs");
    rLog(r, ngx.INFO, JSON.stringify(ngx.env));
    rLog(r, ngx.INFO, "Привет из r.log() — тоже видно в docker logs");
    r.return(200, "Смотри docker logs");
}

async function redisCommand(command) {
    var envVars = ngx.env || {}; // если undefined, создаём пустой объект
    var host = envVars.WEBDIS_HOST || "webdis";
    var port = envVars.WEBDIS_PORT || "7379";
    var resp = await ngx.fetch("http://"+host+":"+port+"/"+command);
    var body = await resp.text();
    return body;
}

function rLog(r, level, message) {
    message = `[${r.method} ${r.uri}] ` + message;
    if (r && r.log) {
        r.log(message);
    } else {
        ngx.log(level, message);
    }
}

export default { router };