// предзагрузка следующего сегмента TS при MISS
// например если плеер запросил /289.ts - скорее всего он запросит /290.ts, так что мы его предзагрузим и в плеере он будет HIT
// /noise/movies/7aae94ccbe20920b159524e717d186c210d24b17/6853d794902a95dd40c79f48b7edca1c:2026022213/1080.mp4:hls:seg-202-v1-a1.ts

function prefetch(r) {
  // 1) стоп-кран: если это уже префетч — не префетчим
  if (r.args && r.args.pf === "1") {
    return r.return(204);
  }
  // доп. стоп-кран по UA (на всякий)
  const ua = (r.headersIn["User-Agent"] || "");
  if (ua.startsWith("prefetcher/")) {
    return r.return(204);
  }

  const orig = r.variables.request_uri || "";
  const m = orig.match(/seg-(\d+)-/);
  if (!m) return r.return(204);

  const n = parseInt(m[1], 10);
  const next = orig.replace(/seg-\d+-/, `seg-${n + 1}-`);

  ngx.fetch("http://127.0.0.1:8080" + `${next}?pf=1`, {
    method: "GET",
    headers: {
      "Host": r.headersIn.host,
      "User-Agent": "prefetcher/1.0",
      "Accept": "*/*"
    }
  }).catch(_ => { /* игнорируем ошибки, например если сегмент уже в кеше */ });

  return r.return(204);
}


function jlog(r, level, msg, extra) {
  extra = extra || {};
  try {
    var o = {
      ts: (new Date()).toISOString(),
      level: level,
      msg: msg,
      uri: r.uri,
      args: r.args || ""
    };
    // примитивное merge
    for (var k in extra) {
      if (Object.prototype.hasOwnProperty.call(extra, k)) {
        o[k] = extra[k];
      }
    }
    r.error(JSON.stringify(o));
  } catch (e) {
    r.error("jlog failed: " + e);
  }
}

export default { prefetch };