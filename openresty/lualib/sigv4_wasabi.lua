-- sigv4_wasabi.lua
local _M = {}

local openssl_hmac = require "resty.openssl.hmac"
local sha256 = require "resty.sha256"
local str = require "resty.string"

local function sha256_hex(data)
  local s = sha256:new()
  s:update(data or "")
  return str.to_hex(s:final())
end

local function hmac_sha256(key, data, raw)
  local hm, err = openssl_hmac.new(key, "sha256")
  if not hm then return nil, err end
  local ok, upderr = hm:update(data)
  if not ok then return nil, upderr end
  local out, finerr = hm:final() -- binary
  if not out then return nil, finerr end
  if not raw then
    return str.to_hex(out)
  end
  return out
end

local function aws_time()
  local now = os.time()
  return os.date("!%Y%m%dT%H%M%SZ", now), os.date("!%Y%m%d", now)
end

local function canonical_query()
  local args = ngx.req.get_uri_args()
  local parts = {}

  for k, v in pairs(args) do
    local ek = ngx.escape_uri(k)
    if type(v) == "table" then
      for _, vv in ipairs(v) do
        table.insert(parts, ek .. "=" .. ngx.escape_uri(vv))
      end
    elseif v == true then
      -- параметр без значения ?flag
      table.insert(parts, ek .. "=")
    else
      table.insert(parts, ek .. "=" .. ngx.escape_uri(v))
    end
  end

  table.sort(parts)
  return table.concat(parts, "&")
end

function _M.sign_request()
  local access_key = os.getenv("S3_VIDEO_STORAGE_ACCESS_KEY")
  local secret_key = os.getenv("S3_VIDEO_STORAGE_SECRET_KEY")
  if not access_key or not secret_key then
    ngx.log(ngx.ERR, "S3_VIDEO_STORAGE_ACCESS_KEY/SECRET_KEY not set")
    return ngx.exit(500)
  end

  local method  = ngx.req.get_method()
  local bucket  = ngx.var.s3_bucket
  local region  = ngx.var.s3_region
  local service = ngx.var.s3_service
  local host    = ngx.var.s3_host
  local key     = ngx.var.s3_key

  local amz_date, date_stamp = aws_time()

  -- Для GET/HEAD обычно достаточно UNSIGNED-PAYLOAD
  local payload_hash = "UNSIGNED-PAYLOAD"

  ngx.req.set_header("x-amz-date", amz_date)
  ngx.req.set_header("x-amz-content-sha256", payload_hash)

  -- Canonical URI: обязательно с ведущим /
  -- Внимание: key должен быть уже URL-path-safe (если есть пробелы/юникод — лучше нормализовать на входе)
  local canonical_uri = "/" .. key

  local canonical_qs = canonical_query()

  local canonical_headers =
      "host:" .. host .. "\n" ..
      "x-amz-content-sha256:" .. payload_hash .. "\n" ..
      "x-amz-date:" .. amz_date .. "\n"

  local signed_headers = "host;x-amz-content-sha256;x-amz-date"

  local canonical_request =
      method .. "\n" ..
      canonical_uri .. "\n" ..
      canonical_qs .. "\n" ..
      canonical_headers .. "\n" ..
      signed_headers .. "\n" ..
      payload_hash

  local algorithm = "AWS4-HMAC-SHA256"
  local credential_scope = date_stamp .. "/" .. region .. "/" .. service .. "/aws4_request"
  local string_to_sign =
      algorithm .. "\n" ..
      amz_date .. "\n" ..
      credential_scope .. "\n" ..
      sha256_hex(canonical_request)

  local k_date = assert(hmac_sha256("AWS4" .. secret_key, date_stamp, true))
  local k_region = assert(hmac_sha256(k_date, region, true))
  local k_service = assert(hmac_sha256(k_region, service, true))
  local k_signing = assert(hmac_sha256(k_service, "aws4_request", true))

  local signature_bin = assert(hmac_sha256(k_signing, string_to_sign, true))
  local signature = str.to_hex(signature_bin)

  local authorization =
      algorithm .. " " ..
      "Credential=" .. access_key .. "/" .. credential_scope .. ", " ..
      "SignedHeaders=" .. signed_headers .. ", " ..
      "Signature=" .. signature

  ngx.req.set_header("Authorization", authorization)
end

return _M