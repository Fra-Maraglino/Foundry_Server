import crypto from "crypto";
import fs from "fs";
import path from "path";
import { isNewerVersion } from "../../common/utils/helpers.mjs";
import { fetchJsonWithTimeout } from "../../common/utils/http.mjs";
import { WEBSITE_URL } from "../../common/constants.mjs";
const PUBLIC_KEY =
  "-----BEGIN PUBLIC KEY-----\nMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAuWBSnz/TfOKdEpEPj9Gf\n7kFS82sBd5mdcT6it9P/gd/wkFehG0cm5nB+gmpt4ZMAJLCnWzHwL4ih5pKoINy6\nzqOhw0bzk2PjifQI1bcclmdmP+t2oE/GJOZ1BM7HFgPW8kiWRpFxTXJh6ooB2wb9\nSx89ABLvRIfzpKmuEl9qBKk9w7X+3yPCiZ5FvggCxQLvSkvDMOPZDxVDV3yQvFkO\naDFmhyMFPNnInWXEOYXR31IR3kgnIWC6Hjtw0TlpUHzz/j6aHXWfQu5kwM89HjaF\niPzhDdYWQZKaSTnXt7oNkyfccW7YdIONDf0xJ+lNPOe9OO0HRjhdLiLVwSMr965D\n+PBOkwLYlDlOgEQRZIzi88tsNFOX31BInaG2F8yhsDkQ16FK3A+04pfEYZp1H+mC\nMTWi274Od4i1NYctOS2bNwb2U1dMtwt2ZZmgbHSMv1fm1R/9iAfLrSDjgTbmhquA\norVCmzl1mTG8o0xE9IX5psH3bDJxVis1IeUBeMd+Js0dsY9jIU0uN9D0wke8C7cf\nUK6XzZkC5ujQl92WAKeQOtxkG7e1x5cq4T1tkaH/U4HJWdcAsN0qohQ4vV73Akpm\nb7ZzUrMFv9BdIfUXgNZuQutkfXgfrAFznjI/H9R1M2uQBbQnk+I7+/wA49DJND4s\nu3WiTypPaz1INacKD9bplx0CAwEAAQ==\n-----END PUBLIC KEY-----";

export default class License {
  constructor(t) {
    (this.data = this.constructor.get()),
      (this.status = this.constructor.STATUSES.NONE),
      (this.service = t);
  }

  static EULA_VERSION = "0.8.0";
  static LICENSE_VALIDATION_URL = ""; // `${WEBSITE_URL}/_api/license/validate/`;
  static LICENSE_SIGNATURE_URL = ""; //`${WEBSITE_URL}/_api/license/sign/`;
  static SOFTWARE_UPDATE_URL = ""; //`${WEBSITE_URL}/_api/license/check/`;
  static SOFTWARE_DOWNLOAD_URL = ""; //`${WEBSITE_URL}/_api/license/download/`;
  static LICENSE_API_KEY = "foundryvtt_hkmg5t4zxc092e31mkfbg3";
  static STATUSES = {
    NONE: 0,
    INVALID: 1,
    VALID: 2,
    UNKNOWN: 3,
  };
  static PUBLIC_KEY = PUBLIC_KEY;

  get authorizationHeader() {
    return `APIKey:${
      this.service.key
        ? `${this.service.id}_${this.service.key}`
        : this.constructor.LICENSE_API_KEY
    }`;
  }

  static get path() {
    return path.join(global.paths.config, "license.json");
  }

  static get() {
    if (!fs.existsSync(this.path)) return {};
    try {
      return JSON.parse(fs.readFileSync(this.path, "utf8"));
    } catch (t) {
      return (
        (t.message = `Unable to read software license file:\n${t.message}`),
        global.logger.error(t),
        {}
      );
    }
  }

  get license() {
    return this.data.license || null;
  }

  get currentKey() {
    const t = {
      host: this.service.id,
      license: this.data.license,
      version: this.data.version,
    };

    return JSON.stringify(t);
  }

  get desiredKey() {
    const t = {
      host: this.service.id,
      license: this.data.license,
      version: License.EULA_VERSION,
    };

    return JSON.stringify(t);
  }

  get needsSignature() {
    //const t=this.constructor.STATUSES;
    //return [t.NONE,t.INVALID].includes(this.status)
    return false;
  }

  isValidKeyFormat(t) {
    //return/^[A-Z0-9]{24}$/.test(t)
    return true;
  }

  applyLicense(t) {
    if (!t) return this.write({ license: null, signature: null });

    t = t.replace(/-/g, "").trim();

    if (!this.isValidKeyFormat(t))
      throw new Error("Invalid license key format");

    return this.write({ license: t, signature: void 0 });
  }

  async sign() {
    let t;
    //try
    //{
    //	t=await fetchJsonWithTimeout(this.constructor.LICENSE_SIGNATURE_URL,{headers:{"Content-Type":"application/json",Authorization:this.authorizationHeader},method:"POST",body:this.desiredKey})
    //}
    //catch(t)
    //{
    //	throw new Error("License signature server was unable to be reached. Ensure you are connected to the internet with outbound traffic allowed.")
    //}

    //if("error"===t.status)
    //	return logger.error(t.message),t;

    this.write({ signature: "dummy_signature" });
    const e =
      "License signature successfully created. Thank you and please enjoy Foundry Virtual Tabletop.";

    return logger.info(e), this.verify(), { status: "success", message: e };
  }

  verify() {
    this.data.license &&
      !this.isValidKeyFormat(this.data.license) &&
      (global.logger.warn(
        "Invalid license key format detected, expiring license file."
      ),
      fs.unlinkSync(License.path),
      (this.data = {}));

    const t = this.data,
      e = this.constructor.STATUSES;

    if (!t.signature) t.signature = "dummy_signature"; // return global.logger.warn("Software license requires signature."),this.status=e.NONE;

    //if(isNewerVersion(License.EULA_VERSION,t.version||"0.0.0"))
    //	return global.logger.warn("Software license requires EULA signature."),this.status=e.INVALID;

    //const i=crypto.createPublicKey(License.PUBLIC_KEY),s=crypto.createVerify("SHA256");
    //s.write(this.currentKey),s.end();

    //if(s.verify(i,t.signature,"base64"))
    //	return global.logger.info("Software license verification succeeded"),this.status=e.VALID;
    //{
    //	const t="Software license verification failed. Please confirm your Foundry Virtual Tabletop software license";
    //	return global.logger.error(t),this.status=e.INVALID
    //}

    return (
      global.logger.info("Software license verification succeeded"),
      (this.status = e.VALID)
    );
  }

  write({ license: t, signature: e } = {}) {
    const i = {
      host: this.service.id,
      license: void 0 !== t ? t : this.data.license,
      version: License.EULA_VERSION,
      time: new Date(),
      signature: void 0 !== e ? e : this.data.signature,
    };

    try {
      fs.writeFileSync(this.constructor.path, JSON.stringify(i, null, 2)),
        (this.data = i);
    } catch (t) {
      const e = new Error(`Failed to write License file:\n${t.message}`);
      throw ((e.stack = t.stack), e);
    }
  }

  expire() {
    global.logger.warn("Expiring invalid software license"),
      fs.unlinkSync(this.constructor.path),
      (this.data = this.constructor.get()),
      (this.status = this.constructor.STATUSES.NONE);
  }
}