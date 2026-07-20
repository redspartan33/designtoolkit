// Encoder mínimo de .ico que envuelve una o varias imágenes PNG. El formato ICO
// admite PNG embebido y los navegadores modernos lo reconocen, así que no hace
// falta codificar BMP. Referencia del formato:
//   ICONDIR (6 bytes) + ICONDIRENTRY (16 bytes por imagen) + datos PNG.

export interface IcoImage {
  width: number;
  height: number;
  /** Bytes del PNG ya codificado. */
  png: Uint8Array;
}

export function pngsToIco(images: IcoImage[]): Uint8Array {
  if (images.length === 0) {
    throw new Error("pngsToIco requiere al menos una imagen");
  }

  const headerSize = 6;
  const entrySize = 16;
  const entriesSize = entrySize * images.length;
  const totalDataSize = images.reduce((sum, img) => sum + img.png.length, 0);
  const buffer = new ArrayBuffer(headerSize + entriesSize + totalDataSize);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  // ── ICONDIR ──────────────────────────────────────────────
  view.setUint16(0, 0, true); // reserved
  view.setUint16(2, 1, true); // type: 1 = icono
  view.setUint16(4, images.length, true); // número de imágenes

  let dataOffset = headerSize + entriesSize;
  images.forEach((img, i) => {
    const entryOffset = headerSize + i * entrySize;
    // width/height: 0 significa 256
    view.setUint8(entryOffset + 0, img.width >= 256 ? 0 : img.width);
    view.setUint8(entryOffset + 1, img.height >= 256 ? 0 : img.height);
    view.setUint8(entryOffset + 2, 0); // paleta de colores (0 = sin paleta)
    view.setUint8(entryOffset + 3, 0); // reserved
    view.setUint16(entryOffset + 4, 1, true); // planos de color
    view.setUint16(entryOffset + 6, 32, true); // bits por pixel
    view.setUint32(entryOffset + 8, img.png.length, true); // tamaño de datos
    view.setUint32(entryOffset + 12, dataOffset, true); // offset de datos

    bytes.set(img.png, dataOffset);
    dataOffset += img.png.length;
  });

  return bytes;
}
