class t {
  constructor(t3 = {}) {
    this.t = t3, this.i = new (typeof TextEncoder != "undefined" ? TextEncoder : require("util").TextEncoder)();
  }
  encode(t3) {
    const r2 = this.h(t3), e2 = r2.reduce((t4, r3) => t4 + r3.byteLength, 0), s2 = new Uint8Array(e2), i2 = {array: s2, view: new DataView(s2.buffer)};
    let n = 0;
    for (const t4 of r2)
      t4.storer(i2, n), n += t4.byteLength;
    return s2.buffer;
  }
  h(t3) {
    const r2 = this.u(t3);
    return [this.o(r2), ...this.l(t3, r2)];
  }
  l(t3, r2) {
    let e2, s2;
    switch (r2) {
      case "C":
        return e2 = t3.charCodeAt(), [this.p(({view: t4}, r3) => t4.setInt8(r3, e2), 1)];
      case "S":
        return s2 = this.i.encode(t3), [...this.h(s2.byteLength), this.A(s2)];
      case "i":
        return [this.p(({view: r3}, e3) => r3.setInt8(e3, t3), 1)];
      case "U":
        return [this.p(({view: r3}, e3) => r3.setUint8(e3, t3), 1)];
      case "I":
        return [this.p(({view: r3}, e3) => r3.setInt16(e3, t3), 2)];
      case "l":
        return [this.p(({view: r3}, e3) => r3.setInt32(e3, t3), 4)];
      case "d":
        return [this.p(({view: r3}, e3) => r3.setFloat32(e3, t3), 4)];
      case "D":
        return [this.p(({view: r3}, e3) => r3.setFloat64(e3, t3), 8)];
      case "[":
        return this._(t3);
      case "{":
        return this.v(t3);
    }
    return [];
  }
  u(t3) {
    if (t3 === null)
      return "Z";
    switch (typeof t3) {
      case "undefined":
        return "N";
      case "boolean":
        return t3 ? "T" : "F";
      case "string":
        return t3.length === 1 && t3.charCodeAt() <= 127 ? "C" : "S";
      case "number":
        if (Number.isInteger(t3)) {
          if (-128 <= t3 && t3 <= 127)
            return "i";
          if (0 <= t3 && t3 <= 255)
            return "U";
          if (-32768 <= t3 && t3 <= 32767)
            return "I";
          if (-2147483648 <= t3 && t3 <= 2147483647)
            return "l";
        }
        return Number.isNaN(t3) || Math.fround(t3) === t3 ? "d" : "D";
      case "object":
        return Array.isArray(t3) || ArrayBuffer.isView(t3) ? "[" : "{";
    }
    throw Error("Value cannot be serialized");
  }
  _(t3) {
    let r2;
    if ((this.t.optimizeArrays === true || this.t.optimizeArrays === "onlyTypedArrays") && ArrayBuffer.isView(t3))
      switch (t3.constructor.name) {
        case "Int8Array":
          return [].concat(this.I("i", t3.length), this.A(t3));
        case "Uint8Array":
          return [].concat(this.I("U", t3.length), this.A(t3));
        case "Int16Array":
          r2 = "I";
          break;
        case "Int32Array":
          r2 = "l";
          break;
        case "Float32Array":
          r2 = "d";
          break;
        case "Float64Array":
          r2 = "D";
      }
    const e2 = (Array.isArray(t3) ? t3 : Array.from(t3)).map((t4) => ({type: r2 || this.u(t4), value: t4}));
    return this.U(e2, "]", r2 || this.t.optimizeArrays === true);
  }
  v(t3) {
    const r2 = Object.entries(t3).map((t4) => ({key: t4[0], type: this.u(t4[1]), value: t4[1]}));
    return this.U(r2, "}", this.t.optimizeObjects === true);
  }
  I(t3, r2) {
    const e2 = [];
    return r2 != null && (t3 && e2.push(this.o("$"), this.o(t3)), e2.push(this.o("#"), ...this.h(r2))), e2;
  }
  U(t3, r2, e2) {
    let s2, i2;
    e2 && (t3.length && (s2 = this.k(t3)), i2 = t3.length);
    const n = this.I(s2, i2);
    for (const r3 of t3)
      r3.key != null && r3.type !== "N" && n.push(...this.l(r3.key, "S")), !s2 && n.push(this.o(r3.type)), n.push(...this.l(r3.value, s2 || r3.type));
    return i2 == null && n.push(this.o(r2)), n;
  }
  k(t3) {
    const r2 = t3.map((t4) => t4.type).reduce(this.T);
    return r2 === "U" && t3.some((t4) => t4.value < 0) ? "I" : r2;
  }
  T(t3, r2) {
    if (t3 === r2)
      return t3;
    if (!t3)
      return null;
    const e2 = (e3) => e3[Math.min(e3.indexOf(t3), e3.indexOf(r2))];
    return e2("Dd") || e2("SC") || e2("lIUi");
  }
  o(t3) {
    return this.p(({view: r2}, e2) => r2.setInt8(e2, t3.charCodeAt()), 1);
  }
  A(t3) {
    return this.p(({array: r2}, e2) => r2.set(t3, e2), t3.byteLength);
  }
  p(t3, r2) {
    return {storer: t3, byteLength: r2};
  }
}
class r {
  constructor(t2 = {}) {
    this.t = t2, this.g = new (typeof TextDecoder != "undefined" ? TextDecoder : require("util").TextDecoder)();
  }
  decode(t2) {
    const r3 = new Uint8Array(t2), e2 = new DataView(r3.buffer);
    return this.D = {array: r3, view: e2}, this.S = 0, this.C();
  }
  C(t2 = this.m(false)) {
    switch (t2) {
      case "Z":
        return null;
      case "N":
        return;
      case "T":
        return true;
      case "F":
        return false;
      case "i":
        return this.F(({view: t3}, r3) => t3.getInt8(r3), 1);
      case "U":
        return this.F(({view: t3}, r3) => t3.getUint8(r3), 1);
      case "I":
        return this.F(({view: t3}, r3) => t3.getInt16(r3), 2);
      case "l":
        return this.F(({view: t3}, r3) => t3.getInt32(r3), 4);
      case "L":
        return this.N(8, this.t.int64Handling, true);
      case "d":
        return this.F(({view: t3}, r3) => t3.getFloat32(r3), 4);
      case "D":
        return this.F(({view: t3}, r3) => t3.getFloat64(r3), 8);
      case "H":
        return this.N(this.V(), this.t.highPrecisionNumberHandling, false);
      case "C":
        return String.fromCharCode(this.C("i"));
      case "S":
        return this.j(this.V());
      case "[":
        return this.M();
      case "{":
        return this.O();
    }
    throw Error("Unexpected type");
  }
  Z() {
    let t2, r3;
    switch (this.m(true)) {
      case "$":
        if (this.q(), t2 = this.m(false), this.m(true) !== "#")
          throw Error("Expected count marker");
      case "#":
        this.q(), r3 = this.V();
    }
    return {type: t2, count: r3};
  }
  M() {
    const {type: t2, count: r3} = this.Z();
    if ("ZTF".indexOf(t2) !== -1)
      return Array(r3).fill(this.C(t2));
    if (this.t.useTypedArrays)
      switch (t2) {
        case "i":
          return this.B(r3);
        case "U":
          return this.L(r3);
        case "I":
          return Int16Array.from({length: r3}, () => this.C(t2));
        case "l":
          return Int32Array.from({length: r3}, () => this.C(t2));
        case "d":
          return Float32Array.from({length: r3}, () => this.C(t2));
        case "D":
          return Float64Array.from({length: r3}, () => this.C(t2));
      }
    if (r3 != null) {
      const e2 = Array(r3);
      for (let s2 = 0; s2 < r3; s2++)
        e2[s2] = this.C(t2);
      return e2;
    }
    {
      const t3 = [];
      for (; this.m(true) !== "]"; )
        t3.push(this.C());
      return this.q(), t3;
    }
  }
  O() {
    const {type: t2, count: r3} = this.Z(), e2 = {};
    if (r3 != null)
      for (let s2 = 0; s2 < r3; s2++)
        e2[this.C("S")] = this.C(t2);
    else {
      for (; this.m(true) !== "}"; )
        e2[this.C("S")] = this.C();
      this.q();
    }
    return e2;
  }
  V() {
    const t2 = this.C();
    if (Number.isInteger(t2) && t2 >= 0)
      return t2;
    throw Error("Invalid length/count");
  }
  N(t2, r3, e2) {
    if (typeof r3 == "function")
      return this.F(r3, t2);
    switch (r3) {
      case "skip":
        return void this.q(t2);
      case "raw":
        return e2 ? this.L(t2) : this.j(t2);
    }
    throw Error("Unsuported type");
  }
  L(t2) {
    return this.F(({array: r3}, e2) => new Uint8Array(r3.buffer, e2, t2), t2);
  }
  B(t2) {
    return this.F(({array: r3}, e2) => new Int8Array(r3.buffer, e2, t2), t2);
  }
  j(t2) {
    return this.F(({array: r3}, e2) => this.g.decode(new DataView(r3.buffer, e2, t2)), t2);
  }
  q(t2 = 1) {
    this.R(t2), this.S += t2;
  }
  m(t2) {
    const {array: r3, view: e2} = this.D;
    let s2 = "N";
    for (; s2 === "N" && this.S < r3.byteLength; )
      s2 = String.fromCharCode(e2.getInt8(this.S++));
    return t2 && this.S--, s2;
  }
  F(t2, r3) {
    this.R(r3);
    const e2 = t2(this.D, this.S, r3);
    return this.S += r3, e2;
  }
  R(t2) {
    if (this.S + t2 > this.D.array.byteLength)
      throw Error("Unexpected EOF");
  }
}
function e(r2, e2) {
  return new t(e2).encode(r2);
}
function s(t2, e2) {
  return new r(e2).decode(t2);
}
const i = {encode: e, decode: s};
export {i as Ubjson, r as UbjsonDecoder, t as UbjsonEncoder, s as decode, e as encode};
export default null;
