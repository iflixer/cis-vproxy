
// $time = gmdate('YmdH', time()+60*60*$this->config['vdb_time']);	
// $sign_param = flix_user_ip();
		// if ($folder) {																						# если надо подписать всю папку
		// 	$sign = md5($parsed['path']."--".$time."-".$this->config['vdb_key']);												# подпись 
		// 	return $parsed['scheme']."://".$parsed['host'].$parsed['path'].$sign.":".$time."/".$parsed['file'];										# подписанная ссылка
		// } else {                                                                                                                                						# надо подписать каждый файл
		// 	$sign = md5($parsed['path'].$parsed['file']."-".$sign_param."-".$time."-".$this->config['vdb_key']);										# подпись 
		// 	return $parsed['scheme']."://".$parsed['host']."/".$sign.":".$time.$parsed['path'].$parsed['file'];										# подписанная ссылка
		// }

function rewrite_and_proxy(r) {
    // Исходный путь
    let originalUri = r.uri;
    r.log(`Исходный URI: ${originalUri}`); // /v1/movies/3b7bb1a5def1039f273ae545012e8a77a020d77a/a31d7b5731016c710484578043beed4e:2025080614/720.m3u8
    let originalUriParts = originalUri.split("/");
    let version = originalUriParts[1]; // v1
    let movieId = originalUriParts[2]; // 3b7bb1a5def1039f273ae545012e8a77a020d77a
    let fileName = originalUriParts.slice(3).join("/"); // a31d7b5731016c710484578043beed4e:2025080614/720.m3u8 

    // Получаем query-string
    // let qs = r.variables.args || "";

    // // Парсим query в объект
    // let params = {};
    // qs.split("&").forEach(kv => {
    //     if (!kv) return;
    //     var parts = kv.split("=");
    //     var key = parts[0];
    //     var val = parts.length > 1 ? parts[1] : "";
    //     params[key] = val;
    // });

    // Допустим, мы игнорируем старую подпись и делаем новую
    let ttl = 3600; // срок жизни токена 1 час
    let expires = Math.floor(Date.now() / 1000) + ttl;
    let newToken = makeToken(originalUri, expires);

    // Формируем новый URL для origin
    // Здесь origin.example.com — это твой бэкенд с видео
    // https://rock.storage.kinohd.co/movies/3b7bb1a5def1039f273ae545012e8a77a020d77a/a31d7b5731016c710484578043beed4e:2025080614/720.m3u8
    // let newUrl = `https://rock.storage.kinohd.co${originalUri}?token=${newToken}&expires=${expires}`;
    // return $parsed['scheme']."://".$parsed['host']."/".$sign.":".$time.$parsed['path'].$parsed['file'];	
    let newUrl = `https://rock.storage.kinohd.co${originalUri}?token=${newToken}&expires=${expires}`;

    // Логируем для отладки
    r.log(`Переподписанный URL: ${newUrl}`);

    // Передаём URL в nginx переменную
    r.variables.new_signed_url = newUrl;

    // Редиректим во внутренний location для проксирования
    r.internalRedirect("@backend");
}

function makeToken(path, expires) {
    // Здесь твой алгоритм подписи
    // Для примера — просто Base64 от "path:expires:secret"
    let secret = "MY_SECRET_KEY";
    let raw = `${path}:${expires}:${secret}`;
    let b64 = Buffer.from(raw).toString("base64url");
    return b64;
}

export default { rewrite_and_proxy };