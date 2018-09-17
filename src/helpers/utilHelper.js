const { parse } = require("querystring");
const multipart = require("parse-multipart");

module.exports = {
  DIRECTION_LEFT: 1,
  DIRECTION_RIGHT: 2,
  DEBUG: true,

  log(msg) {
    if (this.DEBUG) {
      console.log(msg);
    }
  },
  isString(val) {
    return typeof val == "string";
  },
  isNumber(val) {
    return typeof val == "number";
  },
  sanitize(val) {
    let type = typeof val;
    if (type == "number") {
      return val;
    } else if (type == "string") {
      if (val) {
        return val.trim().replace(/(<([^>]+)>)/gi, "");
      }
    }
    return "";
  },
  padNumber(num, padlen) {
    let pad = new Array(1 + padlen).join(0);
    return (pad + num).slice(-pad.length);
  },
  clamp(val, minVal, maxVal) {
    if (!isNaN(val)) {
      let value = parseInt(val);
      if (value > maxVal) {
        return maxVal;
      } else if (value < minVal) {
        return minVal;
      }
    } //if is number
    return val;
  },
  replaceCharAt(str, index, replacement) {
    return (
      str.substr(0, index) +
      replacement +
      str.substr(index + replacement.length)
    );
  },
  removePad(str, padChar, direction = this.DIRECTION_LEFT) {
    if (!this.isString()) {
      str += "";
    }
    let len = str.length;
    let counter = 0;
    switch (direction) {
      case this.DIRECTION_LEFT:
        while (counter < len - 1) {
          if (str.charAt(counter) == padChar) {
            str = this.replaceCharAt(str, counter, " ");
          } else {
            break;
          }
          ++counter;
        }
        break;
      case this.DIRECTION_RIGHT:
        while (counter < len - 1) {
          if (str.charAt(len - counter - 1) == padChar) {
            str = this.replaceCharAt(str, len - counter - 1, " ");
          } else {
            break;
          }
          ++counter;
        }
        break;
    }
    return str.trim();
  },
  getJsonContent(jsonBody, param) {
    let value = "";
    try {
      value = JSON.parse(jsonBody);
    } catch (error) {
      return jsonBody;
    }

    let result = value[param];
    if (!result) {
      return "";
    }
    return result;
  },
  getRequestBody(param, body, contentType) {
    let contentTypeU = this.sanitize(contentType).toUpperCase();
    let split = contentTypeU.split("; ");
    if (contentTypeU == "APPLICATION/JSON") {
      return this.getJsonContent(body, param);
    } else if (split.length > 1 && split[0] == "MULTIPART/FORM-DATA") {
      let boundary = multipart.getBoundary(contentType);
      let boundaryInner = boundary.replace(/-/g, "");
      let parts = this.sanitize(
        body
          .replace(/\r\nContent-Disposition: form-data; /g, "")
          .replace(/--/g, "")
          .replace(/\r/g, "")
          .replace(/\n/g, "")
      ).split(boundaryInner);
      for (let i = 1; i < parts.length - 1; ++i) {
        let first = parts[i].indexOf('"') + 1;
        let second = parts[i].indexOf('"', first) + 1;
        let name = parts[i].substr(first, second - first - 1);
        console.log(name);
        if (name == param) {
          return parts[i].substr(second, parts[i].length);
        }
      }
    }
    return "";
  }
};
