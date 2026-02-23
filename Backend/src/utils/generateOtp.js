import crypto from "crypto";

export default () => crypto.randomInt(100000, 999999).toString();
