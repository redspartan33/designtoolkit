import { describe, expect, it } from "vitest";
import { pngsToIco } from "./ico";

const fakePng = (n: number) =>
  new Uint8Array(Array.from({ length: n }, (_, i) => i % 256));

describe("pngsToIco", () => {
  it("lanza si no hay imágenes", () => {
    expect(() => pngsToIco([])).toThrow();
  });

  it("escribe la cabecera ICONDIR correcta", () => {
    const ico = pngsToIco([{ width: 32, height: 32, png: fakePng(10) }]);
    const view = new DataView(ico.buffer);
    expect(view.getUint16(0, true)).toBe(0); // reserved
    expect(view.getUint16(2, true)).toBe(1); // type icono
    expect(view.getUint16(4, true)).toBe(1); // 1 imagen
  });

  it("calcula tamaño total, offsets y dimensiones", () => {
    const a = fakePng(8);
    const b = fakePng(20);
    const ico = pngsToIco([
      { width: 16, height: 16, png: a },
      { width: 256, height: 256, png: b },
    ]);
    // 6 (header) + 16*2 (entries) + 8 + 20 (datos)
    expect(ico.length).toBe(6 + 32 + 28);

    const view = new DataView(ico.buffer);
    expect(view.getUint16(4, true)).toBe(2); // 2 imágenes

    // entrada 0
    expect(view.getUint8(6)).toBe(16); // width
    expect(view.getUint32(6 + 8, true)).toBe(8); // bytesInRes
    expect(view.getUint32(6 + 12, true)).toBe(38); // offset = 6 + 32

    // entrada 1: 256 se codifica como 0
    expect(view.getUint8(22)).toBe(0);
    expect(view.getUint32(22 + 12, true)).toBe(46); // 38 + 8
  });
});
