// предзагрузка следующего сегмента TS при MISS
// например если плеер запросил /indi/5199/17698/203017/out289.ts - скорее всего он запросит /indi/5199/17698/203017/out290.ts, так что мы его предзагрузим и в плеере он будет HIT
// /etc/nginx/js/prefetch.js

function isPf(r) {
  const a = r.args;
  if (!a) return false;
  if (typeof a === "string") return a.indexOf("pf=1") !== -1;
  return a.pf === "1"; // если args объект
}

function header(r) {
  try {
    r.ctx = r.ctx || {};

    // только для успешных ответов от апстрима, если там ошибка - не надо предзагружать, скорее всего и следующий сегмент тоже будет с ошибкой
    if (r.status != 200 && r.status != 206) return;

    // только для MISS, если уже HIT или EXPIRED - значит кто-то другой уже предзагрузил, не надо лишний раз
    // если раскомментировать - префетч будет через раз (hit, miss, hit, miss, ...), если закомментировать - будет для всех MISS
    //if (r.variables.upstream_cache_status !== "MISS") return;

    // не префетчим префетч-запросы
    if (isPf(r)) return;

    // один раз на запрос
    if (r.ctx.prefetch_started) return;
    r.ctx.prefetch_started = true;

    const m = (r.uri || "").match(/^(.*\/out)(\d+)(\.ts)$/i);
    if (!m) return;

    const n = Number(m[2]);
    if (!Number.isFinite(n)) return;

    const nextUri = `${m[1]}${n + 1}${m[3]}`;

    // КЛЮЧ: detached, без callback => nginx не буферизует тело сабреквеста
    r.subrequest(`${nextUri}?pf=1`, { method: "GET", detached: true });

    //r.warn(`prefetch scheduled: ${nextUri}?pf=1`);
    //jlog(r, "warn", "prefetch scheduled", { next: nextUri + "?pf=1" });
  } catch (e) {
    jlog(r, "error", "prefetch exception", { error: String(e) });
  }
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

export default { header };