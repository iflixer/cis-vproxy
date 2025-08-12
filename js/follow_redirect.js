async function follow(r) {
    const loc = r.variables.upstream_http_location;

    if (!loc) {
        r.return(500, "No Location header from upstream");
        return;
    }

    // Делаем запрос по Location
    let res = await r.subrequest(loc, { method: "GET" });

    // Пробрасываем основные заголовки
    const headers = [
        "Content-Type",
        "Content-Length",
        "Cache-Control",
        "Last-Modified",
        "Accept-Ranges",
        "ETag",
        "Expires"
    ];

    headers.forEach(h => {
        let v = res.headersIn[h];
        if (v) {
            r.headersOut[h] = v;
        }
    });
    r.log(`redirect status: ${res.status}`);

    r.return(res.status, res.responseBody);
}

export default { follow };