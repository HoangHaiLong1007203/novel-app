import crypto from "crypto";
import qs from "qs";
import AppError from "../middlewares/errorHandler.js";

const {
  VNPAY_TMN_CODE,
  VNPAY_HASH_SECRET,
  VNPAY_RETURN_URL,
  VNPAY_API_URL,
  FRONTEND_URL,
  VNPAY_RETURN_PATH,
} = process.env;

/* ----------------------------------
   Utils
----------------------------------- */

const buildDefaultReturnUrl = () => {
  if (VNPAY_RETURN_URL) return VNPAY_RETURN_URL;
  if (!FRONTEND_URL || !VNPAY_RETURN_PATH) return null;

  const base = FRONTEND_URL.endsWith("/") ? FRONTEND_URL.slice(0, -1) : FRONTEND_URL;
  const path = VNPAY_RETURN_PATH.startsWith("/")
    ? VNPAY_RETURN_PATH
    : `/${VNPAY_RETURN_PATH}`;
  return `${base}${path}`;
};

export const resolveVnpayReturnUrl = () => buildDefaultReturnUrl();

const ensureVnpayConfig = () => {
  const defaultReturnUrl = buildDefaultReturnUrl();
  if (!VNPAY_TMN_CODE || !VNPAY_HASH_SECRET || !defaultReturnUrl || !VNPAY_API_URL) {
    throw new AppError("Chưa cấu hình đầy đủ thông tin VNPAY", 500);
  }
};

const pad = (v) => (v < 10 ? `0${v}` : `${v}`);

const formatVnpayDate = (date = new Date()) =>
  [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("");

const sortFields = (input) =>
  Object.keys(input)
    .sort()
    .reduce((acc, key) => {
      acc[key] = input[key];
      return acc;
    }, {});

// Convert IPv6 loopback or IPv6-mapped IPv4 to plain IPv4
const ensureIPv4 = (ip) => {
  if (!ip) return "127.0.0.1";
  const ipv4FromList = ip.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
  if (ipv4FromList) return ipv4FromList[0];
  if (ip === "::1") return "127.0.0.1";
  const m = ip.match(/::ffff:(\d+\.\d+\.\d+\.\d+)/i);
  if (m) return m[1];
  return "127.0.0.1";
};

// Remove Vietnamese diacritics & unsafe chars
const sanitizeOrderInfo = (s) => {
  if (!s) return "Nap_xu";
  let out = s.normalize
    ? s.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    : s;
  out = out.replace(/\s+/g, "");
  out = out.replace(/[^A-Za-z0-9\-_]/g, "");
  return out || "Nap_xu";
};

/**
 * 🔐 VNPAY – SIGN DATA PHẢI URL-ENCODE
 */
const buildSecureHash = (payload) => {
  const sorted = sortFields(payload);
  const signData = qs.stringify(sorted, { encode: true });

  return crypto
    .createHmac("sha512", VNPAY_HASH_SECRET)
    .update(signData, "utf-8")
    .digest("hex");
};

/* ----------------------------------
   Create payment
----------------------------------- */

export const createVnpayPayment = ({
  amountVnd,
  orderInfo,
  txnRef,
  clientIp,
  returnUrl,
}) => {
  ensureVnpayConfig();

  if (!Number.isFinite(amountVnd) || amountVnd <= 0) {
    throw new AppError("Số tiền VNPAY không hợp lệ", 400);
  }

  const ref = txnRef || `${Date.now()}`;

  // VNPAY sandbox dùng GMT+7
  const now = new Date(Date.now() + 7 * 60 * 60 * 1000);

  const payload = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: VNPAY_TMN_CODE,
    vnp_Amount: Math.round(amountVnd * 100),
    vnp_CurrCode: "VND",
    vnp_TxnRef: ref,
    vnp_OrderInfo: sanitizeOrderInfo(orderInfo || "Nap_xu"),
    vnp_OrderType: "other",
    vnp_Locale: "vn",
    vnp_ReturnUrl: returnUrl || buildDefaultReturnUrl(),
    vnp_IpAddr: ensureIPv4(clientIp),
    vnp_CreateDate: formatVnpayDate(now),
  };

  const secureHash = buildSecureHash(payload);

  const paymentPayload = {
    ...payload,
    vnp_SecureHashType: "SHA512",
    vnp_SecureHash: secureHash,
  };

  const query = qs.stringify(paymentPayload, { encode: true });

  return {
    paymentUrl: `${VNPAY_API_URL}?${query}`,
    txnRef: ref,
  };
};

/* ----------------------------------
   Verify return
----------------------------------- */

export const verifyVnpayReturn = (queryParams = {}) => {
  ensureVnpayConfig();

  const receivedHash = queryParams.vnp_SecureHash;
  if (!receivedHash) {
    return { isValid: false };
  }

  const cloned = { ...queryParams };
  delete cloned.vnp_SecureHash;
  delete cloned.vnp_SecureHashType;

  const calculatedHash = buildSecureHash(cloned);

  return {
    isValid: calculatedHash === receivedHash,
    payload: cloned,
  };
};
