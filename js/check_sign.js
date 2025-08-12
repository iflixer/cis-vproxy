var crypto = require('crypto'); // njs встроенный объект, md5 есть через crypto.createHash

// Секрет должен совпадать с бекендом
var secret = "BKkdZwqW2F87";

function md5hex(str) {
    return crypto.createHash('md5').update(str).digest('hex');
}

function check_sign(r) {
    var filepath = "/" +r.variables.filepath + "/";
    var sign = r.variables.sign;
    var time = r.variables.time;
    var filename = r.variables.filename;
    r.log(`real_client_ip: ${r.variables.real_client_ip}`);

    
    var tohash = filepath + "--" + time + "-" + secret; 
    // TODO: если не m3u8, то добавляем IP клиента
    // if (!url.endsWith(".m3u8")) {
    //     tohash = filepath + filename + "-" + r.variables.real_client_ip + "-" + time + "-" + secret;
    // }
    // $parsed['scheme']."://".$parsed['host']."/".$sign.":".$time.$parsed['path'].$parsed['file'];
    var expected = md5hex(tohash);
    r.log(`Проверка подписи: ${tohash}`);
    r.log(`expected: ${expected}`);
    r.log(`sign: ${sign}`);									

    if (expected === sign) {
        return filepath + filename;
    }
    return "0";
}

export default { check_sign };